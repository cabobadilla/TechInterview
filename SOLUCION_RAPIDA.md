# 🚨 SOLUCIÓN RÁPIDA - Error de Google OAuth

## 📋 PROBLEMA IDENTIFICADO

Tu aplicación muestra el error "Can't continue with google.com - Something went wrong" porque:

1. **Servidor Legacy ejecutándose**: Los logs muestran que se está ejecutando `server.js` en lugar de `server_new.js`
2. **Variables de entorno faltantes**: No están configuradas las credenciales de Google OAuth

## ⚡ SOLUCIÓN INMEDIATA (5 minutos)

### Paso 1: Verificar qué servidor se está ejecutando
Visita: `https://tu-app.onrender.com/api/server-info`

**Si ves:**
```json
{"server": "LEGACY_SERVER", ...}
```
👆 **Este es el problema principal**

### Paso 2: Configurar Variables de Entorno en Render

Ve a tu servicio en Render → Environment → Agregar estas variables:

```bash
# OBLIGATORIAS para servidor STATEFUL
DATABASE_URL=postgresql://user:pass@host:port/database
GOOGLE_CLIENT_ID=tu_google_client_id  
GOOGLE_CLIENT_SECRET=tu_google_client_secret
JWT_SECRET=pITtfeyF/it5WtPcZTRqUr5CbKSxHHn7uDasHSBQUpQ6HLTaOpV5cRrE/PqAImJNuRbYZIxyJbD0FvwJT+mjBQ==
ENCRYPTION_KEY=0e2e35733b85b1212f46054bb37522147e7fb979f0097e6ac041297bc1dce95f
NODE_ENV=production
PORT=10000
```

### Paso 3: Crear Base de Datos PostgreSQL
1. En Render Dashboard → "New" → "PostgreSQL"
2. Nombre: `techanalyzer-db`
3. Copiar "External Database URL" y usarla como `DATABASE_URL`

### Paso 4: Configurar Google OAuth (Opcional - tiene fallback)
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Authorized redirect URIs: `https://tu-app.onrender.com/api/auth/google/callback`
4. Copiar Client ID y Client Secret

### Paso 5: Verificar Start Command
En Render → Settings → Build & Deploy:
- **Start Command:** `npm start` (NO `node server.js`)

### Paso 6: Manual Deploy
Render Dashboard → Manual Deploy → "Deploy latest commit"

## ✅ VERIFICACIÓN

Después del deploy, deberías ver en los logs:
```
=== STATEFUL SERVER INITIALIZATION ===
Environment: production
✅ Database initialized successfully
🚀 Stateful server running on port 5000
```

Y en `https://tu-app.onrender.com/api/server-info`:
```json
{"server": "STATEFUL_SERVER_NEW", ...}
```

## 🔧 MODO FALLBACK TEMPORAL

Si no quieres configurar Google OAuth ahora, la aplicación funcionará con autenticación mock:

1. Configura solo: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`
2. El login usará modo fallback automáticamente
3. Podrás usar todas las funcionalidades excepto login real con Google

## 📞 COMANDOS DE DIAGNÓSTICO

En tu servicio de Render, ejecuta:
```bash
npm run diagnose
```

O visita en tu app:
- `/diagnostic` - Panel de diagnóstico visual
- `/api/debug/status` - Estado técnico JSON

## 🎯 RESULTADO ESPERADO

Una vez configurado correctamente:
- ✅ Login funcional (real o fallback)
- ✅ Persistencia de datos en PostgreSQL
- ✅ Historial de evaluaciones
- ✅ Transcripciones encriptadas
- ✅ Casos de estudio en base de datos

La clave está en que Render ejecute `server_new.js` con las variables de entorno configuradas. 