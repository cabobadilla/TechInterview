# 🚀 Guía de Configuración en Render - Versión Stateful

## ⚠️ IMPORTANTE: Verificación de Despliegue

Los logs que proporcionaste muestran que la aplicación está ejecutándose con el servidor legacy en lugar del nuevo servidor stateful. Esta guía te ayudará a configurar correctamente la nueva arquitectura.

## 🔍 Paso 1: Verificar Estado Actual

Ejecuta el script de verificación en tu servicio de Render:

```bash
npm run verify
```

Este script te mostrará:
- ✅ Variables de entorno configuradas
- ❌ Variables faltantes
- 📁 Archivos críticos presentes
- 🔗 Conexión a base de datos

## 📋 Paso 2: Variables de Entorno Requeridas

### Variables OBLIGATORIAS para la versión stateful:

#### 1. Base de Datos PostgreSQL
```bash
DATABASE_URL=postgresql://username:password@host:port/database
```
**Cómo obtener:**
1. En Render Dashboard → "New" → "PostgreSQL"
2. Crear base de datos
3. Copiar "External Database URL"

#### 2. Autenticación Google OAuth
```bash
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```
**Cómo obtener:**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto o seleccionar existente
3. APIs & Services → Credentials
4. Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs: `https://tu-app.onrender.com/api/auth/google/callback`

#### 3. Seguridad
```bash
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro
ENCRYPTION_KEY=tu_encryption_key_32_caracteres_minimo
```
**Generar claves seguras:**
```bash
# JWT Secret (64 caracteres base64)
openssl rand -base64 64

# Encryption Key (32 caracteres hex)
openssl rand -hex 32
```

#### 4. OpenAI (Opcional con fallback)
```bash
OPENAI_API_KEY=sk-tu_openai_api_key
```

#### 5. Configuración de Entorno
```bash
NODE_ENV=production
PORT=10000
```

### Variables OPCIONALES para debugging:
```bash
USE_FALLBACK=false                    # true para bypass OpenAI en extracción
USE_EVALUATION_FALLBACK=false         # true para bypass OpenAI en evaluación
SIMPLIFIED_MODE=false                 # true para modo simplificado
DEBUG=*                               # para logs detallados
```

## 🔧 Paso 3: Configuración del Servicio en Render

### Build Command:
```bash
npm run render-postbuild
```

### Start Command:
```bash
npm start
```

**⚠️ CRÍTICO:** Asegúrate de que el Start Command sea exactamente `npm start`, NO `node server.js`

## 🔄 Paso 4: Proceso de Migración

### Si ya tienes un servicio desplegado:

1. **Crear PostgreSQL Database:**
   - Render Dashboard → "New" → "PostgreSQL"
   - Nombre: `techanalyzer-db`
   - Copiar DATABASE_URL

2. **Actualizar Variables de Entorno:**
   - Ir a tu servicio web en Render
   - Environment tab
   - Agregar todas las variables requeridas

3. **Forzar Re-deploy:**
   - Manual Deploy → "Deploy latest commit"

4. **Verificar Logs:**
   Deberías ver:
   ```
   === STATEFUL SERVER INITIALIZATION ===
   Environment: production
   Database URL present: true
   ✅ Database initialized successfully
   🚀 Stateful server running on port 5000
   ```

## 🚨 Troubleshooting

### Problema: Sigue ejecutándose el servidor legacy
**Síntomas:** Logs muestran "Test user" en lugar de autenticación real
**Solución:**
1. Verificar que `package.json` tenga `"start": "node server_new.js"`
2. Hacer Manual Deploy en Render
3. Verificar logs de inicialización

### Problema: Error de conexión a base de datos
**Síntomas:** `❌ Database initialization failed`
**Solución:**
1. Verificar DATABASE_URL en variables de entorno
2. Asegurar que PostgreSQL database esté activa
3. Verificar formato de URL: `postgresql://user:pass@host:port/db`

### Problema: Error de autenticación Google
**Síntomas:** `❌ Google auth error`
**Solución:**
1. Verificar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
2. Configurar redirect URI en Google Console
3. Verificar dominio autorizado

### Problema: Error de encriptación
**Síntomas:** `Encryption key must be at least 32 characters`
**Solución:**
1. Generar nueva ENCRYPTION_KEY: `openssl rand -hex 32`
2. Agregar a variables de entorno en Render

## ✅ Verificación de Éxito

Una vez configurado correctamente, deberías ver:

### En los logs de inicialización:
```
=== STATEFUL SERVER INITIALIZATION ===
Environment: production
Database URL present: true
OpenAI API Key present: true
Google Client ID present: true
Encryption Key present: true
✅ Database initialized successfully
✅ OpenAI initialized successfully
🚀 Stateful server running on port 5000
```

### En la aplicación:
1. **Login con Google:** Botón funcional que redirige a Google OAuth
2. **Usuario real:** Muestra tu nombre/email de Google en lugar de "Test user"
3. **Persistencia:** Datos se mantienen entre sesiones
4. **Historial:** Acceso a evaluaciones anteriores

## 🎯 Funcionalidades de la Nueva Versión

Una vez configurada correctamente, tendrás acceso a:

1. **✅ Autenticación Real con Google OAuth**
   - Login/logout persistente
   - Gestión de sesiones en base de datos
   - Renovación automática de tokens

2. **✅ Persistencia de Datos**
   - Transcripciones encriptadas en PostgreSQL
   - Historial completo de evaluaciones
   - Estadísticas de usuario

3. **✅ Funcionalidades Nuevas**
   - Consulta de evaluaciones anteriores
   - Dashboard de estadísticas
   - Gestión de transcripciones por usuario

4. **✅ Casos de Estudio en Base de Datos**
   - Migración automática desde JSON
   - Gestión dinámica de casos
   - Resultados esperados estructurados

## 📞 Soporte

Si después de seguir esta guía sigues viendo "Test user" o el servidor legacy:

1. Ejecuta `npm run verify` y comparte el output
2. Comparte los logs de inicialización de Render
3. Verifica que todas las variables de entorno estén configuradas

La clave está en asegurar que Render esté ejecutando `server_new.js` con todas las variables de entorno configuradas correctamente. 