# ⚡ Despliegue Rápido en Render - Guía Express

## 🎯 Pasos Rápidos (5 minutos)

### 1️⃣ Crear Base de Datos PostgreSQL
- Render Dashboard → **"New +"** → **"PostgreSQL"**
- Name: `fotorun-database`
- Plan: `Free` (o `Starter` para producción)
- **Copia la Internal Database URL**

### 2️⃣ Crear Redis (Opcional)
- Render Dashboard → **"New +"** → **"Redis"**
- Name: `fotorun-redis`
- Plan: `Free`
- **Copia la Internal Redis URL**

### 3️⃣ Crear Web Service
- Render Dashboard → **"New +"** → **"Web Service"**
- Conecta tu repositorio Git
- Configura:
  - **Name:** `fotorun-backend`
  - **Root Directory:** `FotoRun/Back` ⚠️
  - **Build Command:** `npm install && npm run build`
  - **Start Command:** `npm run start:prod`
  - **Plan:** `Free` (o `Starter` para producción)

### 4️⃣ Configurar Variables de Entorno
En el Web Service → **"Environment"**, agrega todas las variables de `RENDER_ENV_VARS.md`

### 5️⃣ Desplegar
- Click en **"Manual Deploy"** → **"Deploy latest commit"**
- Espera 5-10 minutos
- ✅ Listo!

---

## 🔑 Generar JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📍 URLs Importantes

- **Backend:** `https://fotorun-backend.onrender.com`
- **API Docs:** `https://fotorun-backend.onrender.com/api`
- **Health Check:** `https://fotorun-backend.onrender.com/api`

---

## ⚠️ Recordatorios

1. **Root Directory** debe ser `FotoRun/Back`
2. Usa **Internal URLs** para DATABASE_URL y REDIS_HOST
3. Configura **CORS_ORIGIN** con la URL de tu frontend
4. El plan **Free** se duerme después de 15 min de inactividad

---

## 🆘 Problemas Comunes

**Error: "Cannot find module"**
→ Verifica que Root Directory sea `FotoRun/Back`

**Error: "DATABASE_URL is missing"**
→ Agrega la variable en Environment usando Internal Database URL

**El servicio se detiene**
→ Normal en plan Free. Primera petición después de dormir tarda ~30 segundos

---

Para más detalles, ver `DEPLOY_RENDER.md`


