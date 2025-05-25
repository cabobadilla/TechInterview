# TECHANALYZER - Aplicación de Análisis de Entrevistas Técnicas

Una aplicación web moderna para analizar entrevistas técnicas de arquitectura, implementando autenticación OAuth 2.0 con Google.

## Características

- Autenticación segura mediante OAuth 2.0 con Google
- Diseño minimalista con tema oscuro y acentos de color teal
- Análisis de transcripciones de entrevistas con IA
- Evaluación automática de respuestas comparadas con soluciones de expertos
- Interfaz responsiva y moderna

## Tecnologías Utilizadas

- **Frontend**: React, Material-UI, React Router
- **Backend**: Node.js, Express
- **Autenticación**: JWT, OAuth 2.0 con Google
- **IA**: OpenAI GPT para análisis de texto

## Configuración para Desarrollo

1. Clona este repositorio
2. Instala las dependencias del servidor: `npm install`
3. Instala las dependencias del cliente: `cd client && npm install`
4. Crea un archivo `.env` en la raíz con:
   ```
   OPENAI_API_KEY=tu_clave_api_openai
   JWT_SECRET=tu_clave_secreta_jwt
   PORT=5000
   ```
5. Ejecuta el servidor de desarrollo: `npm run dev`

## Configuración para Despliegue en Render.com

### Paso 1: Configurar el Servicio Web en Render

1. Regístrate o inicia sesión en [Render](https://render.com)
2. Selecciona "New +" y luego "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura el servicio:
   - **Name**: techanalyzer (o el nombre que prefieras)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build-client`
   - **Start Command**: `npm start`

### Paso 2: Configurar Variables de Entorno

En la sección "Environment" de tu servicio en Render, agrega:

- `NODE_ENV`: production
- `OPENAI_API_KEY`: Tu clave API de OpenAI
- `JWT_SECRET`: Una clave secreta para firmar JWTs (genera una segura)
- `PORT`: 10000 (Render asignará automáticamente el puerto)

### Paso 3: Para Implementación Real de OAuth con Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Configura OAuth Consent Screen
4. Crea credenciales OAuth 2.0 con:
   - URI de redirección autorizada: `https://tu-app.onrender.com/api/auth/google/callback`
5. Agrega estas variables de entorno en Render:
   - `GOOGLE_CLIENT_ID`: ID de cliente de Google OAuth
   - `GOOGLE_CLIENT_SECRET`: Secreto de cliente de Google OAuth

### Paso 4: Configuración de CORS (ya implementado)

El código ya está configurado para manejar CORS en producción, aceptando solicitudes desde dominios de Render.com.

## Notas Importantes

- La aplicación utiliza autenticación stateless con JWTs almacenados en localStorage
- El servidor verifica los tokens en cada solicitud a rutas protegidas
- Para una implementación completa, reemplaza la autenticación simulada con la integración real de Google OAuth

## Estructura de la Aplicación

```
/
├── client/                 # Frontend React
│   ├── public/
│   └── src/
│       ├── components/     # Componentes reutilizables
│       ├── context/        # Contextos React (Auth, Analyzer)
│       └── pages/          # Páginas de la aplicación
├── uploads/                # Directorio para archivos subidos (transcripciones)
├── server.js               # Servidor Express
└── case_studies.json       # Datos de casos de estudio
```

## Instalación y Ejecución Local

1. **Clonar el repositorio**
   ```
   git clone <repositorio>
   cd tech-interview-analyzer
   ```

2. **Instalar dependencias del servidor**
   ```
   npm install
   ```

3. **Instalar dependencias del cliente**
   ```
   cd client
   npm install
   cd ..
   ```

4. **Configurar variables de entorno**
   Crear un archivo `.env` en la raíz del proyecto con:
   ```
   NODE_ENV=development
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=tu_clave_secreta_jwt
   ```

5. **Ejecutar en desarrollo**
   ```
   npm run dev
   ```
   Esto iniciará tanto el servidor (puerto 5000) como el cliente (puerto 3000).

## Despliegue en Render.com

La aplicación está configurada para un despliegue sencillo en Render.com utilizando el archivo `render.yaml` que automatiza la configuración.

### Despliegue Automático

1. Crea una cuenta en [Render.com](https://render.com)
2. Conecta tu repositorio de GitHub
3. Haz clic en "Blueprint" y selecciona el repositorio
4. Render detectará automáticamente el archivo `render.yaml` y configurará el servicio

### Configuración Manual

Si prefieres configurar manualmente, sigue estos pasos:

1. Crear un nuevo Web Service en Render.com
2. Conectar con el repositorio de GitHub
3. Configurar:
   - **Name:** tech-interview-analyzer
   - **Environment:** Node
   - **Build Command:** 
     ```
     npm install && mkdir -p uploads && cd client && npm install && npm run build
     ```
   - **Start Command:** 
     ```
     node server.js
     ```
   - **Variables de Entorno:**
     - `NODE_ENV=production`
     - `PORT=10000`
     - `OPENAI_API_KEY=your_openai_api_key_here`
     - `JWT_SECRET=tu_clave_secreta_jwt`

## Flujo de la Aplicación

La aplicación sigue un flujo tipo wizard con tres pasos principales:

1. **Paso 1:** Subir y procesar el transcript de la entrevista
2. **Paso 2:** Seleccionar el caso de estudio y nivel esperado
3. **Paso 3:** Ver y descargar los resultados de la evaluación

## Personalización

Para agregar o modificar casos de estudio, editar el archivo `case_studies.json` siguiendo el formato existente. 