const fs = require('fs');
const path = require('path');
const CaseStudy = require('../models/CaseStudy');
const { query } = require('../database/config');

async function migrateCaseStudies() {
  console.log('🚀 Starting case studies migration...');
  
  try {
    // 1. Run the database migration first
    console.log('📊 Creating/updating case_studies table...');
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
    
    // 2. Verify table structure
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

    // 3. Load case studies from JSON file and upsert them
    console.log('📖 Loading case studies from JSON file...');
    const caseStudiesPath = path.join(__dirname, '../../shared/case_studies.json');
    const caseStudiesData = JSON.parse(fs.readFileSync(caseStudiesPath, 'utf8'));
    
    console.log(`📋 Found ${Object.keys(caseStudiesData).length} case studies to migrate`);

    // 4. Upsert each case study (don't delete existing data)
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

    // 5. Verify migration
    console.log('\n🔍 Verifying migration...');
    const migratedCases = await CaseStudy.findAll();
    console.log(`📊 Total cases in database: ${migratedCases.length}`);

    // 6. Summary
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully processed: ${successCount} cases`);
    console.log(`➕ New cases inserted: ${insertedCount} cases`);
    console.log(`🔄 Existing cases updated: ${updatedCount} cases`);
    console.log(`❌ Failed operations: ${errorCount} cases`);
    console.log(`📊 Total in database: ${migratedCases.length} cases`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️ Migration completed with some errors. Please review the logs above.');
    }

    // 7. Test the new API format
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