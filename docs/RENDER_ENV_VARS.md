# 🔧 Variables de Entorno para Render.com

Esta guía detalla todas las variables de entorno necesarias para desplegar la aplicación en Render.com.

## 🗄️ Backend (Web Service)

### Variables Obligatorias

#### Base de Datos
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```
- **Obtener**: Crear PostgreSQL Database en Render Dashboard
- **Formato**: `postgresql://username:password@hostname:port/database_name`
- **Ejemplo**: `postgresql://user:abc123@dpg-xyz.oregon-postgres.render.com:5432/mydb`

#### Autenticación Google OAuth
```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```
- **Obtener**: [Google Cloud Console](https://console.cloud.google.com)
- **Configurar**: APIs & Services → Credentials → OAuth 2.0 Client IDs

#### Seguridad
```bash
JWT_SECRET=base64_string_64_characters_long_for_jwt_token_signing
ENCRYPTION_KEY=32_character_hex_string_for_data_encryption
```
- **Generar JWT_SECRET**: `openssl rand -base64 64`
- **Generar ENCRYPTION_KEY**: `openssl rand -hex 32`

#### Configuración del Servidor
```bash
NODE_ENV=production
PORT=10000
```
- **NODE_ENV**: Siempre `production` en Render
- **PORT**: Render requiere puerto 10000

### Variables Opcionales

#### OpenAI (para evaluaciones IA)
```bash
OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456789
```
- **Obtener**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Nota**: Sin esta variable, las evaluaciones usarán respuestas mock

#### URL del Frontend
```bash
FRONTEND_URL=https://tu-frontend.onrender.com
```
- **Actualizar**: Con la URL real de tu Static Site
- **Usado para**: CORS y redirects

## 🌐 Frontend (Static Site)

### Variables Obligatorias

#### API del Backend
```bash
REACT_APP_API_URL=https://tu-backend.onrender.com
```
- **Actualizar**: Con la URL real de tu Web Service
- **Formato**: `https://nombre-servicio.onrender.com`

#### Optimizaciones
```bash
GENERATE_SOURCEMAP=false
NODE_ENV=production
```
- **GENERATE_SOURCEMAP**: `false` para reducir tamaño del build
- **NODE_ENV**: Siempre `production` en Render

### Variables Opcionales

#### Google OAuth (Frontend)
```bash
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```
- **Debe coincidir**: Con `GOOGLE_CLIENT_ID` del backend
- **Usado para**: Botón de login de Google

## 📋 Checklist de Configuración

### Antes del Despliegue
- [ ] Crear PostgreSQL Database en Render
- [ ] Configurar Google OAuth en Google Cloud Console
- [ ] Generar JWT_SECRET y ENCRYPTION_KEY
- [ ] Obtener OpenAI API Key (opcional)

### En Render Dashboard

#### Backend Service
- [ ] `DATABASE_URL` - Copiar de PostgreSQL Database
- [ ] `GOOGLE_CLIENT_ID` - De Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - De Google Cloud Console
- [ ] `JWT_SECRET` - Generar con OpenSSL
- [ ] `ENCRYPTION_KEY` - Generar con OpenSSL
- [ ] `NODE_ENV` - Establecer como `production`
- [ ] `PORT` - Establecer como `10000`
- [ ] `OPENAI_API_KEY` - De OpenAI Platform (opcional)
- [ ] `FRONTEND_URL` - URL del Static Site

#### Frontend Service
- [ ] `REACT_APP_API_URL` - URL del Web Service
- [ ] `GENERATE_SOURCEMAP` - Establecer como `false`
- [ ] `NODE_ENV` - Establecer como `production`
- [ ] `REACT_APP_GOOGLE_CLIENT_ID` - Mismo que backend (opcional)

## 🔐 Configuración de Google OAuth

### 1. Crear Proyecto en Google Cloud
1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto o seleccionar existente
3. Habilitar "Google+ API" o "Google Identity"

### 2. Crear Credenciales OAuth
1. APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client ID
3. Application type: Web application

### 3. Configurar Orígenes Autorizados
```
JavaScript origins:
- https://tu-frontend.onrender.com
- http://localhost:3000 (para desarrollo)

Authorized redirect URIs:
- https://tu-frontend.onrender.com
- http://localhost:3000 (para desarrollo)
```

## 🛠️ Comandos para Generar Claves

### JWT Secret (64 caracteres base64)
```bash
openssl rand -base64 64
```

### Encryption Key (32 caracteres hex)
```bash
openssl rand -hex 32
```

### Verificar longitud
```bash
# JWT Secret debe tener ~88 caracteres
echo "tu_jwt_secret" | wc -c

# Encryption Key debe tener exactamente 64 caracteres
echo "tu_encryption_key" | wc -c
```

## 🔍 Verificación

### Endpoints de Prueba
```bash
# Verificar backend
curl https://tu-backend.onrender.com/api/server-info

# Verificar configuración
curl https://tu-backend.onrender.com/api/debug/status
```

### Logs en Render
1. **Backend**: Dashboard → Web Service → Logs
2. **Frontend**: Dashboard → Static Site → Deploy Logs

## ⚠️ Problemas Comunes

### Error: "Invalid DATABASE_URL"
- Verificar formato: `postgresql://user:pass@host:port/db`
- Confirmar que PostgreSQL Database esté activo

### Error: "Google OAuth failed"
- Verificar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- Confirmar orígenes autorizados en Google Cloud Console

### Error: "CORS blocked"
- Verificar `REACT_APP_API_URL` apunta al backend correcto
- Confirmar `FRONTEND_URL` en backend

### Error: "JWT verification failed"
- Verificar `JWT_SECRET` tiene la longitud correcta
- Confirmar que es el mismo en todas las instancias

## 📞 Soporte

- [Render Documentation](https://render.com/docs/environment-variables)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [OpenAI API Keys](https://platform.openai.com/docs/quickstart) 