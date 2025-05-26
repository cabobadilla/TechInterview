# Debug Guide: Evaluation Issue

## Problema Identificado
La aplicación procesa correctamente la transcripción pero falla durante la evaluación. Los logs muestran que el proceso se corta abruptamente en la función `evaluateAnswers`.

## Pasos de Debugging Implementados

### 1. Logging Detallado Agregado
- ✅ Función `evaluateAnswers` con logging paso a paso
- ✅ Endpoint `/api/evaluate` con logging detallado
- ✅ Cliente (`CaseSelection.js`) con logging completo
- ✅ Indicadores visuales de progreso en la UI

### 2. Modos de Fallback
- ✅ `USE_FALLBACK=true` - Bypass OpenAI para extracción
- ✅ `USE_EVALUATION_FALLBACK=true` - Bypass OpenAI para evaluación
- ✅ `SIMPLIFIED_MODE=true` - Modo simplificado general

### 3. Timeouts y Error Handling
- ✅ Timeout de 90 segundos para evaluación OpenAI
- ✅ Manejo detallado de errores con contexto
- ✅ Logging de duración de procesos

## Pasos para Resolver el Problema

### Paso 1: Activar Modo de Fallback para Evaluación
En el dashboard de Render, agregar:
```
USE_EVALUATION_FALLBACK=true
```

Esto generará resultados mock para la evaluación y confirmará si el problema está en OpenAI o en otra parte.

### Paso 2: Verificar los Logs
Después de activar el fallback, intentar una evaluación y revisar los logs. Deberías ver:

```
=== EVALUATION PROCESSING START ===
>>> evaluateAnswers START <<<
Using FALLBACK mode - generating mock evaluation results
Generated mock evaluation results: 2
>>> evaluateAnswers SUCCESS (FALLBACK) <<<
=== EVALUATION PROCESSING SUCCESS ===
```

### Paso 3: Si el Fallback Funciona
Si el modo fallback funciona, el problema está en la llamada a OpenAI. Posibles causas:
1. **API Key inválida o sin créditos**
2. **Timeout de OpenAI** (prompt muy largo)
3. **Rate limiting** de OpenAI
4. **Problema de red** en Render

### Paso 4: Si el Fallback También Falla
Si incluso el fallback falla, el problema está en:
1. **Contexto de React** (setEvaluationResults)
2. **Navegación** (navigate('/results'))
3. **Autenticación** (token expirado)

## Logs Esperados

### Evaluación Exitosa (Fallback):
```
=== CLIENT EVALUATION START ===
Step 1: Starting evaluation API call...
=== EVALUATION PROCESSING START ===
>>> evaluateAnswers START <<<
Using FALLBACK mode - generating mock evaluation results
>>> evaluateAnswers SUCCESS (FALLBACK) <<<
=== EVALUATION PROCESSING SUCCESS ===
Step 2: Evaluation API call completed in [ms] ms
=== CLIENT EVALUATION SUCCESS ===
```

### Evaluación Exitosa (OpenAI Real):
```
=== EVALUATION PROCESSING START ===
>>> evaluateAnswers START <<<
Step F: Making OpenAI evaluation API call at: [timestamp]
Step G: OpenAI evaluation API call completed in [ms] ms
Step O: Evaluation JSON parsing successful
>>> evaluateAnswers SUCCESS <<<
=== EVALUATION PROCESSING SUCCESS ===
```

## Variables de Entorno para Debugging

```bash
# Para testing rápido (sin OpenAI)
USE_EVALUATION_FALLBACK=true

# Para debugging completo
DEBUG=*
NODE_ENV=production

# Para problemas de timeout
SIMPLIFIED_MODE=true

# Para problemas de API key
USE_FALLBACK=true
USE_EVALUATION_FALLBACK=true
```

## Próximos Pasos

1. **Activar `USE_EVALUATION_FALLBACK=true`** en Render
2. **Probar la evaluación** y revisar logs
3. **Si funciona**: El problema es OpenAI (API key, créditos, timeout)
4. **Si no funciona**: El problema es el contexto/navegación de React
5. **Reportar resultados** para siguiente iteración de debugging

## Comandos Útiles

```bash
# Ver logs en tiempo real (si tienes acceso SSH)
tail -f /var/log/app.log

# Verificar variables de entorno
echo $USE_EVALUATION_FALLBACK

# Test endpoint de debug
curl https://tu-app.onrender.com/api/debug/status
``` 