# 🖼️ Configuración de Cloudinary para Marca de Agua

## ¿Qué es Cloudinary?

Cloudinary es un servicio de gestión de imágenes en la nube que permite aplicar transformaciones en tiempo real, incluyendo **marcas de agua** sin procesar las imágenes en tu servidor.

## ✅ Ventajas

- ✅ **Gratis** hasta 25 GB de almacenamiento y 25 GB de ancho de banda mensual
- ✅ **No necesitas almacenar las imágenes**: Cloudinary las obtiene desde Supabase
- ✅ **Transformaciones en tiempo real**: Marca de agua, resize, crop, etc.
- ✅ **CDN global**: Las imágenes se sirven rápido desde cualquier parte del mundo
- ✅ **Cache automático**: Cloudinary cachea las transformaciones

---

## 📝 Paso a Paso: Obtener tu Cloud Name

### 1. Registrarse en Cloudinary

1. Ve a: https://cloudinary.com/users/register_free
2. Completa el formulario:
   - Email
   - Contraseña
   - Nombre de la cuenta (puedes usar "jerpro" o el que prefieras)
3. Acepta términos y condiciones
4. Haz click en **"Sign Up"**

### 2. Verificar Email

1. Revisa tu bandeja de entrada
2. Haz click en el link de verificación del email

### 3. Obtener Cloud Name

1. Una vez dentro, ve al **Dashboard**
2. En la sección **"Account Details"** (parte superior), verás:
   ```
   Cloud name: dxxxxxx (ejemplo)
   API Key: 123456789012345
   API Secret: xxxxxxxxxxxxx
   ```
3. **Copia el Cloud Name** (el que empieza con "d" generalmente)

### 4. Configurar en el Proyecto

1. Abre el archivo `Front/.env`
2. Reemplaza `tu-cloud-name-aqui` con tu Cloud Name real:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxxx
   ```
   Ejemplo real:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dlskdj8s9
   ```

### 5. Reiniciar el Frontend

1. Detén el servidor de Next.js (Ctrl + C en la terminal)
2. Vuelve a iniciar:
   ```bash
   cd Front
   npm run dev
   ```

---

## 🧪 Probar la Marca de Agua

1. Ve a `http://localhost:3001/buscar?numero=907`
2. La imagen ahora debería mostrar la marca de agua "JERPRO FOTOGRAFIA" en mosaico
3. La marca de agua es semitransparente (20% de opacidad)

---

## 🎨 Cómo Funciona

Cuando usas `buildCloudinaryWatermarkedUrl()`, se genera una URL como:

```
https://res.cloudinary.com/[tu-cloud-name]/image/fetch/
  c_limit,w_1600/
  l_text:Arial_50:JERPRO%20FOTOGRAFIA,co_rgb:ffffff,o_20/
  fl_layer_apply,e_tiling/
  https%3A%2F%2Ffwvcougpqgrksxultizq.supabase.co%2Fstorage%2F...
```

**Transformaciones aplicadas**:
- `c_limit,w_1600` → Limita el ancho a 1600px (para velocidad)
- `l_text:Arial_50:JERPRO FOTOGRAFIA` → Overlay de texto con fuente Arial 50px
- `co_rgb:ffffff` → Color blanco
- `o_20` → Opacidad 20%
- `fl_layer_apply,e_tiling` → Aplica el texto en mosaico (repetido)
- URL final → La URL de Supabase donde está la imagen original

---

## 🔧 Personalizar la Marca de Agua

Si querés cambiar el estilo, editá `Front/lib/utils.ts`:

```typescript
export function buildCloudinaryWatermarkedUrl(originalUrl: string, text: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloud || !originalUrl) return originalUrl

  const encodedText = encodeURIComponent(text)
  const fontSpec = 'Arial_50' // Cambiar fuente y tamaño

  const transformation = [
    'c_limit,w_1600',
    `l_text:${fontSpec}:${encodedText},co_rgb:ffffff,o_20`, // Cambiar color y opacidad
    'fl_layer_apply,e_tiling',
  ].join('/')

  const encodedSource = encodeURIComponent(originalUrl)
  return `https://res.cloudinary.com/${cloud}/image/fetch/${transformation}/${encodedSource}`
}
```

### Opciones de Personalización:

**Fuente**:
- `Arial_50` → Arial 50px
- `Arial_80` → Arial 80px (más grande)
- `Times_New_Roman_40` → Times New Roman 40px

**Color** (`co_rgb:RRGGBB`):
- `co_rgb:ffffff` → Blanco
- `co_rgb:000000` → Negro
- `co_rgb:F59E0B` → Amarillo JERPRO

**Opacidad** (`o_XX`):
- `o_10` → 10% (muy transparente)
- `o_20` → 20% (actual)
- `o_50` → 50% (más visible)

**Posición** (en lugar de mosaico):
```typescript
// Marca de agua en esquina inferior derecha
'g_south_east,x_20,y_20'
```

---

## 💰 Límites del Plan Gratuito

- ✅ **25 GB** de almacenamiento
- ✅ **25 GB** de ancho de banda mensual
- ✅ **25 créditos** de transformación (más que suficiente para desarrollo)
- ✅ **1 usuario**
- ✅ **Soporte comunitario**

Para JERPRO en producción, probablemente alcance durante varios meses de uso normal.

---

## 🚨 Troubleshooting

### La marca de agua no aparece

**1. Verificá que el Cloud Name esté configurado**:
```bash
# En la terminal del frontend
echo $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

**2. Reiniciá el frontend**:
```bash
# Ctrl + C para detener
npm run dev
```

**3. Verificá en el navegador (DevTools → Network)**:
- Buscá la request a `res.cloudinary.com`
- Si no hay requests a Cloudinary, el Cloud Name no está configurado

### Error 401 - Unauthorized

Cloudinary requiere que la URL de origen sea pública. Supabase ya es pública, así que esto no debería pasar.

### La imagen no carga

1. Verificá que la URL original de Supabase funcione
2. Intentá acceder directamente a la URL de Cloudinary en el navegador
3. Revisá la consola del navegador para errores

---

## 📚 Documentación Oficial

- Cloudinary Fetch: https://cloudinary.com/documentation/fetch_remote_images
- Text Overlays: https://cloudinary.com/documentation/image_transformations#adding_text_captions
- Tiling Effect: https://cloudinary.com/documentation/image_transformations#tiling_effect

---

**¡Listo! Con esto ya tenés marca de agua en todas las fotos de JERPRO 🎉**
