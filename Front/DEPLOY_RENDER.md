# 🚀 Despliegue del Frontend en Render

## 📋 Prerequisitos

1. Cuenta en [Render](https://render.com) (gratis o de pago)
2. Repositorio Git conectado
3. URL del backend desplegado en Render

---

## 🔧 Paso 1: Crear Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio Git:
   - Selecciona tu proveedor (GitHub, GitLab, etc.)
   - Autoriza Render
   - Selecciona el repositorio `ariel1092/FotoRun`

---

## ⚙️ Paso 2: Configurar el Servicio

### 2.1. Configuración Básica

- **Name:** `fotorun-frontend`
- **Region:** `Oregon` (o la más cercana)
- **Branch:** `main`
- **Root Directory:** `Front` ⚠️ **IMPORTANTE**
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Plan:** `Free` (para pruebas) o `Starter` (para producción)

### 2.2. Variables de Entorno

En la sección **"Environment"**, agrega:

#### Variables Requeridas

```env
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
NODE_ENV=production
```

**⚠️ IMPORTANTE:** Reemplaza `tu-backend.onrender.com` con la URL real de tu backend.

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

1. Click en **"Create Web Service"**
2. Espera a que el build termine (5-10 minutos la primera vez)
3. Render te dará una URL como: `https://fotorun-frontend.onrender.com`

---

## ✅ Paso 4: Verificar el Despliegue

1. Visita la URL de Render
2. Verifica que la página carga correctamente
3. Prueba hacer login
4. Verifica que las peticiones al backend funcionan

---

## 🔄 Paso 5: Configurar Auto-Deploy

1. En Render Dashboard, ve a tu Web Service
2. Ve a **Settings** → **Auto-Deploy**
3. Activa **"Auto-Deploy"**
4. Selecciona la rama `main`

---

## 🔧 Configuración Avanzada

### Custom Domain

1. Ve a **Settings** → **Custom Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS

### Health Check

Configura un **Health Check Path**:
```
/
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"

**Solución:** Verifica que el **Root Directory** esté configurado como `Front`

### Error: "API_URL is not defined"

**Solución:** 
- Verifica que `NEXT_PUBLIC_API_URL` esté configurada
- Asegúrate de que el nombre empiece con `NEXT_PUBLIC_`

### Error: CORS en peticiones al backend

**Solución:**
- Verifica que `CORS_ORIGIN` en el backend incluya la URL de Render
- Ejemplo: `CORS_ORIGIN=https://fotorun-frontend.onrender.com`

### El servicio se detiene después de unos minutos (Plan Free)

**Solución:**
- Esto es normal en el plan Free de Render
- El servicio se "duerme" después de 15 minutos de inactividad
- La primera petición después de dormir puede tardar ~30 segundos
- Considera actualizar al plan Starter ($7/mes) para evitar esto

---

## 💰 Costos

### Plan Free
- ✅ Web Service (se duerme después de 15 min de inactividad)
- ✅ SSL automático
- ✅ Auto-deploy

### Plan Starter ($7/mes)
- ✅ Web Service (siempre activo)
- ✅ SSL automático
- ✅ Auto-deploy
- ✅ Más recursos

**Recomendación:** Empieza con Free para pruebas, luego actualiza a Starter para producción.

---

## ✅ Checklist Final

- [ ] Web Service creado en Render
- [ ] Root Directory configurado como `Front`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run start`
- [ ] `NEXT_PUBLIC_API_URL` configurada con URL del backend
- [ ] Build exitoso
- [ ] Frontend accesible en la URL de Render
- [ ] Login funcionando
- [ ] Peticiones al backend funcionando
- [ ] CORS configurado en el backend
- [ ] Auto-deploy activado

---

## 🎉 ¡Listo!

Tu frontend debería estar funcionando en Render. La URL será algo como:
```
https://fotorun-frontend.onrender.com
```

**Backend:** `https://tu-backend.onrender.com`
**Frontend:** `https://fotorun-frontend.onrender.com`

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render Dashboard
2. Verifica las variables de entorno
3. Consulta la [documentación de Render](https://render.com/docs)
4. Revisa la consola del navegador para errores



