# Guía de Debugging para Render

## ⚠️ ACTUALIZACIÓN - Problema Identificado y Solucionado

### Problema Principal: Error de Navegación
La aplicación se congelaba debido a una **inconsistencia en las rutas**:
- `TranscriptUpload.js` navegaba a `/case-selection`
- `App.js` tenía la ruta definida como `/select-case`

**✅ SOLUCIONADO**: Se corrigieron todas las rutas para usar `/select-case` consistentemente.

### Nuevas Funcionalidades de Debugging

#### 1. Modo de Emergencia
- Botón "Emergency Mode" en la interfaz de upload
- Bypasa el contexto y navegación para aislar problemas
- Muestra los datos extraídos sin navegar

#### 2. Debugging Mejorado
- Timer en tiempo real durante el procesamiento
- Logs detallados del lado cliente y servidor
- Información de validación de respuesta
- Detección de errores de contexto/navegación

#### 3. Endpoint de Estado
- `/api/debug/status` - muestra el estado del servidor
- Información de memoria, uptime, configuración

## Pasos para Debugging Avanzado

### Paso 1: Verificar la Corrección de Rutas
Las rutas ahora deben funcionar correctamente. Si aún hay problemas:

1. Activar "Emergency Mode" en la interfaz
2. Subir el transcript
3. Si funciona en emergency mode → problema con contexto/navegación
4. Si no funciona → problema con el servidor/OpenAI

### Paso 2: Verificar Variables de Entorno
En el dashboard de Render:
```
NODE_ENV=production
PORT=10000
OPENAI_API_KEY=tu_api_key_aqui
JWT_SECRET=tu_jwt_secret
```

### Paso 3: Debugging con Modos Especiales

#### Para problemas de OpenAI (extracción):
```
USE_FALLBACK=true
```

#### Para problemas de OpenAI (evaluación):
```
USE_EVALUATION_FALLBACK=true
```

#### Para problemas de timeout:
```
SIMPLIFIED_MODE=true
```

#### Para debugging completo:
```
DEBUG=*
USE_FALLBACK=false
USE_EVALUATION_FALLBACK=false
```

### Paso 4: Verificar Estado del Servidor
Visitar: `https://tu-app.onrender.com/api/debug/status`

## Logs Esperados (Actualizados)

### Upload Exitoso Completo:
```
=== TRANSCRIPT PROCESSING START ===
Step 5: Calling extractQAPairs...
>>> extractQAPairs START <<<
Step F: Making OpenAI API call at: [timestamp]
Step G: OpenAI API call completed in [ms] ms
>>> extractQAPairs SUCCESS <<<
Step 8: Response object created, sending JSON...
Step 9: res.json() called
=== TRANSCRIPT PROCESSING SUCCESS ===

[CLIENT]
Response validation - Response exists: true
QA pairs validation passed
Transcript set successfully
QA pairs set successfully
Step advanced successfully
Navigation completed successfully
=== CLIENT PROCESS COMPLETE ===
```

### Error de Navegación (Ahora solucionado):
```
Context/Navigation error: [error message]
```

## Debugging en Render

Si la aplicación se congela después de cargar el transcript:

1. **Verificar logs del servidor** en el dashboard de Render
2. **Activar modo fallback** temporalmente agregando `USE_FALLBACK=true`
3. **Verificar la API key de OpenAI** que sea válida y tenga créditos
4. **Revisar timeouts** - el proceso puede tomar hasta 2 minutos
5. **Usar Emergency Mode** para aislar problemas de navegación/contexto

### Logs de Debug

La aplicación ahora incluye logs detallados que muestran:
- Proceso de carga de archivos
- Llamadas a OpenAI API 
- Procesamiento de respuestas
- Información de timeouts
- Estado del cliente en tiempo real
- Validación de contexto y navegación
- Timer en tiempo real

## Estado Actual

**✅ Problema de rutas solucionado**
**✅ Debugging mejorado implementado**
**✅ Modo de emergencia disponible**
**✅ Logs detallados activos**

La aplicación debería funcionar correctamente después de estos cambios. Si persisten problemas, usar el Emergency Mode para aislar la causa. 