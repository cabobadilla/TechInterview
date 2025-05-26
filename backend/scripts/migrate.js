const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(dbConfig);

async function waitForDatabase(maxRetries = 10, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.log(`⏳ Database connection attempt ${i + 1}/${maxRetries} failed:`, error.message);
      if (i < maxRetries - 1) {
        console.log(`⏳ Waiting ${delay/1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

async function runMigration() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Wait for database to be available
    const dbAvailable = await waitForDatabase();
    if (!dbAvailable) {
      console.error('❌ Could not connect to database after multiple attempts');
      process.exit(1);
    }
    
    // Check if tables already exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'case_studies', 'transcripts', 'evaluations')
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ Database already initialized with ${tablesResult.rows.length} tables`);
      return;
    }
    
    console.log('📝 Running schema migration...');
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      process.exit(1);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schemaSQL);
    console.log('✅ Schema migration completed');
    
    // Check if seed data file exists and run it
    const seedPath = path.join(__dirname, '../database/seed_data.sql');
    if (fs.existsSync(seedPath)) {
      console.log('📝 Running seed data migration...');
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSQL);
      console.log('✅ Seed data migration completed');
    } else {
      console.log('⚠️  No seed data file found, skipping...');
    }
    
    // Verify tables were created
    const finalCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'case_studies', 'transcripts', 'evaluations')
    `);
    
    console.log(`✅ Migration completed successfully! Created ${finalCheck.rows.length} tables`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration }; 