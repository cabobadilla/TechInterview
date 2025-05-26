# 🔑 Claves de Seguridad Generadas

## Para configurar en Render Environment Variables:

### JWT_SECRET
```
pITtfeyF/it5WtPcZTRqUr5CbKSxHHn7uDasHSBQUpQ6HLTaOpV5cRrE/PqAImJNuRbYZIxyJbD0FvwJT+mjBQ==
```

### ENCRYPTION_KEY
```
0e2e35733b85b1212f46054bb37522147e7fb979f0097e6ac041297bc1dce95f
```

## ⚠️ IMPORTANTE
- Estas claves son únicas y seguras
- Úsalas exactamente como están (sin espacios adicionales)
- NO las compartas públicamente
- Elimina este archivo después de configurar Render

## 📋 Variables de Entorno Completas para Render

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host:port/database
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
JWT_SECRET=pITtfeyF/it5WtPcZTRqUr5CbKSxHHn7uDasHSBQUpQ6HLTaOpV5cRrE/PqAImJNuRbYZIxyJbD0FvwJT+mjBQ==
ENCRYPTION_KEY=0e2e35733b85b1212f46054bb37522147e7fb979f0097e6ac041297bc1dce95f
OPENAI_API_KEY=sk-tu_openai_api_key
```

Reemplaza:
- `DATABASE_URL`: Con la URL de tu PostgreSQL de Render
- `GOOGLE_CLIENT_ID`: Con tu Google Client ID
- `GOOGLE_CLIENT_SECRET`: Con tu Google Client Secret  
- `OPENAI_API_KEY`: Con tu clave de OpenAI (opcional) 