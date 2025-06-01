const fs = require('fs');
const path = require('path');
const CaseStudy = require('../models/CaseStudy');
const { query } = require('../database/config');

async function migrateCaseStudies() {
  console.log('🚀 Starting case studies migration...');
  
  try {
    // 1. Run the database migration first
    console.log('📊 Creating case_studies table...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../database/migrations/003_create_case_studies.sql'),
      'utf8'
    );
    
    // Split SQL into individual statements and execute them separately
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
          await query(statement);
          console.log('✅ Statement executed successfully');
        } catch (error) {
          console.log(`⚠️ Statement failed (continuing): ${error.message}`);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('✅ Table migration completed');

    // 2. Load case studies from JSON file and upsert them
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
        console.log(`📝 Processing: ${key}`);
        
        // Check if case study already exists
        const existing = await CaseStudy.findByKey(key);
        
        if (existing) {
          // Update existing case study
          console.log(`🔄 Updating existing case study: ${key}`);
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
        } else {
          // Insert new case study
          console.log(`➕ Inserting new case study: ${key}`);
          await CaseStudy.create({
            key: key,
            type: caseData.type,
            name: caseData.name,
            objective: caseData.objective,
            process_answer: caseData.process_answer,
            key_considerations_answer: caseData.key_considerations_answer
          });
          insertedCount++;
        }
        
        successCount++;
        console.log(`✅ Successfully processed: ${key}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${key}:`, error.message);
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