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
    await query(migrationSQL);
    console.log('✅ Table created successfully');

    // 2. Load case studies from JSON file
    console.log('📖 Loading case studies from JSON file...');
    const caseStudiesPath = path.join(__dirname, '../../shared/case_studies.json');
    const caseStudiesData = JSON.parse(fs.readFileSync(caseStudiesPath, 'utf8'));
    
    console.log(`📋 Found ${Object.keys(caseStudiesData).length} case studies to migrate`);

    // 3. Clear existing data (in case of re-migration)
    console.log('🧹 Clearing existing case studies...');
    await query('DELETE FROM case_studies');

    // 4. Insert each case study
    let successCount = 0;
    let errorCount = 0;

    for (const [key, caseData] of Object.entries(caseStudiesData)) {
      try {
        console.log(`📝 Migrating: ${key}`);
        
        await CaseStudy.create({
          key: key,
          type: caseData.type,
          name: caseData.name,
          objective: caseData.objective,
          process_answer: caseData.process_answer,
          key_considerations_answer: caseData.key_considerations_answer
        });
        
        successCount++;
        console.log(`✅ Successfully migrated: ${key}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating ${key}:`, error.message);
      }
    }

    // 5. Verify migration
    console.log('\n🔍 Verifying migration...');
    const migratedCases = await CaseStudy.findAll();
    console.log(`📊 Total cases in database: ${migratedCases.length}`);

    // 6. Summary
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} cases`);
    console.log(`❌ Failed migrations: ${errorCount} cases`);
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