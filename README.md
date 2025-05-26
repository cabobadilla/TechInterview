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

### Paso 2: Configurar Variables de Entorno Obligatorias

En la sección "Environment" de tu servicio en Render, agrega estas variables **obligatorias**:

- `NODE_ENV`: production
- `OPENAI_API_KEY`: Tu clave API de OpenAI
- `JWT_SECRET`: Una clave secreta para firmar JWTs (utiliza un valor seguro generado aleatoriamente)
  - Puedes generar un JWT_SECRET seguro con: `openssl rand -base64 64`
  - **IMPORTANTE**: El JWT_SECRET NO es el secreto de cliente de Google, sino una clave que defines tú mismo para firmar tokens JWT
- `PORT`: 10000 (Render asignará automáticamente el puerto)

### Paso 3: Configuración de OAuth con Google (Opcional pero Recomendado)

Para implementar la autenticación real con Google OAuth (en lugar de la simulación actual), sigue estos pasos:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Configura OAuth Consent Screen (pantalla de consentimiento)
4. Crea credenciales OAuth 2.0 para Cliente Web con:
   - URI de origen autorizado: `https://tu-app.onrender.com`
   - URI de redirección autorizada: `https://tu-app.onrender.com/api/auth/google/callback`

5. Agrega estas variables de entorno **adicionales** en Render:
   - `GOOGLE_CLIENT_ID`: ID de cliente de Google OAuth (obtenido de Google Cloud Console)
   - `GOOGLE_CLIENT_SECRET`: Secreto de cliente de Google OAuth (obtenido de Google Cloud Console)

**Nota**: Si no agregas estas variables de Google, la aplicación funcionará con una autenticación simulada para desarrollo.

### Paso 4: Configuración de CORS (ya implementado)

El código ya está configurado para manejar CORS en producción, aceptando solicitudes desde dominios de Render.com.

## Notas Importantes

- La aplicación utiliza autenticación stateless con JWTs almacenados en localStorage
- El servidor verifica los tokens en cada solicitud a rutas protegidas
- Para una implementación completa, configura las credenciales de Google OAuth como se indica en el Paso 3
- JWT_SECRET y GOOGLE_CLIENT_SECRET son valores diferentes y ambos son necesarios para una implementación completa

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

## Variables de Entorno para Debugging

Para resolver problemas de congelamiento en Render, puedes usar estas variables adicionales:

- `SIMPLIFIED_MODE=true` - Activa el modo simplificado para pruebas
- `USE_FALLBACK=true` - Usa modo fallback sin OpenAI para debugging
- `DEBUG=*` - Activa logs detallados

## Debugging en Render

Si la aplicación se congela después de cargar el transcript:

1. **Verificar logs del servidor** en el dashboard de Render
2. **Activar modo fallback** temporalmente agregando `USE_FALLBACK=true`
3. **Verificar la API key de OpenAI** que sea válida y tenga créditos
4. **Revisar timeouts** - el proceso puede tomar hasta 2 minutos

### Logs de Debug

La aplicación ahora incluye logs detallados que muestran:
- Proceso de carga de archivos
- Llamadas a OpenAI API 
- Procesamiento de respuestas
- Información de timeouts
- Estado del cliente en tiempo real

## Flujo de la Aplicación

La aplicación sigue un flujo tipo wizard con tres pasos principales:

1. **Paso 1:** Subir y procesar el transcript de la entrevista
2. **Paso 2:** Seleccionar el caso de estudio y nivel esperado
3. **Paso 3:** Ver y descargar los resultados de la evaluación

## Personalización

Para agregar o modificar casos de estudio, editar el archivo `case_studies.json` siguiendo el formato existente. 