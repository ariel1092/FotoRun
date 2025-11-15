# 🚀 Guía de Despliegue en Render

Esta guía te ayudará a desplegar el backend de FotoRun en Render.

## 📋 Prerequisitos

1. Cuenta en [Render](https://render.com) (gratis o de pago)
2. Repositorio Git (GitHub, GitLab, o Bitbucket)
3. Variables de entorno configuradas (ver abajo)

---

## 🔧 Paso 1: Preparar el Repositorio

### 1.1. Verificar que el código esté en Git

```bash
cd FotoRun/Back
git status
git add .
git commit -m "Preparar para despliegue en Render"
git push
```

### 1.2. Verificar estructura del proyecto

Asegúrate de que el `package.json` tenga el script `start:prod`:

```json
{
  "scripts": {
    "start:prod": "node dist/main"
  }
}
```

---

## 🌐 Paso 2: Crear Servicios en Render

### 2.1. Crear Base de Datos PostgreSQL

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name:** `fotorun-database`
   - **Database:** `fotorun`
   - **User:** `fotorun_user`
   - **Region:** `Oregon` (o la más cercana a ti)
   - **Plan:** `Free` (para pruebas) o `Starter` (para producción)
4. Click en **"Create Database"**
5. **IMPORTANTE:** Copia la **Internal Database URL** (la usarás después)

### 2.2. Crear Redis (Opcional pero Recomendado)

1. Click en **"New +"** → **"Redis"**
2. Configura:
   - **Name:** `fotorun-redis`
   - **Region:** `Oregon` (misma que la base de datos)
   - **Plan:** `Free` (para pruebas) o `Starter` (para producción)
3. Click en **"Create Redis"**
4. **IMPORTANTE:** Copia el **Internal Redis URL** (la usarás después)

### 2.3. Crear Web Service (Backend)

1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio Git:
   - Selecciona tu proveedor (GitHub, GitLab, etc.)
   - Autoriza Render
   - Selecciona el repositorio `Fotorun-render`
3. Configura el servicio:
   - **Name:** `fotorun-backend`
   - **Region:** `Oregon` (misma que la base de datos)
   - **Branch:** `main` (o la rama que uses)
   - **Root Directory:** `FotoRun/Back` ⚠️ **IMPORTANTE**
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** `Free` (para pruebas) o `Starter` (para producción)

---

## 🔐 Paso 3: Configurar Variables de Entorno

En la página del Web Service, ve a **"Environment"** y agrega:

### Variables Requeridas

```env
# Base de datos (se conecta automáticamente si usas render.yaml)
DATABASE_URL=postgresql://...  # O usa la Internal Database URL de Render

# JWT
JWT_SECRET=tu_secreto_jwt_super_seguro_minimo_32_caracteres_genera_uno_aleatorio

# Supabase Storage
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key

# Roboflow
ROBOFLOW_API_KEY=tu_roboflow_api_key
ROBOFLOW_URL=https://serverless.roboflow.com/tu-modelo/version

# CORS (URL de tu frontend)
CORS_ORIGIN=https://tu-frontend.onrender.com,https://tu-dominio.com

# Redis (si creaste uno en Render)
REDIS_HOST=red-xxxxx.render.com  # O usa Internal Redis URL
REDIS_PORT=6379
REDIS_PASSWORD=tu_redis_password
REDIS_DB=0

# Servidor
NODE_ENV=production
PORT=8004
```

### Variables Opcionales

```env
# Google Vision OCR (solo si lo usas)
GOOGLE_VISION_CREDENTIALS_PATH=/opt/render/project/src/credentials.json

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### 🔑 Generar JWT_SECRET Seguro

```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y úsalo como `JWT_SECRET`.

---

## 📦 Paso 4: Configurar Build y Deploy

### 4.1. Verificar Build Command

En Render, el **Build Command** debe ser:
```bash
npm install && npm run build
```

### 4.2. Verificar Start Command

El **Start Command** debe ser:
```bash
npm run start:prod
```

### 4.3. Health Check (Opcional)

Configura un **Health Check Path**:
```
/api
```

Esto permite a Render verificar que el servicio está funcionando.

---

## 🗄️ Paso 5: Aplicar Migraciones de Base de Datos

### Opción A: Desde Render Shell

1. En Render Dashboard, ve a tu Web Service
2. Click en **"Shell"** (en el menú lateral)
3. Ejecuta:

```bash
cd /opt/render/project/src
node scripts/apply-migrations.js
```

### Opción B: Desde tu máquina local

```bash
# Conecta a la base de datos de Render
psql "tu_database_url_de_render" -f migrations/001_add_name_to_users.sql
psql "tu_database_url_de_render" -f migrations/002_fix_users_role_enum.sql
# ... etc para todas las migraciones
```

### Opción C: Script automatizado

Crea un script de despliegue que se ejecute después del build:

```bash
# En Render, agrega al Build Command:
npm install && npm run build && node scripts/apply-migrations.js
```

---

## 🚀 Paso 6: Desplegar

1. Click en **"Manual Deploy"** → **"Deploy latest commit"**
2. O simplemente haz push a tu repositorio (si tienes auto-deploy activado)
3. Espera a que el build termine (puede tomar 5-10 minutos la primera vez)
4. Verifica los logs para asegurarte de que todo funciona

---

## ✅ Paso 7: Verificar el Despliegue

### 7.1. Verificar que el servicio está corriendo

1. Ve a la URL de tu servicio: `https://fotorun-backend.onrender.com`
2. Deberías ver una respuesta JSON o el mensaje de NestJS

### 7.2. Verificar Swagger

1. Ve a: `https://fotorun-backend.onrender.com/api`
2. Deberías ver la documentación de Swagger

### 7.3. Verificar Health Check

```bash
curl https://fotorun-backend.onrender.com/api
```

### 7.4. Verificar Variables de Entorno

En Render Shell:
```bash
node scripts/verify-env.js
```

---

## 🔧 Configuración Avanzada

### Usar render.yaml (Recomendado)

Si prefieres usar el archivo `render.yaml`:

1. Asegúrate de que `render.yaml` esté en la raíz del repositorio
2. En Render Dashboard, ve a **"New +"** → **"Blueprint"**
3. Conecta tu repositorio
4. Render detectará automáticamente el `render.yaml` y creará todos los servicios

### Configurar Auto-Deploy

1. En tu Web Service, ve a **"Settings"**
2. Activa **"Auto-Deploy"**
3. Selecciona la rama (ej: `main`)
4. Cada push a esa rama desplegará automáticamente

### Configurar Custom Domain

1. En tu Web Service, ve a **"Settings"** → **"Custom Domains"**
2. Agrega tu dominio
3. Sigue las instrucciones de DNS

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"

**Solución:** Verifica que el **Root Directory** esté configurado como `FotoRun/Back`

### Error: "DATABASE_URL is missing"

**Solución:** 
- Verifica que la variable `DATABASE_URL` esté configurada
- Si usas la base de datos de Render, usa la **Internal Database URL**

### Error: "Connection refused" (Redis)

**Solución:**
- Verifica que Redis esté creado en Render
- Usa la **Internal Redis URL** de Render
- Verifica que `REDIS_HOST`, `REDIS_PORT`, y `REDIS_PASSWORD` estén configurados

### Error: "Build failed"

**Solución:**
- Revisa los logs de build en Render
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `npm install` se ejecute correctamente

### El servicio se detiene después de unos minutos (Plan Free)

**Solución:**
- Esto es normal en el plan Free de Render
- El servicio se "duerme" después de 15 minutos de inactividad
- La primera petición después de dormir puede tardar ~30 segundos
- Considera actualizar al plan Starter ($7/mes) para evitar esto

### Error: "Port already in use"

**Solución:**
- Render asigna el puerto automáticamente via `PORT`
- Asegúrate de que `main.ts` use `process.env.PORT || 8004`
- No hardcodees el puerto

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

1. En Render Dashboard, ve a tu Web Service
2. Click en **"Logs"**
3. Verás los logs en tiempo real

### Métricas

Render proporciona métricas básicas:
- CPU Usage
- Memory Usage
- Request Count
- Response Time

---

## 🔄 Actualizar el Despliegue

### Opción 1: Auto-Deploy (Recomendado)

Simplemente haz push a tu repositorio:
```bash
git push origin main
```

### Opción 2: Manual Deploy

1. En Render Dashboard, ve a tu Web Service
2. Click en **"Manual Deploy"**
3. Selecciona el commit que quieres desplegar

---

## 💰 Costos

### Plan Free
- ✅ Web Service (se duerme después de 15 min de inactividad)
- ✅ PostgreSQL (90 días gratis, luego $7/mes)
- ✅ Redis (25MB gratis)

### Plan Starter ($7/mes por servicio)
- ✅ Web Service (siempre activo)
- ✅ PostgreSQL (incluido)
- ✅ Redis (incluido)

**Recomendación:** Empieza con Free para pruebas, luego actualiza a Starter para producción.

---

## 📝 Checklist Final

- [ ] Base de datos PostgreSQL creada en Render
- [ ] Redis creado en Render (opcional pero recomendado)
- [ ] Web Service creado en Render
- [ ] Root Directory configurado como `FotoRun/Back`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run start:prod`
- [ ] Todas las variables de entorno configuradas
- [ ] JWT_SECRET generado y configurado
- [ ] CORS_ORIGIN configurado con la URL del frontend
- [ ] Migraciones de base de datos aplicadas
- [ ] Servicio desplegado y funcionando
- [ ] Swagger accesible en `/api`
- [ ] Health check funcionando

---

## 🎉 ¡Listo!

Tu backend debería estar funcionando en Render. La URL será algo como:
```
https://fotorun-backend.onrender.com
```

**Documentación API:** `https://fotorun-backend.onrender.com/api`

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render Dashboard
2. Verifica las variables de entorno
3. Consulta la [documentación de Render](https://render.com/docs)
4. Revisa los logs del build para errores específicos

