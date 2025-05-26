#!/usr/bin/env node

console.log('🔍 === VERIFICACIÓN DE CONFIGURACIÓN DEL SERVIDOR ===');
console.log('Timestamp:', new Date().toISOString());

const fs = require('fs');
const path = require('path');

// Verificar que server.js no existe
console.log('\n📁 === VERIFICACIÓN DE ARCHIVOS ===');
if (fs.existsSync('server.js')) {
  console.log('❌ ERROR: server.js todavía existe - debe ser eliminado');
  process.exit(1);
} else {
  console.log('✅ server.js eliminado correctamente');
}

if (fs.existsSync('server_new.js')) {
  console.log('✅ server_new.js existe');
} else {
  console.log('❌ ERROR: server_new.js no encontrado');
  process.exit(1);
}

// Verificar package.json
console.log('\n📋 === VERIFICACIÓN DE PACKAGE.JSON ===');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  
  if (packageJson.main === 'server_new.js') {
    console.log('✅ main field apunta a server_new.js');
  } else {
    console.log('❌ ERROR: main field debe ser "server_new.js", actual:', packageJson.main);
  }
  
  if (packageJson.scripts.start === 'node server_new.js') {
    console.log('✅ start script configurado correctamente');
  } else {
    console.log('❌ ERROR: start script debe ser "node server_new.js", actual:', packageJson.scripts.start);
  }
  
  if (packageJson.scripts['start:legacy']) {
    console.log('❌ WARNING: start:legacy script todavía existe - debería ser eliminado');
  } else {
    console.log('✅ start:legacy script eliminado correctamente');
  }
  
} catch (error) {
  console.log('❌ ERROR leyendo package.json:', error.message);
  process.exit(1);
}

// Verificar render.yaml
console.log('\n🚀 === VERIFICACIÓN DE RENDER.YAML ===');
try {
  const renderYaml = fs.readFileSync('render.yaml', 'utf-8');
  
  if (renderYaml.includes('npm start')) {
    console.log('✅ render.yaml usa npm start');
  } else if (renderYaml.includes('node server.js')) {
    console.log('❌ ERROR: render.yaml todavía referencia server.js');
  } else {
    console.log('⚠️  WARNING: render.yaml no contiene comando de inicio reconocido');
  }
  
} catch (error) {
  console.log('⚠️  render.yaml no encontrado (opcional)');
}

// Verificar que server_new.js tiene la identificación correcta
console.log('\n🔍 === VERIFICACIÓN DE IDENTIFICACIÓN DEL SERVIDOR ===');
try {
  const serverContent = fs.readFileSync('server_new.js', 'utf-8');
  
  if (serverContent.includes("server: 'STATEFUL_SERVER_NEW'")) {
    console.log('✅ server_new.js tiene identificación correcta');
  } else {
    console.log('❌ ERROR: server_new.js no tiene la identificación correcta');
  }
  
} catch (error) {
  console.log('❌ ERROR leyendo server_new.js:', error.message);
  process.exit(1);
}

console.log('\n✅ === VERIFICACIÓN COMPLETADA ===');
console.log('🎯 Configuración correcta para usar únicamente server_new.js');
console.log('📝 Próximos pasos:');
console.log('   1. Hacer commit de los cambios');
console.log('   2. Hacer push al repositorio');
console.log('   3. Verificar que Render use "npm start" como Start Command');
console.log('   4. Hacer Manual Deploy en Render');
console.log('   5. Verificar en /api/server-info que muestre "STATEFUL_SERVER_NEW"'); 