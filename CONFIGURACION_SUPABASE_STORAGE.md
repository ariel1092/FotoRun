# 📦 Configuración de Supabase Storage

## Estado Actual

El bucket `race-images` **NO existe** en tu proyecto de Supabase.

## Pasos para Crear el Bucket

### 1. Acceder a Supabase Dashboard

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: `fwvcougpqgrksxultizq`

### 2. Crear el Bucket

1. En el menú lateral, haz clic en **Storage**
2. Haz clic en **Buckets** (o **New bucket**)
3. Configura el bucket:
   - **Name:** `race-images`
   - **Public bucket:** ✅ **Sí** (marcar esta opción)
   - **File size limit:** Dejar en blanco o configurar (ej: 10MB)
   - **Allowed MIME types:** Dejar en blanco o agregar: `image/jpeg,image/png,image/webp`

4. Haz clic en **Create bucket**

### 3. Configurar Políticas de Acceso

Después de crear el bucket, configura las políticas:

1. Ve a **Storage** → **Policies**
2. Selecciona el bucket `race-images`
3. Crea políticas:

**Política 1: Lectura Pública**
- **Policy name:** `Public read access`
- **Allowed operation:** `SELECT`
- **Policy definition:**
  ```sql
  true
  ```
- **Target roles:** `anon`, `authenticated`

**Política 2: Escritura Autenticada**
- **Policy name:** `Authenticated write access`
- **Allowed operation:** `INSERT`
- **Policy definition:**
  ```sql
  auth.role() = 'authenticated'
  ```
- **Target roles:** `authenticated`

**Política 3: Actualización Autenticada**
- **Policy name:** `Authenticated update access`
- **Allowed operation:** `UPDATE`
- **Policy definition:**
  ```sql
  auth.role() = 'authenticated'
  ```
- **Target roles:** `authenticated`

**Política 4: Eliminación Autenticada**
- **Policy name:** `Authenticated delete access`
- **Allowed operation:** `DELETE`
- **Policy definition:**
  ```sql
  auth.role() = 'authenticated'
  ```
- **Target roles:** `authenticated`

### 4. Verificar Configuración

Ejecuta el script de verificación:

```bash
cd Back
node scripts/check-supabase-storage.js
```

Deberías ver: `✅ Supabase Storage está configurado correctamente`

## Nota sobre el Nombre del Bucket

El código usa `race-images` como nombre del bucket. Si prefieres usar otro nombre (como `photos`), necesitarías actualizar:

```typescript
// Back/src/storage/storage.service.ts
private readonly bucketName = 'tu-nuevo-nombre';
```

## Estructura de Carpetas

El bucket `race-images` usará esta estructura:
- `photos/` - Fotos originales
- `thumbnails/` - Miniaturas generadas automáticamente

