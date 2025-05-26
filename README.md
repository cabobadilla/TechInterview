# 🎯 Analizador de Entrevistas Técnicas

Una aplicación web completa para analizar y evaluar entrevistas técnicas usando IA, desplegada en **Render.com**.

## 🏗️ Arquitectura

### Monorepo con Servicios Separados
```
tech-interview-analyzer/
├── backend/                 # API Server (Node.js + Express)
│   ├── server_new.js       # Servidor principal
│   ├── database/           # Configuración PostgreSQL
│   ├── models/             # Modelos de datos
│   └── services/           # Servicios (Auth, OpenAI)
├── frontend/               # React Application
│   ├── src/                # Código fuente React
│   └── public/             # Assets públicos
├── shared/                 # Recursos compartidos
│   └── case_studies.json   # Casos de estudio
└── docs/                   # Documentación
```

### Despliegue en Render.com
- **Backend**: Web Service (Node.js)
- **Frontend**: Static Site (React)
- **Base de Datos**: PostgreSQL Database

## 🚀 Despliegue Rápido en Render

### 1. Preparación
1. Fork este repositorio
2. Crear cuenta en [Render.com](https://render.com)
3. Conectar repositorio a Render

### 2. Crear Servicios

#### Backend (Web Service)
```
Name: tech-interview-backend
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

#### Frontend (Static Site)
```
Name: tech-interview-frontend
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: build
```

### 3. Variables de Entorno

#### Backend
```bash
DATABASE_URL=postgresql://user:pass@host:port/database
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
JWT_SECRET=tu_jwt_secret_64_chars
ENCRYPTION_KEY=tu_encryption_key_32_chars
OPENAI_API_KEY=sk-tu_openai_api_key
NODE_ENV=production
PORT=10000
```

#### Frontend
```bash
REACT_APP_API_URL=https://tu-backend.onrender.com
GENERATE_SOURCEMAP=false
```

## 📋 Guías de Configuración

### Despliegue
**[📖 Guía Completa de Despliegue en Render](docs/MONOREPO_DEPLOYMENT.md)**

### Variables de Entorno
**[🔧 Configuración de Variables de Entorno](docs/RENDER_ENV_VARS.md)**

### OpenAI API Key
**[🤖 Configuración de OpenAI API Key](docs/OPENAI_SETUP.md)**

## ✨ Características

### 🔐 Autenticación
- Google OAuth 2.0
- JWT para sesiones
- Modo fallback para desarrollo

### 📊 Análisis de Entrevistas
- Evaluación automática con OpenAI GPT-4
- Casos de estudio predefinidos
- Métricas detalladas de rendimiento
- Historial de evaluaciones

### 🛠️ Tecnologías
- **Frontend**: React, Material-UI, Google Identity Services
- **Backend**: Node.js, Express, PostgreSQL
- **IA**: OpenAI GPT-4 API
- **Autenticación**: Google OAuth 2.0, JWT
- **Despliegue**: Render.com

## 🔧 Desarrollo Local

### Requisitos
- Node.js 18+
- PostgreSQL
- Cuenta Google Cloud (para OAuth)
- API Key de OpenAI

### Instalación
```bash
# Clonar repositorio
git clone <tu-repo>
cd tech-interview-analyzer

# Instalar dependencias
npm run install:all

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Ejecutar en desarrollo
npm run dev
```

### Scripts Disponibles
```bash
npm run install:all    # Instalar todas las dependencias
npm run dev            # Desarrollo (backend + frontend)
npm run build          # Build de producción
npm run start:backend  # Solo backend
npm run start:frontend # Solo frontend
```

## 🔍 Endpoints de API

### Autenticación
- `POST /api/auth/google` - Login con Google
- `GET /api/auth/verify` - Verificar token JWT

### Evaluaciones
- `POST /api/evaluate` - Crear nueva evaluación
- `GET /api/evaluations` - Obtener historial
- `GET /api/evaluations/:id` - Obtener evaluación específica

### Diagnóstico
- `GET /api/server-info` - Información del servidor
- `GET /api/debug/status` - Estado completo del sistema

## 🛠️ Solución de Problemas

### Error de CORS
Verificar que `REACT_APP_API_URL` apunte al backend correcto en Render.

### Error de OAuth
1. Verificar credenciales de Google Cloud Console
2. Confirmar orígenes autorizados incluyen tu dominio de Render
3. Verificar variables de entorno en Render

### Error de Base de Datos
1. Verificar `DATABASE_URL` en variables de entorno
2. Confirmar que PostgreSQL Database esté activo en Render

## 📊 Monitoreo

### Logs en Render
- **Backend**: Dashboard → Service → Logs
- **Frontend**: Dashboard → Static Site → Deploy Logs

### Health Checks
- Backend: `https://tu-backend.onrender.com/api/server-info`
- Frontend: Verificar carga de la aplicación

## 💰 Costos en Render

### Plan Gratuito
- Backend: Gratis (con sleep después de inactividad)
- Frontend: Gratis
- PostgreSQL: $7/mes

### Plan Starter
- Backend: $7/mes (sin sleep)
- Frontend: Gratis
- PostgreSQL: $7/mes

**Total**: $7-14/mes

## 🔐 Seguridad

- HTTPS automático en Render
- Variables de entorno seguras
- Encriptación de datos sensibles
- Autenticación JWT + Google OAuth

## 📞 Soporte

- [Documentación de Render](https://render.com/docs)
- [Status de Render](https://status.render.com)
- Issues en este repositorio

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles. 