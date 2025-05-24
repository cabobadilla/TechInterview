# Tech Architecture Interview Analyzer

Aplicación para analizar y evaluar entrevistas técnicas de arquitectura utilizando OpenAI GPT.

## Tecnologías Utilizadas

- **Backend:** Node.js con Express
- **Frontend:** React con Material-UI
- **API:** OpenAI para procesamiento de lenguaje natural

## Estructura del Proyecto

```
/
├── client/                # Frontend React
│   ├── public/            # Archivos estáticos
│   └── src/               # Código fuente React
│       ├── components/    # Componentes reutilizables
│       ├── context/       # Estado global con Context API
│       └── pages/         # Páginas principales
├── uploads/               # Directorio para subida de archivos
├── case_studies.json      # Datos de casos de estudio
├── server.js              # Servidor Express principal
├── package.json           # Dependencias del proyecto
├── render.yaml            # Configuración para despliegue en Render.com
└── .env                   # Variables de entorno (no incluido en repo)
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

## Flujo de la Aplicación

La aplicación sigue un flujo tipo wizard con tres pasos principales:

1. **Paso 1:** Subir y procesar el transcript de la entrevista
2. **Paso 2:** Seleccionar el caso de estudio y nivel esperado
3. **Paso 3:** Ver y descargar los resultados de la evaluación

## Personalización

Para agregar o modificar casos de estudio, editar el archivo `case_studies.json` siguiendo el formato existente. 