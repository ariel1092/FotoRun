# 🔐 Variables de Entorno para Render

Copia y pega estas variables en **Environment** de tu Web Service en Render.

## ✅ Variables Requeridas

```env
# Base de datos (usa Internal Database URL de Render)
DATABASE_URL=postgresql://fotorun_user:password@dpg-xxxxx-a.oregon-postgres.render.com/fotorun

# JWT (genera uno seguro)
JWT_SECRET=genera_un_secreto_aleatorio_de_al_menos_32_caracteres_aqui

# Supabase Storage
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Roboflow
ROBOFLOW_API_KEY=tu_roboflow_api_key_aqui
ROBOFLOW_URL=https://serverless.roboflow.com/tu-modelo/version

# CORS (URLs de tu frontend separadas por comas)
CORS_ORIGIN=https://tu-frontend.onrender.com,https://tu-dominio.com

# Redis (usa Internal Redis URL de Render)
REDIS_HOST=red-xxxxx.render.com
REDIS_PORT=6379
REDIS_PASSWORD=tu_redis_password_aqui
REDIS_DB=0

# Servidor
NODE_ENV=production
PORT=8004
```

## 🔧 Variables Opcionales

```env
# Google Vision OCR (solo si lo usas)
GOOGLE_VISION_CREDENTIALS_PATH=/opt/render/project/src/credentials.json

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

## 📝 Notas Importantes

1. **DATABASE_URL**: Usa la **Internal Database URL** de Render (no la pública)
2. **JWT_SECRET**: Genera uno seguro con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **CORS_ORIGIN**: Separa múltiples URLs con comas (sin espacios)
4. **REDIS_HOST**: Usa la **Internal Redis URL** de Render

## 🔗 Cómo Obtener las URLs Internas en Render

1. Ve a tu servicio (PostgreSQL o Redis)
2. En la sección **"Connections"** o **"Info"**
3. Busca **"Internal Database URL"** o **"Internal Redis URL"**
4. Copia esa URL completa

