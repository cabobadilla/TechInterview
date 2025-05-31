# 🔧 Solución Rápida - Error de Login

## 🎯 Problemas Identificados

### 1. **Base de Datos No Inicializada**
- El backend no tiene las tablas creadas
- Necesita ejecutar migraciones automáticamente

### 2. **URL del API Incorrecta**
- El frontend está apuntando a una URL incorrecta del backend
- Necesita configurar `REACT_APP_API_URL` correctamente

## 🚀 Soluciones Implementadas

### ✅ **Migración Automática de Base de Datos**
- Creado `backend/scripts/migrate.js`
- Actualizado `backend/package.json` con `postinstall` hook
- Las tablas se crearán automáticamente en el próximo deploy

### ✅ **Configuración de API URL**
- Actualizado `frontend/src/config/api.js`
- Cambiado URL por defecto a `tech-interview-backend.onrender.com`

## 📋 Pasos para Resolver

### 1. **Verificar URLs de Render**
En tu Render Dashboard, anota las URLs exactas:
- **Backend Service**: `https://[tu-backend-name].onrender.com`
- **Frontend Service**: `https://[tu-frontend-name].onrender.com`

### 2. **Configurar Variables de Entorno**

#### En el Frontend Service:
```bash
REACT_APP_API_URL=https://[tu-backend-exacto].onrender.com
```

#### En el Backend Service:
```bash
FRONTEND_URL=https://[tu-frontend-exacto].onrender.com
```

### 3. **Redeploy Servicios**
1. **Backend primero**: Manual Deploy en Render Dashboard
2. **Frontend después**: Manual Deploy en Render Dashboard

### 4. **Verificar Configuración**
Después del deploy, verificar:
```bash
# Backend health check
https://[tu-backend].onrender.com/api/server-info

# Debe mostrar:
{
  "server": "STATEFUL_SERVER_NEW",
  "database": "connected",
  "tables_count": 4
}
```

## 🔍 Diagnóstico

### Si el login sigue fallando:

1. **Verificar logs del backend** en Render Dashboard
2. **Verificar que las tablas se crearon**:
   ```
   GET https://[tu-backend].onrender.com/api/debug/status
   ```
3. **Verificar Google OAuth**:
   - Client ID configurado en variables de entorno
   - Orígenes autorizados en Google Cloud Console

## ⚡ Comandos de Emergencia

Si necesitas hacer push de los cambios:

```bash
# Hacer commit de las correcciones
git add .
git commit -m "Fix: Database migration and API URL configuration"
git push origin main

# Render detectará los cambios y redeployará automáticamente
```

## 🎯 Resultado Esperado

Después de aplicar estas correcciones:
- ✅ Base de datos inicializada automáticamente
- ✅ Frontend conectando al backend correcto
- ✅ Login con Google funcionando
- ✅ Aplicación completamente funcional

## 📞 Si Persiste el Error

1. Compartir las URLs exactas de tus servicios en Render
2. Verificar logs del backend para errores específicos
3. Confirmar que Google OAuth está configurado correctamente 