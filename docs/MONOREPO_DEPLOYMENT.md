# Guía de Despliegue en Render.com - Arquitectura Monorepo

Esta guía te ayudará a desplegar la aplicación de análisis de entrevistas técnicas en Render.com usando la nueva arquitectura separada.

## 📋 Requisitos Previos

1. Cuenta en [Render.com](https://render.com)
2. Repositorio Git conectado a Render
3. Variables de entorno configuradas

## 🏗️ Arquitectura de Despliegue

La aplicación se despliega como **dos servicios separados** en Render:

### 1. Backend (Web Service)
- **Tipo**: Web Service
- **Directorio**: `backend/`
- **Puerto**: 10000
- **Comando de inicio**: `npm start`

### 2. Frontend (Static Site)
- **Tipo**: Static Site
- **Directorio**: `frontend/`
- **Comando de build**: `npm run build`
- **Directorio de publicación**: `build`

## 🚀 Pasos de Despliegue en Render

### Paso 1: Crear el Servicio Backend

1. **Ir a Render Dashboard**
   - Visita [dashboard.render.com](https://dashboard.render.com)
   - Haz clic en "New +"

2. **Seleccionar Web Service**
   - Elige "Web Service"
   - Conecta tu repositorio Git

3. **Configurar el Backend**
   ```
   Name: tech-interview-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Variables de Entorno del Backend**
   ```
   DATABASE_URL=postgresql://user:pass@host:port/database
   GOOGLE_CLIENT_ID=tu_google_client_id
   GOOGLE_CLIENT_SECRET=tu_google_client_secret
   JWT_SECRET=tu_jwt_secret_64_chars
   ENCRYPTION_KEY=tu_encryption_key_32_chars
   NODE_ENV=production
   PORT=10000
   ```

5. **Configurar Base de Datos PostgreSQL**
   - En Render Dashboard, crear "PostgreSQL Database"
   - Copiar la `DATABASE_URL` generada
   - Pegarla en las variables de entorno del backend

### Paso 2: Crear el Servicio Frontend

1. **Crear Static Site**
   - En Render Dashboard, "New +" → "Static Site"
   - Seleccionar el mismo repositorio

2. **Configurar el Frontend**
   ```
   Name: tech-interview-frontend
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

3. **Variables de Entorno del Frontend**
   ```
   REACT_APP_API_URL=https://tech-interview-backend.onrender.com
   GENERATE_SOURCEMAP=false
   ```

### Paso 3: Configurar CORS en el Backend

El backend ya está configurado para aceptar requests del frontend. Verifica que la URL del frontend esté en la lista de orígenes permitidos.

## 🔧 Configuración de Google OAuth

### 1. Google Cloud Console
1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear o seleccionar proyecto
3. Habilitar "Google+ API"
4. Crear credenciales OAuth 2.0

### 2. Configurar Orígenes Autorizados
```
Orígenes JavaScript autorizados:
- https://tu-frontend.onrender.com
- http://localhost:3000 (para desarrollo)

URIs de redirección autorizados:
- https://tu-frontend.onrender.com
- http://localhost:3000 (para desarrollo)
```

## 📊 Monitoreo y Logs

### Ver Logs en Render
1. **Backend**: Dashboard → tech-interview-backend → Logs
2. **Frontend**: Dashboard → tech-interview-frontend → Deploy Logs

### Endpoints de Diagnóstico
- **Estado del servidor**: `https://tu-backend.onrender.com/api/server-info`
- **Estado completo**: `https://tu-backend.onrender.com/api/debug/status`

## 🔄 Proceso de Actualización

### Actualizaciones Automáticas
Render despliega automáticamente cuando haces push a la rama principal:

1. **Push al repositorio**
   ```bash
   git add .
   git commit -m "Actualización"
   git push origin main
   ```

2. **Render detecta cambios**
   - Backend se redespliega automáticamente
   - Frontend se reconstruye automáticamente

### Despliegue Manual
Si necesitas redesplegar manualmente:
1. Ir a Render Dashboard
2. Seleccionar el servicio
3. Hacer clic en "Manual Deploy"

## 🛠️ Solución de Problemas

### Error de Memoria en Build
Si el frontend falla por memoria:
```bash
# En variables de entorno del frontend
GENERATE_SOURCEMAP=false
NODE_OPTIONS=--max-old-space-size=4096
```

### Error de CORS
Verificar que `REACT_APP_API_URL` apunte al backend correcto:
```
REACT_APP_API_URL=https://tu-backend-exacto.onrender.com
```

### Error de Base de Datos
1. Verificar `DATABASE_URL` en variables de entorno
2. Asegurar que la base de datos PostgreSQL esté activa
3. Revisar logs del backend para errores de conexión

### Error de OAuth
1. Verificar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
2. Confirmar orígenes autorizados en Google Cloud Console
3. Verificar que el frontend use la URL correcta

## 📈 Optimización de Rendimiento

### Backend
- **Instancia**: Starter (512 MB RAM, 0.1 CPU)
- **Escalado**: Automático basado en tráfico
- **Región**: Elegir la más cercana a tus usuarios

### Frontend
- **CDN**: Render proporciona CDN global automáticamente
- **Caché**: Configurado automáticamente para assets estáticos
- **Compresión**: Gzip habilitado por defecto

## 💰 Costos Estimados

### Plan Gratuito
- **Backend**: Gratis (con limitaciones de sleep)
- **Frontend**: Gratis
- **Base de Datos**: $7/mes (plan mínimo)

### Plan Starter
- **Backend**: $7/mes
- **Frontend**: Gratis
- **Base de Datos**: $7/mes

**Total estimado**: $7-14/mes dependiendo del plan

## 🔐 Seguridad

### Variables de Entorno
- Nunca hardcodear credenciales
- Usar variables de entorno de Render
- Rotar claves periódicamente

### HTTPS
- Render proporciona HTTPS automáticamente
- Certificados SSL renovados automáticamente

### Base de Datos
- Conexiones encriptadas por defecto
- Backups automáticos diarios
- Acceso restringido por IP

## 📞 Soporte

### Recursos de Render
- [Documentación oficial](https://render.com/docs)
- [Status page](https://status.render.com)
- [Community forum](https://community.render.com)

### Logs y Debugging
- Usar endpoints de diagnóstico incluidos
- Revisar logs en tiempo real en Dashboard
- Configurar alertas para errores críticos 