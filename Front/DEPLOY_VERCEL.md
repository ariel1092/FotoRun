# 🚀 Despliegue del Frontend en Vercel

## 📋 Prerequisitos

1. Cuenta en [Vercel](https://vercel.com) (gratis)
2. Repositorio Git conectado (GitHub, GitLab, o Bitbucket)
3. URL del backend desplegado en Render

---

## 🔧 Paso 1: Conectar Repositorio

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..."** → **"Project"**
3. Conecta tu repositorio `ariel1092/FotoRun`
4. Selecciona el repositorio

---

## ⚙️ Paso 2: Configurar el Proyecto

### 2.1. Configuración Básica

- **Framework Preset:** Next.js (se detecta automáticamente)
- **Root Directory:** `Front` ⚠️ **IMPORTANTE**
- **Build Command:** `npm run build` (automático)
- **Output Directory:** `.next` (automático)
- **Install Command:** `npm install` (automático)

### 2.2. Variables de Entorno

En la sección **"Environment Variables"**, agrega:

#### Variables Requeridas

```env
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
```

**⚠️ IMPORTANTE:** Reemplaza `tu-backend.onrender.com` con la URL real de tu backend en Render.

#### Variables Opcionales

```env
# MercadoPago (solo si implementas pagos)
MERCADOPAGO_ACCESS_TOKEN=tu_mercadopago_access_token

# Link de pago (solo si usas link externo)
NEXT_PUBLIC_JERPRO_PAYMENT_LINK=https://tu-link-de-pago

# Cloudinary (solo si usas Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloudinary_cloud_name
```

---

## 🚀 Paso 3: Desplegar

1. Click en **"Deploy"**
2. Espera a que el build termine (2-5 minutos)
3. Vercel te dará una URL como: `https://fotorun-frontend.vercel.app`

---

## ✅ Paso 4: Verificar el Despliegue

1. Visita la URL de Vercel
2. Verifica que la página carga correctamente
3. Prueba hacer login
4. Verifica que las peticiones al backend funcionan

---

## 🔄 Paso 5: Configurar Auto-Deploy

1. En Vercel Dashboard, ve a **Settings** → **Git**
2. Verifica que **Auto-Deploy** esté activado
3. Cada push a `main` desplegará automáticamente

---

## 🔧 Configuración Avanzada

### Custom Domain

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS

### Environment Variables por Entorno

Puedes configurar variables diferentes para:
- **Production:** Variables de producción
- **Preview:** Variables para branches de preview
- **Development:** Variables para desarrollo local

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"

**Solución:** Verifica que el **Root Directory** esté configurado como `Front`

### Error: "API_URL is not defined"

**Solución:** 
- Verifica que `NEXT_PUBLIC_API_URL` esté configurada
- Asegúrate de que el nombre empiece con `NEXT_PUBLIC_` (requerido para variables públicas en Next.js)

### Error: CORS en peticiones al backend

**Solución:**
- Verifica que `CORS_ORIGIN` en el backend incluya la URL de Vercel
- Ejemplo: `CORS_ORIGIN=https://fotorun-frontend.vercel.app`

### El frontend no se conecta al backend

**Solución:**
- Verifica que `NEXT_PUBLIC_API_URL` apunte a la URL correcta del backend
- Verifica que el backend esté funcionando
- Revisa la consola del navegador para errores

---

## 📊 Monitoreo

Vercel proporciona:
- **Analytics:** Métricas de visitas
- **Speed Insights:** Performance del sitio
- **Logs:** Logs en tiempo real
- **Deployments:** Historial de despliegues

---

## 💰 Costos

### Plan Free (Hobby)
- ✅ Hosting ilimitado
- ✅ 100GB bandwidth/mes
- ✅ Auto-deploy
- ✅ Custom domains
- ✅ SSL automático

### Plan Pro ($20/mes)
- ✅ Todo del plan Free
- ✅ Analytics avanzado
- ✅ Más bandwidth
- ✅ Soporte prioritario

**Recomendación:** Empieza con el plan Free, es suficiente para la mayoría de casos.

---

## ✅ Checklist Final

- [ ] Repositorio conectado a Vercel
- [ ] Root Directory configurado como `Front`
- [ ] `NEXT_PUBLIC_API_URL` configurada con URL del backend
- [ ] Build exitoso
- [ ] Frontend accesible en la URL de Vercel
- [ ] Login funcionando
- [ ] Peticiones al backend funcionando
- [ ] CORS configurado en el backend
- [ ] Auto-deploy activado

---

## 🎉 ¡Listo!

Tu frontend debería estar funcionando en Vercel. La URL será algo como:
```
https://fotorun-frontend.vercel.app
```

**Backend:** `https://tu-backend.onrender.com`
**Frontend:** `https://fotorun-frontend.vercel.app`

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Consulta la [documentación de Vercel](https://vercel.com/docs)
4. Revisa la consola del navegador para errores



