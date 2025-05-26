#!/usr/bin/env node

console.log('=== DEPLOYMENT VERIFICATION SCRIPT ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());

console.log('\n=== ENVIRONMENT VARIABLES ===');
const requiredVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'OPENAI_API_KEY'
];

const optionalVars = [
  'USE_FALLBACK',
  'USE_EVALUATION_FALLBACK',
  'SIMPLIFIED_MODE',
  'DEBUG'
];

console.log('\nRequired Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '[HIDDEN]' : value) : 'NOT SET';
  console.log(`${status} ${varName}: ${display}`);
});

console.log('\nOptional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚪';
  console.log(`${status} ${varName}: ${value || 'NOT SET'}`);
});

console.log('\n=== FILE SYSTEM CHECK ===');
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'server_new.js',
  'package.json',
  'database/config.js',
  'models/User.js',
  'services/AuthService.js',
  'client/build/index.html'
];

console.log('\nCritical Files:');
criticalFiles.forEach(filePath => {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${filePath}`);
});

console.log('\n=== PACKAGE.JSON CHECK ===');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  console.log('✅ package.json parsed successfully');
  console.log('Start script:', packageJson.scripts.start);
  console.log('Main file:', packageJson.main);
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

console.log('\n=== DATABASE CONNECTION TEST ===');
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    pool.query('SELECT NOW()', (err, result) => {
      if (err) {
        console.log('❌ Database connection failed:', err.message);
      } else {
        console.log('✅ Database connection successful');
        console.log('Database time:', result.rows[0].now);
      }
      pool.end();
    });
  } catch (error) {
    console.log('❌ Database test error:', error.message);
  }
} else {
  console.log('❌ DATABASE_URL not configured');
}

console.log('\n=== RECOMMENDATIONS ===');
const missingRequired = requiredVars.filter(varName => !process.env[varName]);
if (missingRequired.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingRequired.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n📋 TO FIX IN RENDER:');
  console.log('1. Go to your Render service dashboard');
  console.log('2. Navigate to Environment tab');
  console.log('3. Add the missing variables:');
  
  if (missingRequired.includes('DATABASE_URL')) {
    console.log('   - DATABASE_URL: Create a PostgreSQL database in Render and copy the connection string');
  }
  if (missingRequired.includes('GOOGLE_CLIENT_ID')) {
    console.log('   - GOOGLE_CLIENT_ID: Get from Google Cloud Console OAuth credentials');
  }
  if (missingRequired.includes('GOOGLE_CLIENT_SECRET')) {
    console.log('   - GOOGLE_CLIENT_SECRET: Get from Google Cloud Console OAuth credentials');
  }
  if (missingRequired.includes('JWT_SECRET')) {
    console.log('   - JWT_SECRET: Generate with: openssl rand -base64 64');
  }
  if (missingRequired.includes('ENCRYPTION_KEY')) {
    console.log('   - ENCRYPTION_KEY: Generate with: openssl rand -hex 32');
  }
  if (missingRequired.includes('OPENAI_API_KEY')) {
    console.log('   - OPENAI_API_KEY: Get from OpenAI dashboard');
  }
} else {
  console.log('✅ All required environment variables are configured');
}

console.log('\n=== END VERIFICATION ==='); 