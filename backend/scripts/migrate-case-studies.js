const fs = require('fs');
const path = require('path');
const CaseStudy = require('../models/CaseStudy');
const { query } = require('../database/config');

async function migrateCaseStudies() {
  console.log('🚀 Starting case studies migration...');
  
  // Check CLEAN_DB environment variable
  const shouldCleanDB = process.env.CLEAN_DB === 'true' || process.env.CLEAN_DB === 'TRUE';
  console.log(`🎛️ CLEAN_DB setting: ${shouldCleanDB ? 'TRUE (will clean database)' : 'FALSE (will preserve historical data)'}`);
  
  try {
    // 1. Handle database cleaning if requested
    if (shouldCleanDB) {
      console.log('\n🧹 CLEAN_DB=TRUE detected - Starting database cleanup...');
      console.log('⚠️ WARNING: This will delete ALL historical data including evaluations and transcripts');
      
      // Get counts before deletion for logging
      const evaluationsCount = await query('SELECT COUNT(*) as count FROM evaluations');
      const transcriptsCount = await query('SELECT COUNT(*) as count FROM transcripts');
      const caseStudiesCount = await query('SELECT COUNT(*) as count FROM case_studies');
      
      console.log(`📊 Current data counts:`);
      console.log(`  - Evaluations: ${evaluationsCount.rows[0].count}`);
      console.log(`  - Transcripts: ${transcriptsCount.rows[0].count}`);
      console.log(`  - Case Studies: ${caseStudiesCount.rows[0].count}`);
      
      // Delete in correct order respecting foreign keys
      console.log('\n🗑️ Deleting data in safe order (respecting foreign keys)...');
      
      // Step 1: Delete evaluations first (has FKs to case_studies, transcripts, users)
      console.log('1️⃣ Deleting evaluations...');
      const deletedEvaluations = await query('DELETE FROM evaluations');
      console.log(`   ✅ Deleted ${deletedEvaluations.rowCount} evaluations`);
      
      // Step 2: Delete transcripts (has FK to users, referenced by evaluations)
      console.log('2️⃣ Deleting transcripts...');
      const deletedTranscripts = await query('DELETE FROM transcripts');
      console.log(`   ✅ Deleted ${deletedTranscripts.rowCount} transcripts`);
      
      // Step 3: Delete case studies last (referenced by evaluations)
      console.log('3️⃣ Deleting case studies...');
      const deletedCaseStudies = await query('DELETE FROM case_studies');
      console.log(`   ✅ Deleted ${deletedCaseStudies.rowCount} case studies`);
      
      console.log('\n🧹 Database cleanup completed successfully');
      console.log('📊 All historical data has been removed');
    } else {
      console.log('\n✅ CLEAN_DB=FALSE - Preserving historical data');
    }

    // 2. Run the database migration (create/update table structure)
    console.log('\n📊 Creating/updating case_studies table...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../database/migrations/003_create_case_studies.sql'),
      'utf8'
    );
    
    // Execute the complete SQL as one block (simpler approach)
    console.log('📝 Executing complete migration SQL...');
    try {
      await query(migrationSQL);
      console.log('✅ Migration SQL executed successfully');
    } catch (sqlError) {
      console.error('❌ Migration SQL failed:', sqlError.message);
      console.log('📋 SQL that failed:', migrationSQL.substring(0, 200) + '...');
      throw sqlError;
    }
    
    // 3. Verify table structure
    console.log('🔍 Verifying table structure...');
    try {
      const tableInfo = await query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'case_studies' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Current table structure:');
      tableInfo.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check for required columns
      const columnNames = tableInfo.rows.map(row => row.column_name);
      const requiredColumns = ['id', 'key', 'type', 'name', 'objective', 'process_answer', 'key_considerations_answer'];
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length > 0) {
        console.error('❌ Missing required columns:', missingColumns);
        throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log('✅ All required columns present');
      }
    } catch (verifyError) {
      console.error('❌ Table structure verification failed:', verifyError.message);
      throw verifyError;
    }

    // 4. Load case studies from JSON file and upsert them
    console.log('📖 Loading case studies from JSON file...');
    const caseStudiesPath = path.join(__dirname, '../../shared/case_studies.json');
    const caseStudiesData = JSON.parse(fs.readFileSync(caseStudiesPath, 'utf8'));
    
    console.log(`📋 Found ${Object.keys(caseStudiesData).length} case studies to migrate`);

    // 5. Upsert each case study (don't delete existing data)
    console.log('🔄 Upserting case studies (preserving existing data)...');
    let successCount = 0;
    let errorCount = 0;
    let updatedCount = 0;
    let insertedCount = 0;

    for (const [key, caseData] of Object.entries(caseStudiesData)) {
      try {
        console.log(`\n📝 Processing: ${key}`);
        console.log(`  Type: ${caseData.type}`);
        console.log(`  Name: ${caseData.name}`);
        
        // Check if case study already exists
        console.log(`🔍 Checking if case study exists: ${key}`);
        const existing = await CaseStudy.findByKey(key);
        
        if (existing) {
          // Update existing case study
          console.log(`🔄 Updating existing case study: ${key}`);
          console.log(`  Current name: ${existing.name} -> New name: ${caseData.name}`);
          
          try {
            await query(`
              UPDATE case_studies 
              SET type = $1, name = $2, objective = $3, 
                  process_answer = $4, key_considerations_answer = $5,
                  updated_at = CURRENT_TIMESTAMP
              WHERE key = $6
            `, [
              caseData.type,
              caseData.name,
              caseData.objective,
              JSON.stringify(caseData.process_answer),
              JSON.stringify(caseData.key_considerations_answer),
              key
            ]);
            updatedCount++;
            console.log(`✅ Successfully updated: ${key}`);
          } catch (updateError) {
            console.error(`❌ Update failed for ${key}:`, updateError.message);
            throw updateError;
          }
        } else {
          // Insert new case study
          console.log(`➕ Inserting new case study: ${key}`);
          console.log(`  Will create with type: ${caseData.type}`);
          
          try {
            await CaseStudy.create({
              key: key,
              type: caseData.type,
              name: caseData.name,
              objective: caseData.objective,
              process_answer: caseData.process_answer,
              key_considerations_answer: caseData.key_considerations_answer
            });
            insertedCount++;
            console.log(`✅ Successfully inserted: ${key}`);
          } catch (insertError) {
            console.error(`❌ Insert failed for ${key}:`, insertError.message);
            console.log(`  Data being inserted:`, {
              key,
              type: caseData.type,
              name: caseData.name,
              objective: caseData.objective?.substring(0, 50) + '...'
            });
            throw insertError;
          }
        }
        
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${key}:`, error.message);
        console.log(`  Full error:`, error);
      }
    }

    // 6. Verify migration
    console.log('\n🔍 Verifying migration...');
    const migratedCases = await CaseStudy.findAll();
    console.log(`📊 Total cases in database: ${migratedCases.length}`);

    // 7. Summary
    console.log('\n📈 Migration Summary:');
    if (shouldCleanDB) {
      console.log('🧹 Database was cleaned (CLEAN_DB=TRUE)');
      console.log('📊 All historical data was removed');
    } else {
      console.log('✅ Historical data was preserved (CLEAN_DB=FALSE)');
    }
    console.log(`✅ Successfully processed: ${successCount} cases`);
    console.log(`➕ New cases inserted: ${insertedCount} cases`);
    console.log(`🔄 Existing cases updated: ${updatedCount} cases`);
    console.log(`❌ Failed operations: ${errorCount} cases`);
    console.log(`📊 Total in database: ${migratedCases.length} cases`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      if (shouldCleanDB) {
        console.log('🧹 Database cleanup and migration completed');
        console.log('📊 Only current case studies from JSON are now in database');
      }
    } else {
      console.log('\n⚠️ Migration completed with some errors. Please review the logs above.');
    }

    // 8. Test the new API format
    console.log('\n🧪 Testing frontend format conversion...');
    const frontendFormat = await CaseStudy.getAllForFrontend();
    console.log(`✅ Frontend format ready with ${Object.keys(frontendFormat).length} cases`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCaseStudies()
    .then(() => {
      console.log('\n✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCaseStudies }; 