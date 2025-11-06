# 🔧 PENDIENTES PARA QUE EL FLUJO DEL SISTEMA FUNCIONE CORRECTAMENTE

## 📋 RESUMEN EJECUTIVO

Este documento lista todas las tareas pendientes para que el sistema funcione completamente de extremo a extremo.

---

## 🔐 1. AUTENTICACIÓN Y AUTORIZACIÓN

### ❌ CRÍTICO: Implementar Login y Registro de Fotógrafos en Frontend

**Ubicación:** `Front/app/fotografo/login/page.tsx` y `Front/app/fotografo/registro/page.tsx`

**Problema:**
- Las páginas tienen `TODO: Implement authentication with Supabase`
- Actualmente solo hacen un `setTimeout` y redirigen
- No se conectan con el backend API

**Solución:**
```typescript
// En login/page.tsx
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setIsLoading(true)

  const formData = new FormData(e.currentTarget)
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const response = await authApi.login(email, password)
    
    // Guardar token y usuario
    localStorage.setItem("jerpro_token", response.access_token)
    localStorage.setItem("jerpro_user", JSON.stringify({
      ...response.user,
      role: "photographer" // Asegurar que el rol sea photographer
    }))
    
    router.push("/fotografo/dashboard")
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Credenciales inválidas",
      variant: "destructive",
    })
    setIsLoading(false)
  }
}
```

**También necesitas:**
- Implementar registro con validación de contraseñas
- Agregar manejo de errores apropiado
- Validar que el usuario tenga rol `photographer` o `admin`

---

## 📸 2. ENDPOINTS DE FOTOS

### ❌ CRÍTICO: Filtrar Fotos por Fotógrafo Autenticado

**Ubicación:** `Back/src/photos/photo.controller.ts`

**Problema:**
- El endpoint `GET /photos` devuelve TODAS las fotos, no solo las del fotógrafo autenticado
- Debería filtrar por `uploadedBy` del usuario autenticado

**Solución:**
```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('photographer', 'admin')
async getAllPhotos(@CurrentUser() user: User): Promise<Photo[]> {
  return await this.photosService.findAllByPhotographer(user.id);
}
```

**Y en `photo.service.ts`:**
```typescript
async findAllByPhotographer(photographerId: string): Promise<Photo[]> {
  return await this.photoRepository.find({
    where: { uploadedBy: photographerId },
    relations: ['detections', 'race'],
    order: { createdAt: 'DESC' },
  });
}
```

---

## 🗄️ 3. BASE DE DATOS

### ⚠️ IMPORTANTE: Aplicar Migraciones

**Ubicaciones:**
- `Back/migrations/004_add_thumbnail_url_to_photos.sql`
- `Back/migrations/005_add_processing_status_to_photos.sql`

**Verificar:**
```sql
-- Verificar que las columnas existen
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('thumbnailUrl', 'processingStatus', 'processingError');
```

**Si no existen, ejecutar:**
```bash
# En el directorio Back
psql -U tu_usuario -d tu_base_de_datos -f migrations/004_add_thumbnail_url_to_photos.sql
psql -U tu_usuario -d tu_base_de_datos -f migrations/005_add_processing_status_to_photos.sql
```

---

## 🔧 4. CONFIGURACIÓN DE VARIABLES DE ENTORNO

### ⚠️ CRÍTICO: Verificar Variables de Entorno

**Backend (.env):**
```env
# Base de datos
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=tu_secreto_jwt_super_seguro

# Supabase Storage
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_supabase_key
SUPABASE_STORAGE_BUCKET=photos

# Roboflow
ROBOFLOW_API_KEY=tu_roboflow_api_key
ROBOFLOW_MODEL_ID=tu_model_id
ROBOFLOW_VERSION=1

# Redis (para Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Si está configurado
```

**Frontend (.env.local o .env):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Verificar que:**
- ✅ Todas las variables están definidas
- ✅ Los valores son correctos (no placeholders)
- ✅ Supabase Storage bucket existe y está configurado
- ✅ Redis está corriendo si usas procesamiento asíncrono

---

## 🚀 5. SERVICIOS EXTERNOS

### ⚠️ IMPORTANTE: Verificar Configuración de Servicios

#### Supabase Storage
- [ ] Bucket `photos` creado
- [ ] Políticas de acceso configuradas (público para lectura, privado para escritura)
- [ ] Storage API key configurada

#### Redis
- [ ] Redis corriendo localmente o en servidor
- [ ] Conexión verificada desde el backend
- [ ] Bull Queue procesando jobs correctamente

#### Roboflow
- [ ] API key válida
- [ ] Modelo configurado correctamente
- [ ] Versión del modelo correcta

---

## 📝 6. ENDPOINT DE REGISTRO

### ❌ CRÍTICO: Registrar Fotógrafos con Rol Correcto

**Ubicación:** `Back/src/auth/auth.controller.ts`

**Verificar:**
- El endpoint de registro debe permitir especificar el rol `photographer`
- O crear un endpoint específico para registro de fotógrafos

**Sugerencia:**
```typescript
@Post('register/photographer')
@HttpCode(HttpStatus.CREATED)
async registerPhotographer(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
  // Crear usuario con role: 'photographer'
  const user = await this.usersService.create({
    ...registerDto,
    role: 'photographer'
  });
  
  return this.authService.login(user);
}
```

---

## 🔄 7. PROCESAMIENTO ASÍNCRONO

### ⚠️ IMPORTANTE: Verificar Queue Worker

**Ubicación:** `Back/src/queue/processors/photo.processor.ts`

**Verificar:**
- [ ] El processor está registrado correctamente
- [ ] Redis está conectado
- [ ] Los jobs se están procesando
- [ ] Los errores se manejan correctamente

**Prueba:**
```bash
# Verificar que Bull Queue está procesando
# En el backend, revisar logs cuando subas una foto
# Deberías ver logs del processor
```

---

## 🎨 8. FRONTEND - INTEGRACIÓN COMPLETA

### ❌ CRÍTICO: Conectar Frontend con Backend

**Páginas que necesitan implementación:**

1. **Login (`/fotografo/login`):**
   - ✅ Conectar con `authApi.login`
   - ✅ Guardar token y usuario
   - ✅ Manejar errores

2. **Registro (`/fotografo/registro`):**
   - ✅ Conectar con endpoint de registro
   - ✅ Validar contraseñas coinciden
   - ✅ Manejar errores

3. **Crear Evento (`/fotografo/eventos/nuevo`):**
   - ✅ Ya está conectado con `racesApi.create`
   - ⚠️ Verificar que el precio se envía (campo `price` en el formulario)

4. **Subir Fotos (`/fotografo/eventos/[id]/subir`):**
   - ✅ Ya está conectado
   - ⚠️ Verificar que el progreso funciona correctamente
   - ⚠️ Verificar que muestra errores de upload

---

## 🧪 9. PRUEBAS BÁSICAS DEL FLUJO

### Checklist de Pruebas:

- [ ] **Registro de Fotógrafo:**
  1. Crear cuenta como fotógrafo
  2. Verificar que se guarda con rol `photographer`
  3. Verificar que puede hacer login

- [ ] **Login:**
  1. Intentar login con credenciales válidas
  2. Verificar que se guarda token
  3. Verificar que redirige al dashboard

- [ ] **Crear Evento:**
  1. Crear un nuevo evento
  2. Verificar que se guarda en BD
  3. Verificar que aparece en la lista

- [ ] **Subir Fotos:**
  1. Subir una foto
  2. Verificar que se sube a Supabase Storage
  3. Verificar que se crea registro en BD
  4. Verificar que se agrega job a la queue

- [ ] **Procesamiento:**
  1. Verificar que el queue worker procesa la foto
  2. Verificar que se detectan dorsales
  3. Verificar que se actualiza el estado

- [ ] **Ver Fotos:**
  1. Verificar que solo muestra fotos del fotógrafo autenticado
  2. Verificar que muestra detecciones
  3. Verificar que se actualiza el estado en tiempo real

---

## 🐛 10. ERRORES COMUNES Y SOLUCIONES

### Error: "JWT_SECRET is required"
**Solución:** Agregar `JWT_SECRET` al `.env` del backend

### Error: "Bucket not found" en Supabase
**Solución:** Crear el bucket `photos` en Supabase Storage

### Error: "Connection refused" en Redis
**Solución:** 
- Verificar que Redis está corriendo: `redis-cli ping`
- Si no está instalado: `docker run -d -p 6379:6379 redis`

### Error: "Unauthorized" al subir fotos
**Solución:** 
- Verificar que el token JWT está siendo enviado
- Verificar que el usuario tiene rol `photographer` o `admin`

### Error: "Photo not found" al buscar
**Solución:** Verificar que el endpoint filtra por fotógrafo autenticado

---

## 📊 11. PRIORIZACIÓN

### 🔴 PRIORIDAD ALTA (Bloqueantes)
1. ✅ Implementar login de fotógrafos
2. ✅ Implementar registro de fotógrafos
3. ✅ Filtrar fotos por fotógrafo autenticado
4. ✅ Aplicar migraciones de BD

### 🟡 PRIORIDAD MEDIA (Importantes)
5. ✅ Verificar configuración de servicios externos
6. ✅ Verificar que el queue worker funciona
7. ✅ Mejorar manejo de errores en frontend

### 🟢 PRIORIDAD BAJA (Mejoras)
8. ✅ Agregar validaciones adicionales
9. ✅ Mejorar feedback visual
10. ✅ Agregar tests

---

## ✅ CHECKLIST FINAL

Antes de considerar el sistema listo, verificar:

- [ ] Login de fotógrafos funciona
- [ ] Registro de fotógrafos funciona
- [ ] Crear eventos funciona
- [ ] Subir fotos funciona
- [ ] Procesamiento asíncrono funciona
- [ ] Ver fotos propias funciona
- [ ] Ver detecciones funciona
- [ ] Estadísticas muestran datos correctos
- [ ] Todas las migraciones aplicadas
- [ ] Variables de entorno configuradas
- [ ] Servicios externos conectados
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del backend

---

## 📝 NOTAS ADICIONALES

- El sistema usa procesamiento asíncrono, así que las fotos pueden tardar unos segundos en procesarse
- El polling automático en el frontend debería actualizar el estado cada 10 segundos
- Asegurarse de que Redis está corriendo antes de subir fotos, o el procesamiento no funcionará

---

**Última actualización:** $(date)

