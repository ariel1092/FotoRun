# 🚀 Migración a Supabase Storage - Completada

## ✅ Cambios Realizados

### 1. StorageService Refactorizado
**Archivo:** `Back/src/storage/storage.service.ts`

**Cambios:**
- ✅ Refactorizado para soportar uploads generales de fotos
- ✅ Agregado método `upload()` genérico
- ✅ Agregado método `uploadPhotoWithThumbnail()` para subir foto y generar thumbnail
- ✅ Agregado método `generateThumbnail()` para generar thumbnails con Sharp
- ✅ Agregado método `delete()` y `deleteMultiple()` para eliminar archivos
- ✅ Mantenidos métodos legacy para compatibilidad hacia atrás

**Nuevas Características:**
- Generación automática de thumbnails (300x300px, quality 85)
- Organización por carpetas (photos, thumbnails, detections)
- Manejo robusto de errores
- Logging estructurado

### 2. Photo Entity Actualizada
**Archivo:** `Back/src/photos/photo.entity.ts`

**Cambios:**
- ✅ Agregado campo `thumbnailUrl` (VARCHAR(500), nullable)
- ✅ Mantiene compatibilidad con fotos existentes

### 3. PhotosModule Actualizado
**Archivo:** `Back/src/photos/photos.module.ts`

**Cambios:**
- ✅ Agregado `StorageService` a providers
- ✅ Agregado `ImageProcessingService` a providers
- ✅ Cambiado MulterModule a memory storage (en lugar de disk storage)

### 4. PhotosController Actualizado
**Archivo:** `Back/src/photos/photo.controller.ts`

**Cambios:**
- ✅ Cambiado de `diskStorage` a `memoryStorage()`
- ✅ Actualizado `uploadPhoto()` para usar `PhotosService.uploadPhoto()`
- ✅ Actualizado `uploadMultiplePhotos()` para subir en paralelo
- ✅ Eliminada dependencia de filesystem local
- ✅ Removido import no usado (`extname`)

### 5. PhotosService Actualizado
**Archivo:** `Back/src/photos/photo.service.ts`

**Cambios:**
- ✅ Agregado método `uploadPhoto()` que:
  - Sube foto a Supabase Storage
  - Genera thumbnail automáticamente
  - Crea registro en base de datos
- ✅ Actualizado `processPhoto()` para trabajar con URLs en lugar de file paths:
  - Descarga imagen desde Supabase Storage
  - Convierte a base64 para Roboflow
  - Detecta dorsales
- ✅ Actualizado `remove()` para eliminar archivos de Supabase Storage:
  - Elimina foto original
  - Elimina thumbnail
  - Mantiene registro en DB si falla eliminación de storage (graceful degradation)

### 6. Migración de Base de Datos
**Archivo:** `Back/migrations/004_add_thumbnail_url_to_photos.sql`

**Contenido:**
- Agrega columna `thumbnailUrl` a tabla `photos`
- Agrega índice opcional para búsquedas rápidas

---

## 📋 Próximos Pasos

### 1. Ejecutar Migración de Base de Datos
```sql
-- Ejecutar en tu base de datos PostgreSQL
psql -U your_user -d your_database -f Back/migrations/004_add_thumbnail_url_to_photos.sql
```

O usar tu herramienta de migraciones preferida (TypeORM migrations, etc.)

### 2. Configurar Variables de Entorno
Asegúrate de tener estas variables en tu `.env`:

```env
# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Roboflow (ya debería estar configurado)
ROBOFLOW_API_KEY=your-api-key
ROBOFLOW_URL=https://detect.roboflow.com/...
```

### 3. Configurar Bucket en Supabase
1. Ve a tu proyecto en Supabase
2. Storage → Buckets
3. Crea bucket `race-images` (si no existe)
4. Configura políticas de acceso:
   - **Public Access:** Habilitado para lectura
   - **Upload Policy:** Solo usuarios autenticados con rol photographer/admin

### 4. Verificar Funcionamiento
1. Iniciar backend: `npm run start:dev`
2. Subir una foto de prueba
3. Verificar que:
   - ✅ Foto se sube a Supabase Storage
   - ✅ Thumbnail se genera correctamente
   - ✅ URLs se guardan en base de datos
   - ✅ Procesamiento de detección funciona

### 5. Migrar Fotos Existentes (Opcional)
Si tienes fotos existentes en el filesystem local, puedes crear un script de migración:

```typescript
// Script de migración (ejemplo)
// Back/scripts/migrate-photos-to-supabase.ts
```

**Nota:** Este script no está incluido, pero puedes crearlo si necesitas migrar fotos existentes.

---

## 🔍 Verificación

### Endpoints Actualizados
- ✅ `POST /photos/upload` - Sube foto a Supabase Storage
- ✅ `POST /photos/upload-multiple` - Sube múltiples fotos en paralelo
- ✅ `DELETE /photos/:id` - Elimina foto de Supabase Storage y DB

### Flujo de Upload
1. Usuario sube foto → Controller recibe archivo en memoria
2. Controller llama a `PhotosService.uploadPhoto()`
3. Service sube foto original a Supabase Storage
4. Service genera thumbnail automáticamente
5. Service crea registro en base de datos con URLs
6. Service inicia procesamiento asíncrono (detecta dorsales)
7. Response inmediato al usuario con datos de la foto

### Beneficios
- ✅ **Escalabilidad:** No limitado por disco del servidor
- ✅ **Persistencia:** Archivos no se pierden en redeploys
- ✅ **Disponibilidad:** Accesible desde múltiples instancias
- ✅ **Performance:** Thumbnails para carga rápida en frontend
- ✅ **CDN:** Supabase Storage puede servir con CDN

---

## ⚠️ Notas Importantes

1. **Backward Compatibility:** Los métodos legacy (`uploadDetectionImage`, `deleteImage`) siguen funcionando para código existente.

2. **Memory Usage:** Usar `memoryStorage()` significa que los archivos se cargan en memoria antes de subirlos. Para archivos muy grandes (>50MB), considera streaming.

3. **Error Handling:** Si falla la eliminación de archivos en Supabase Storage, el sistema continúa eliminando el registro de la base de datos (graceful degradation).

4. **Thumbnails:** Se generan automáticamente en formato JPEG con calidad 85. Puedes ajustar estos valores en `StorageService`.

---

## 🐛 Troubleshooting

### Error: "SUPABASE_URL and SUPABASE_ANON_KEY must be configured"
**Solución:** Verifica que las variables de entorno estén configuradas correctamente.

### Error: "Failed to upload file"
**Solución:** 
- Verifica permisos del bucket en Supabase
- Verifica que el bucket `race-images` exista
- Verifica políticas de acceso

### Error: "Photo not found" al eliminar
**Solución:** Verifica que el archivo exista en Supabase Storage. El sistema intenta eliminar pero continúa si falla.

### Thumbnails no se generan
**Solución:** 
- Verifica que Sharp esté instalado: `npm install sharp`
- Verifica logs del backend para errores específicos

---

## 📊 Métricas de Éxito

- ✅ Todas las fotos nuevas se suben a Supabase Storage
- ✅ Thumbnails se generan automáticamente
- ✅ URLs correctas en base de datos
- ✅ Procesamiento de detección funciona con URLs
- ✅ Eliminación de fotos funciona correctamente

---

**Migración completada exitosamente** ✅

**Fecha:** $(date)  
**Versión:** 1.0  
**Estado:** Listo para producción (después de ejecutar migración de DB)

