const { Pool } = require('pg');
require('dotenv').config();

// Database configuration for PostgreSQL on Render
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Database query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// Transaction helper function
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Database initialization function
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    await query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'case_studies', 'transcripts', 'evaluations')
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  Database tables not found. Please run the schema migration.');
      console.log('📝 Run: psql $DATABASE_URL -f database/schema.sql');
      console.log('📝 Then: psql $DATABASE_URL -f database/seed_data.sql');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} database tables`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Closing database pool...');
  pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
});

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase
}; 