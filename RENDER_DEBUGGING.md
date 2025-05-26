# Guía de Debugging para Render

## Problema Identificado
La aplicación se congela después de cargar el archivo de transcript en el endpoint `/api/transcript`.

## Debugging Implementado

### 1. Logs del Servidor
- ✅ Logs detallados en el proceso de carga de archivos
- ✅ Rastreo paso a paso de la función `extractQAPairs`
- ✅ Información de timeouts y duración de llamadas OpenAI
- ✅ Logs de inicialización de OpenAI

### 2. Logs del Cliente  
- ✅ Panel de debug en tiempo real en la UI
- ✅ Información de progreso de upload
- ✅ Timeouts del lado cliente (2 minutos)
- ✅ Estados de error detallados

### 3. Modos de Fallback
- ✅ Modo fallback sin OpenAI (`USE_FALLBACK=true`)
- ✅ Modo simplificado (`SIMPLIFIED_MODE=true`)
- ✅ Timeouts configurables

## Pasos para Resolver en Render

### Paso 1: Verificar Variables de Entorno
En el dashboard de Render, agregar/verificar:
```
NODE_ENV=production
PORT=10000
OPENAI_API_KEY=tu_api_key_aqui
JWT_SECRET=tu_jwt_secret
```

### Paso 2: Activar Modo Debugging Temporal
Agregar temporalmente para identificar el problema:
```
USE_FALLBACK=true
```

### Paso 3: Verificar Logs
En los logs de Render buscar:
- `>>> extractQAPairs START <<<`
- `Step F: Making OpenAI API call at:`
- `>>> extractQAPairs ERROR <<<`

### Paso 4: Según los Resultados

#### Si funciona en modo fallback:
- El problema es con OpenAI API
- Verificar API key y créditos
- Remover `USE_FALLBACK=true`

#### Si NO funciona en modo fallback:
- El problema es antes de la llamada OpenAI
- Revisar logs de carga de archivos
- Verificar configuración de multer/uploads

### Paso 5: Opciones de Resolución

#### Opción A: API Key Inválida
```
OPENAI_API_KEY=nueva_api_key_valida
```

#### Opción B: Timeout de Render
```
SIMPLIFIED_MODE=true
```

#### Opción C: Problema de Memoria
Revisar el tamaño del archivo transcript y optimizar

## Logs Esperados

### Inicio Exitoso:
```
=== OPENAI INITIALIZATION ===
OpenAI initialized successfully
Serving static files from: /opt/render/project/src/client/build
Server running on port 10000
```

### Upload Exitoso:
```
=== TRANSCRIPT PROCESSING START ===
Step 5: Calling extractQAPairs...
>>> extractQAPairs START <<<
Step F: Making OpenAI API call at: [timestamp]
Step G: OpenAI API call completed in [ms] ms
>>> extractQAPairs SUCCESS <<<
=== TRANSCRIPT PROCESSING SUCCESS ===
```

### Error Típico:
```
>>> extractQAPairs ERROR <<<
Error type: [tipo de error]
Error message: [mensaje]
```

## Contacto
Si el problema persiste después de estos pasos, compartir los logs completos del proceso de upload. 