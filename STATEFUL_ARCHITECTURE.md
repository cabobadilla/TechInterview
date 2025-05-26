# Tech Interview Analyzer - Stateful Architecture

## 🏗️ Arquitectura Stateful con PostgreSQL

Esta es la nueva versión de la aplicación que utiliza un enfoque stateful con PostgreSQL para persistir todos los datos de usuarios, transcripciones y evaluaciones.

## 🚀 Características Principales

### 1. **Autenticación Mejorada con Google OAuth**
- ✅ Login/registro automático con Google
- ✅ Gestión de sesiones persistentes en base de datos
- ✅ Tokens JWT con validación de sesión
- ✅ Renovación automática de tokens
- ✅ Logout desde todos los dispositivos

### 2. **Persistencia de Datos**
- ✅ Transcripciones encriptadas en base de datos (AES-256-GCM)
- ✅ Historial completo de evaluaciones por usuario
- ✅ Casos de estudio gestionados en base de datos
- ✅ Estadísticas de usuario y rendimiento
- ✅ Integridad de datos con hash verification

### 3. **Funcionalidades Nuevas**
- ✅ Consulta de evaluaciones anteriores
- ✅ Dashboard de estadísticas personales
- ✅ Gestión de transcripciones por usuario
- ✅ Evaluaciones detalladas con preguntas individuales
- ✅ Paginación y filtros en consultas

## 📊 Esquema de Base de Datos

### Tablas Principales

#### `users`
```sql
- id (UUID, PK)
- google_id (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- picture_url (TEXT)
- created_at, updated_at, last_login (TIMESTAMP)
```

#### `user_sessions`
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- session_token (VARCHAR, UNIQUE)
- expires_at (TIMESTAMP)
- is_active (BOOLEAN)
```

#### `transcripts`
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- original_filename (VARCHAR)
- encrypted_content (TEXT) -- AES-256-GCM encrypted
- content_hash (VARCHAR) -- SHA-256 for integrity
- qa_pairs (JSONB)
- qa_pairs_count (INTEGER)
- processing_duration_ms (INTEGER)
```

#### `case_studies`
```sql
- id (UUID, PK)
- key (VARCHAR, UNIQUE)
- name (VARCHAR)
- objective (TEXT)
- process_answer (JSONB)
- key_considerations_answer (JSONB)
- is_active (BOOLEAN)
```

#### `evaluations`
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- transcript_id (UUID, FK)
- case_study_id (UUID, FK)
- expected_level (VARCHAR)
- evaluation_results (JSONB)
- overall_score (INTEGER)
- processing_duration_ms (INTEGER)
- openai_model_used (VARCHAR)
```

#### `evaluation_questions`
```sql
- id (UUID, PK)
- evaluation_id (UUID, FK)
- question_index (INTEGER)
- question (TEXT)
- candidate_answer (TEXT)
- expert_answer (TEXT)
- approach_evaluation (VARCHAR)
- approach_score (INTEGER)
- key_considerations_evaluation (VARCHAR)
- key_considerations_score (INTEGER)
- feedback (TEXT)
```

## 🔐 Seguridad

### Encriptación de Datos
- **Algoritmo**: AES-256-GCM
- **Scope**: Contenido completo de transcripciones
- **Key Management**: Variable de entorno `ENCRYPTION_KEY`
- **Integridad**: SHA-256 hash verification

### Autenticación
- **OAuth Provider**: Google
- **Session Management**: Base de datos con expiración
- **Token Type**: JWT con referencia a sesión
- **Security Headers**: CORS configurado para producción

## 🛠️ Variables de Entorno

### Requeridas para Producción
```bash
# Base de datos
DATABASE_URL=postgresql://user:password@host:port/database

# Autenticación
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
JWT_SECRET=your_jwt_secret

# Encriptación
ENCRYPTION_KEY=your_encryption_key_32_chars_min

# OpenAI (opcional con fallback)
OPENAI_API_KEY=your_openai_api_key

# Configuración
NODE_ENV=production
PORT=5000
```

### Variables de Debugging
```bash
# Modos de fallback
USE_FALLBACK=true                    # Bypass OpenAI para extracción
USE_EVALUATION_FALLBACK=true         # Bypass OpenAI para evaluación
SIMPLIFIED_MODE=true                 # Modo simplificado general

# Logging
DEBUG=*                              # Logging detallado
```

## 🚀 Deployment en Render

### 1. Configurar PostgreSQL
```bash
# En Render Dashboard:
# 1. Crear PostgreSQL Database
# 2. Copiar DATABASE_URL
# 3. Configurar en Environment Variables
```

### 2. Variables de Entorno en Render
```bash
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
ENCRYPTION_KEY=...
OPENAI_API_KEY=...
NODE_ENV=production
```

### 3. Build Commands
```bash
# Build Command (automático en package.json):
npm run render-postbuild

# Start Command:
npm start
```

## 📋 Scripts Disponibles



### Base de Datos
```bash
npm run db:setup           # Inicializar esquema
npm run migrate            # Migrar datos desde JSON
```



### Producción
```bash
npm start                  # Servidor de producción (nueva versión)
npm run start:legacy       # Servidor legacy
```

## 🔄 Migración desde Versión Legacy

### Paso 1: Configurar Base de Datos
```bash
# 1. Crear PostgreSQL en Render
# 2. Configurar DATABASE_URL
# 3. Ejecutar migración
npm run migrate
```

### Paso 2: Configurar Autenticación
```bash
# 1. Configurar Google OAuth Console
# 2. Agregar variables de entorno
# 3. Configurar CORS para dominio de producción
```

### Paso 3: Deployment
```bash
# 1. Cambiar start script a server_new.js
# 2. Deploy en Render
# 3. Verificar logs de inicialización
```

## 📊 API Endpoints

### Autenticación
```
POST /api/auth/google        # Login con Google OAuth
GET  /api/auth/verify        # Verificar token y obtener usuario
POST /api/auth/refresh       # Renovar token
POST /api/auth/logout        # Logout
```

### Transcripciones
```
POST /api/transcript         # Subir y procesar transcripción
GET  /api/transcripts        # Obtener transcripciones del usuario
GET  /api/transcripts/:id    # Obtener transcripción específica
```

### Casos de Estudio
```
GET  /api/cases             # Obtener todos los casos de estudio
```

### Evaluaciones
```
POST /api/evaluate          # Evaluar respuestas
GET  /api/evaluations       # Obtener evaluaciones del usuario
GET  /api/evaluations/:id   # Obtener evaluación específica
```

### Debug
```
GET  /api/debug/status      # Estado del servidor
```

## 🔍 Monitoring y Logs

### Logs de Inicialización
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

### Logs de Operación
```
🔐 Google OAuth login attempt
👤 Creating new user for: user@example.com
🎫 Creating user session...
✅ Google OAuth login successful

📄 File read successfully, size: 1234
🤖 Extracting Q&A pairs...
✅ Q&A pairs extracted: 5
💾 Saving transcript to database...
✅ Transcript saved with ID: uuid

🤖 Evaluating answers...
✅ Evaluation completed: 5 questions
💾 Saving evaluation to database...
✅ Evaluation saved with ID: uuid
```

## 🧪 Testing

### Modo Fallback (Sin OpenAI)
```bash
USE_FALLBACK=true npm start
# Genera datos mock para testing
```

### Modo Simplificado
```bash
SIMPLIFIED_MODE=true npm start
# Procesamiento simplificado para debugging
```

### Verificación de Integridad
```javascript
// Verificar encriptación de transcripciones
const transcript = await Transcript.findById(id);
const isValid = transcript.verifyIntegrity();
console.log('Transcript integrity:', isValid);
```

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Probar conexión
npm run db:setup
```

#### 2. Error de Autenticación Google
```bash
# Verificar configuración OAuth
# 1. Google Console: Authorized redirect URIs
# 2. Variables de entorno correctas
# 3. CORS configurado para dominio
```

#### 3. Error de Encriptación
```bash
# Verificar ENCRYPTION_KEY
# Debe tener al menos 32 caracteres
openssl rand -hex 32
```

#### 4. Problemas de OpenAI
```bash
# Usar modo fallback temporalmente
USE_FALLBACK=true npm start
```

## 📈 Próximas Mejoras

### Funcionalidades Planeadas
- [ ] Dashboard de administración
- [ ] Exportación de evaluaciones a PDF
- [ ] Análisis de tendencias por usuario
- [ ] Comparación entre evaluaciones
- [ ] Notificaciones por email
- [ ] API pública para integraciones

### Optimizaciones Técnicas
- [ ] Cache Redis para sesiones
- [ ] CDN para archivos estáticos
- [ ] Compresión de respuestas
- [ ] Rate limiting por usuario
- [ ] Backup automático de base de datos

---

## 🎯 Beneficios de la Nueva Arquitectura

1. **Persistencia**: Todos los datos se mantienen entre sesiones
2. **Escalabilidad**: Base de datos relacional optimizada
3. **Seguridad**: Encriptación y gestión de sesiones robusta
4. **Auditabilidad**: Historial completo de todas las operaciones
5. **Experiencia de Usuario**: Login persistente y acceso a historial
6. **Mantenibilidad**: Código modular con modelos y servicios separados 