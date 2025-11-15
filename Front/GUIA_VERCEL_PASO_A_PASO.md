# 🚀 Guía Paso a Paso: Desplegar Frontend en Vercel

## 📋 Paso 1: Crear Cuenta en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Click en **"Sign Up"**
3. Elige **"Continue with GitHub"** (recomendado) o tu proveedor Git preferido
4. Autoriza Vercel para acceder a tu repositorio

---

## 📋 Paso 2: Crear Nuevo Proyecto

1. En el Dashboard de Vercel, click en **"Add New..."** → **"Project"**
2. Si es la primera vez, verás una lista de tus repositorios
3. Busca y selecciona el repositorio **`ariel1092/FotoRun`**
4. Click en **"Import"**

---

## ⚙️ Paso 3: Configurar el Proyecto

### 3.1. Configuración del Framework

Vercel detectará automáticamente Next.js. Verás:

- **Framework Preset:** `Next.js` ✅ (auto-detectado)
- **Root Directory:** ⚠️ **CAMBIA ESTO A:** `Front`
- **Build Command:** `npm run build` (automático)
- **Output Directory:** `.next` (automático)
- **Install Command:** `npm install` (automático)

### 3.2. Configurar Root Directory

**⚠️ MUY IMPORTANTE:**

1. Click en **"Edit"** junto a "Root Directory"
2. Cambia de `./` a `Front`
3. Esto le dice a Vercel que el código de Next.js está en la carpeta `Front/`

---

## 🔐 Paso 4: Configurar Variables de Entorno

Antes de hacer deploy, configura las variables de entorno:

### 4.1. Variables Requeridas

1. En la sección **"Environment Variables"**, click en **"Add"**
2. Agrega la siguiente variable:

```
Name: NEXT_PUBLIC_API_URL
Value: https://tu-backend.onrender.com
```

**⚠️ IMPORTANTE:** 
- Reemplaza `tu-backend.onrender.com` con la URL real de tu backend en Render
- Ejemplo: Si tu backend es `https://fotorun-backend.onrender.com`, usa esa URL
- El nombre DEBE empezar con `NEXT_PUBLIC_` para que sea accesible en el cliente

### 4.2. Variables Opcionales (si las necesitas)

Si implementaste pagos o usas Cloudinary, agrega:

```
MERCADOPAGO_ACCESS_TOKEN=tu_token (opcional)
NEXT_PUBLIC_JERPRO_PAYMENT_LINK=https://tu-link (opcional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name (opcional)
```

---

## 🚀 Paso 5: Desplegar

1. Una vez configurado todo, click en **"Deploy"**
2. Vercel comenzará a construir tu proyecto
3. Verás el progreso en tiempo real
4. El proceso tomará 2-5 minutos

---

## ✅ Paso 6: Verificar el Despliegue

1. Una vez completado, verás un mensaje de éxito
2. Vercel te dará una URL como: `https://fotorun-frontend.vercel.app`
3. Click en la URL para abrir tu aplicación
4. Verifica que:
   - ✅ La página carga correctamente
   - ✅ No hay errores en la consola del navegador
   - ✅ El diseño se ve bien

---

## 🔧 Paso 7: Configurar CORS en el Backend

**⚠️ CRÍTICO:** Después de desplegar el frontend, debes actualizar CORS en el backend:

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio `fotorun-backend`
3. Ve a **"Environment"** → **"Environment Variables"**
4. Busca `CORS_ORIGIN` o créala si no existe
5. Agrega la URL de tu frontend de Vercel:

```
CORS_ORIGIN=https://tu-proyecto.vercel.app
```

Si ya tienes otras URLs, sepáralas con comas:

```
CORS_ORIGIN=https://tu-proyecto.vercel.app,https://otra-url.com
```

6. **Guarda los cambios**
7. **Reinicia el servicio backend** (click en "Manual Deploy" → "Deploy latest commit")

---

## 🧪 Paso 8: Probar la Conexión

1. Abre tu frontend en Vercel
2. Intenta hacer login
3. Verifica que las peticiones al backend funcionen
4. Revisa la consola del navegador (F12) para errores

Si ves errores de CORS:
- Verifica que `CORS_ORIGIN` en el backend incluya la URL de Vercel
- Verifica que el backend esté reiniciado
- Verifica que `NEXT_PUBLIC_API_URL` esté configurada correctamente

---

## 🔄 Paso 9: Configurar Auto-Deploy

Para que cada push a `main` despliegue automáticamente:

1. En Vercel Dashboard, ve a tu proyecto
2. Ve a **"Settings"** → **"Git"**
3. Verifica que **"Production Branch"** sea `main`
4. Verifica que **"Auto-Deploy"** esté activado ✅

Ahora, cada vez que hagas `git push origin main`, Vercel desplegará automáticamente.

---

## 🎨 Paso 10: Custom Domain (Opcional)

Si tienes un dominio personalizado:

1. Ve a **"Settings"** → **"Domains"**
2. Click en **"Add"**
3. Ingresa tu dominio (ej: `www.tudominio.com`)
4. Sigue las instrucciones de DNS que Vercel te proporciona
5. Espera a que se verifique (puede tomar unos minutos)

---

## 🐛 Solución de Problemas

### Error: "Build Failed"

**Posibles causas:**
- Root Directory incorrecto
- Variables de entorno faltantes
- Errores de TypeScript

**Solución:**
1. Verifica que Root Directory sea `Front`
2. Revisa los logs de build en Vercel
3. Verifica que todas las variables de entorno estén configuradas

### Error: "Cannot connect to backend"

**Solución:**
1. Verifica que `NEXT_PUBLIC_API_URL` esté configurada correctamente
2. Verifica que el backend esté funcionando
3. Verifica que `CORS_ORIGIN` en el backend incluya la URL de Vercel
4. Revisa la consola del navegador para errores específicos

### Error: CORS en el navegador

**Solución:**
1. Verifica que `CORS_ORIGIN` en el backend incluya la URL exacta de Vercel
2. Reinicia el backend después de cambiar CORS
3. Verifica que no haya espacios en la URL

### El frontend carga pero no se conecta al backend

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta hacer una petición (ej: login)
4. Revisa qué error aparece en la petición
5. Verifica que `NEXT_PUBLIC_API_URL` sea correcta

---

## 📊 Monitoreo

Vercel proporciona:

- **Analytics:** Métricas de visitas (requiere plan Pro)
- **Speed Insights:** Performance del sitio
- **Logs:** Logs en tiempo real
- **Deployments:** Historial de todos los despliegues

---

## ✅ Checklist Final

- [ ] Cuenta en Vercel creada
- [ ] Repositorio conectado
- [ ] Root Directory configurado como `Front`
- [ ] `NEXT_PUBLIC_API_URL` configurada con URL del backend
- [ ] Deploy exitoso
- [ ] Frontend accesible en la URL de Vercel
- [ ] `CORS_ORIGIN` en backend actualizada con URL de Vercel
- [ ] Backend reiniciado
- [ ] Login funcionando
- [ ] Peticiones al backend funcionando
- [ ] Auto-deploy configurado

---

## 🎉 ¡Listo!

Tu frontend debería estar funcionando en Vercel. La URL será algo como:
```
https://fotorun-frontend.vercel.app
```

**Backend:** `https://tu-backend.onrender.com`
**Frontend:** `https://tu-proyecto.vercel.app`

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Consulta la [documentación de Vercel](https://vercel.com/docs)
4. Revisa la consola del navegador para errores


