#!/usr/bin/env node

console.log('🔍 === DIAGNÓSTICO DEL SERVIDOR ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());

// Verificar qué servidor se está ejecutando
console.log('\n📊 === IDENTIFICACIÓN DEL SERVIDOR ===');

const fs = require('fs');
const path = require('path');

// Verificar package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  console.log('✅ package.json encontrado');
  console.log('📋 Start script:', packageJson.scripts.start);
  console.log('📋 Main file:', packageJson.main);
  
  if (packageJson.scripts.start === 'node server_new.js') {
    console.log('✅ Configurado para usar SERVIDOR STATEFUL (server_new.js)');
  } else if (packageJson.scripts.start === 'node server.js') {
    console.log('⚠️  Configurado para usar SERVIDOR LEGACY (server.js)');
  } else {
    console.log('❓ Start script no reconocido:', packageJson.scripts.start);
  }
} catch (error) {
  console.log('❌ Error leyendo package.json:', error.message);
}

// Verificar archivos del servidor
console.log('\n📁 === ARCHIVOS DEL SERVIDOR ===');
const serverFiles = [
  { file: 'server.js', type: 'LEGACY' },
  { file: 'server_new.js', type: 'STATEFUL' }
];

serverFiles.forEach(({ file, type }) => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file} (${type})`);
  
  if (exists) {
    const stats = fs.statSync(file);
    console.log(`   📏 Tamaño: ${Math.round(stats.size / 1024)}KB`);
    console.log(`   📅 Modificado: ${stats.mtime.toISOString()}`);
  }
});

// Verificar variables de entorno
console.log('\n🔐 === VARIABLES DE ENTORNO ===');

const requiredForStateful = [
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID', 
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
  'ENCRYPTION_KEY'
];

const optional = [
  'OPENAI_API_KEY',
  'USE_FALLBACK',
  'USE_EVALUATION_FALLBACK',
  'SIMPLIFIED_MODE'
];

const basic = [
  'NODE_ENV',
  'PORT'
];

console.log('\n🔴 Variables OBLIGATORIAS para servidor STATEFUL:');
let missingRequired = 0;
requiredForStateful.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '[CONFIGURADA]' : value.substring(0, 20) + '...') : 'NO CONFIGURADA';
  console.log(`${status} ${varName}: ${display}`);
  if (!value) missingRequired++;
});

console.log('\n🟡 Variables OPCIONALES:');
optional.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚪';
  console.log(`${status} ${varName}: ${value || 'NO CONFIGURADA'}`);
});

console.log('\n🔵 Variables BÁSICAS:');
basic.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  console.log(`${status} ${varName}: ${value || 'NO CONFIGURADA'}`);
});

// Verificar base de datos
console.log('\n🗄️  === VERIFICACIÓN DE BASE DE DATOS ===');
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    console.log('🔄 Probando conexión a PostgreSQL...');
    pool.query('SELECT NOW() as current_time, version() as pg_version', (err, result) => {
      if (err) {
        console.log('❌ Error de conexión a base de datos:', err.message);
      } else {
        console.log('✅ Conexión a base de datos exitosa');
        console.log('⏰ Hora del servidor DB:', result.rows[0].current_time);
        console.log('📊 Versión PostgreSQL:', result.rows[0].pg_version.split(' ')[0]);
      }
      pool.end();
    });
  } catch (error) {
    console.log('❌ Error al probar base de datos:', error.message);
  }
} else {
  console.log('❌ DATABASE_URL no configurada');
}

// Diagnóstico y recomendaciones
console.log('\n🎯 === DIAGNÓSTICO Y RECOMENDACIONES ===');

if (missingRequired > 0) {
  console.log('❌ PROBLEMA IDENTIFICADO: Variables de entorno faltantes');
  console.log(`   Faltan ${missingRequired} variables obligatorias para el servidor STATEFUL`);
  console.log('\n📋 PASOS PARA SOLUCIONAR:');
  console.log('1. Ve a tu servicio en Render Dashboard');
  console.log('2. Navega a la pestaña "Environment"');
  console.log('3. Agrega las variables faltantes:');
  
  requiredForStateful.forEach(varName => {
    if (!process.env[varName]) {
      switch (varName) {
        case 'DATABASE_URL':
          console.log(`   - ${varName}: Crear PostgreSQL database en Render y copiar URL`);
          break;
        case 'GOOGLE_CLIENT_ID':
        case 'GOOGLE_CLIENT_SECRET':
          console.log(`   - ${varName}: Obtener de Google Cloud Console OAuth`);
          break;
        case 'JWT_SECRET':
          console.log(`   - ${varName}: Generar con: openssl rand -base64 64`);
          break;
        case 'ENCRYPTION_KEY':
          console.log(`   - ${varName}: Generar con: openssl rand -hex 32`);
          break;
      }
    }
  });
  
  console.log('4. Hacer "Manual Deploy" para aplicar cambios');
} else {
  console.log('✅ Todas las variables obligatorias están configuradas');
}

// Verificar si se está ejecutando el servidor correcto
console.log('\n🚀 === VERIFICACIÓN DEL SERVIDOR EN EJECUCIÓN ===');
console.log('Para verificar qué servidor se está ejecutando realmente:');
console.log('1. Visita: https://tu-app.onrender.com/api/server-info');
console.log('2. Deberías ver: {"server": "STATEFUL_SERVER_NEW", ...}');
console.log('3. Si ves "LEGACY_SERVER", el problema está en la configuración de Render');

console.log('\n🔧 === COMANDOS ÚTILES ===');
console.log('- Verificar estado: npm run verify');
console.log('- Ver logs en tiempo real en Render Dashboard');
console.log('- Endpoint de debug: /api/debug/status');
console.log('- Endpoint de info: /api/server-info');

console.log('\n✅ === DIAGNÓSTICO COMPLETADO ==='); 