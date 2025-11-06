# 📋 TAREAS PENDIENTES PARA COMPLETAR EL SISTEMA

## ✅ COMPLETADAS

1. ✅ **Login de fotógrafos** - Implementado y conectado con backend
2. ✅ **Registro de fotógrafos** - Implementado con endpoint específico
3. ✅ **Filtrado de fotos por fotógrafo** - Endpoint GET /photos ahora filtra correctamente
4. ✅ **Endpoint de registro para fotógrafos** - POST /auth/register/photographer creado
5. ✅ **Panel del fotógrafo mejorado** - Layout, dashboard, páginas de gestión

---

## 🔴 TAREAS PENDIENTES - PRIORIDAD ALTA

### 1. 🗄️ Aplicar Migraciones de Base de Datos

**Ubicación:** `Back/migrations/`

**Migraciones pendientes:**
- `004_add_thumbnail_url_to_photos.sql` - Agrega columna `thumbnailUrl`
- `005_add_processing_status_to_photos.sql` - Agrega `processingStatus` y `processingError`

**Cómo aplicar:**
```bash
# Opción 1: Desde psql
psql -U tu_usuario -d tu_base_de_datos -f Back/migrations/004_add_thumbnail_url_to_photos.sql
psql -U tu_usuario -d tu_base_de_datos -f Back/migrations/005_add_processing_status_to_photos.sql

# Opción 2: Desde el cliente de tu base de datos (pgAdmin, DBeaver, etc.)
# Copiar y ejecutar el contenido de cada archivo SQL
```

**Verificar:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('thumbnailUrl', 'processingStatus', 'processingError');
```

---

### 2. ⚙️ Configurar Variables de Entorno

#### Backend (`Back/.env`)

**Variables requeridas:**
```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:puerto/nombre_bd

# JWT Authentication
JWT_SECRET=tu_secreto_jwt_super_seguro_y_largo_minimo_32_caracteres

# Supabase Storage
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=photos

# Roboflow API
ROBOFLOW_API_KEY=tu_roboflow_api_key
ROBOFLOW_MODEL_ID=tu_model_id
ROBOFLOW_VERSION=1

# Redis (para Bull Queue - procesamiento asíncrono)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Dejar vacío si no tiene password
```

#### Frontend (`Front/.env.local`)

**Variables requeridas:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Nota:** En producción, cambiar a la URL de tu backend desplegado.

---

### 3. 🗂️ Configurar Supabase Storage

**Pasos:**
1. Ir a tu proyecto en Supabase Dashboard
2. Ir a **Storage** → **Buckets**
3. Crear un nuevo bucket llamado `photos`
4. Configurar políticas:
   - **Lectura:** Público (para que las fotos sean accesibles)
   - **Escritura:** Solo autenticado (o usar service role key)
5. Verificar que el bucket está activo

**Verificar:**
- El bucket `photos` existe
- Las políticas de acceso están configuradas
- La `SUPABASE_KEY` en el `.env` es la Service Role Key (no la anon key)

---

### 4. 🔴 Configurar Redis

**Redis es necesario para el procesamiento asíncrono de fotos.**

#### Opción 1: Docker (Recomendado)
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

#### Opción 2: Instalación local
```bash
# Windows (con Chocolatey)
choco install redis-64

# Linux
sudo apt-get install redis-server

# macOS
brew install redis
```

**Verificar que funciona:**
```bash
redis-cli ping
# Debería responder: PONG
```

**Si Redis no está corriendo:**
- El sistema seguirá funcionando para subir fotos
- PERO las fotos NO se procesarán (quedarán en estado "pending")
- Los jobs se acumularán en la queue hasta que Redis esté disponible

---

### 5. 🤖 Verificar Configuración de Roboflow

**Pasos:**
1. Obtener tu API key de Roboflow:
   - Ir a https://roboflow.com
   - Tu cuenta → Settings → API
2. Obtener el Model ID y Version:
   - Ir a tu modelo en Roboflow
   - Copiar el Model ID y Version desde la URL o configuración
3. Agregar al `.env` del backend

**Verificar:**
- La API key es válida
- El Model ID corresponde a tu modelo de detección de dorsales
- La versión es correcta

---

## 🟡 TAREAS PENDIENTES - PRIORIDAD MEDIA

### 6. ✅ Verificar Queue Worker

**Verificar que el procesamiento asíncrono funciona:**

1. **Subir una foto de prueba**
2. **Revisar logs del backend:**
   ```bash
   # Deberías ver logs como:
   # [PhotoProcessor] Processing photo: <photo-id>
   # [PhotosService] Found X detections for photo <photo-id>
   ```
3. **Verificar en la base de datos:**
   ```sql
   SELECT id, "processingStatus", "processingError" 
   FROM photos 
   ORDER BY "createdAt" DESC 
   LIMIT 5;
   ```
   - Debería cambiar de `pending` → `processing` → `completed`

**Si no funciona:**
- Verificar que Redis está corriendo
- Verificar logs del backend para errores
- Verificar que el `PhotoProcessor` está registrado en `QueueModule`

---

### 7. 🧪 Probar Flujo Completo

**Checklist de pruebas:**

- [ ] **Registro:**
  - Crear cuenta como fotógrafo
  - Verificar que se guarda con rol `photographer`
  - Verificar que puede hacer login

- [ ] **Login:**
  - Hacer login con credenciales válidas
  - Verificar que se guarda token en localStorage
  - Verificar que redirige al dashboard

- [ ] **Crear Evento:**
  - Crear un nuevo evento
  - Verificar que se guarda en BD
  - Verificar que aparece en la lista de eventos

- [ ] **Subir Fotos:**
  - Subir una o más fotos
  - Verificar que se suben a Supabase Storage
  - Verificar que se crean registros en BD
  - Verificar que se agregan jobs a la queue

- [ ] **Procesamiento:**
  - Esperar unos segundos
  - Verificar que el estado cambia a `processing` y luego `completed`
  - Verificar que se detectan dorsales
  - Verificar que las detecciones se guardan en BD

- [ ] **Ver Fotos:**
  - Verificar que solo muestra fotos del fotógrafo autenticado
  - Verificar que muestra thumbnails
  - Verificar que muestra detecciones
  - Verificar que el estado se actualiza en tiempo real

- [ ] **Estadísticas:**
  - Verificar que el dashboard muestra estadísticas correctas
  - Verificar que los contadores son precisos

---

## 🟢 TAREAS OPCIONALES - MEJORAS

### 8. 📝 Validaciones Adicionales

- Validar formato de email en frontend
- Validar tamaño máximo de archivos antes de subir
- Agregar límites de rate limiting más estrictos
- Validar que las fotos son realmente imágenes (ya implementado con magic numbers)

### 9. 🎨 Mejoras de UX

- Agregar notificaciones cuando una foto termina de procesarse
- Mejorar feedback visual durante la subida
- Agregar preview de fotos antes de subir
- Agregar opción para eliminar fotos

### 10. 🧪 Tests

- Tests unitarios para servicios críticos
- Tests de integración para flujos principales
- Tests E2E para el flujo completo

---

## 📊 RESUMEN DE PRIORIDADES

### 🔴 CRÍTICO (Hacer primero)
1. Aplicar migraciones de BD
2. Configurar variables de entorno
3. Configurar Supabase Storage
4. Configurar Redis

### 🟡 IMPORTANTE (Hacer después)
5. Verificar configuración de Roboflow
6. Verificar Queue Worker
7. Probar flujo completo

### 🟢 OPCIONAL (Mejoras futuras)
8. Validaciones adicionales
9. Mejoras de UX
10. Tests

---

## 🚀 ORDEN RECOMENDADO DE EJECUCIÓN

1. **Aplicar migraciones de BD** (5 min)
2. **Configurar variables de entorno** (10 min)
3. **Configurar Supabase Storage** (5 min)
4. **Configurar Redis** (5 min)
5. **Verificar Roboflow** (5 min)
6. **Probar flujo completo** (15 min)

**Tiempo total estimado:** ~45 minutos

---

## ❓ ¿NECESITAS AYUDA?

Si tienes problemas con alguna de estas tareas:

1. **Migraciones:** Verifica que tienes acceso a la BD y permisos suficientes
2. **Variables de entorno:** Asegúrate de que todos los valores son correctos (no placeholders)
3. **Supabase:** Verifica que el bucket existe y las políticas están configuradas
4. **Redis:** Verifica que está corriendo con `redis-cli ping`
5. **Roboflow:** Verifica que la API key es válida y el modelo existe

---

**Última actualización:** $(date)

