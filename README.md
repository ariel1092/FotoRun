# 📸 FotoRun - Sistema de Fotografía Deportiva

Sistema completo para gestión y venta de fotos deportivas con detección automática de dorsales mediante IA.

## 🏗️ Arquitectura

- **Backend:** NestJS 11 (TypeScript) - API REST
- **Frontend:** Next.js 16 (App Router) - React
- **Base de Datos:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage
- **Procesamiento Asíncrono:** Bull Queue + Redis
- **IA:** Roboflow (Detección de dorsales)

---

## 📋 Requisitos Previos

- Node.js 18+ y npm
- PostgreSQL (o cuenta de Supabase)
- Redis (para procesamiento asíncrono)
- Cuenta de Roboflow (para detección de dorsales)
- Cuenta de Supabase (para Storage)

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone git@github.com:ariel1092/FotoRun.git
cd FotoRun
```

### 2. Configurar Backend

#### 2.1. Instalar Dependencias

```bash
cd Back
npm install
```

#### 2.2. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `Back/` basándote en `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Base de datos PostgreSQL (Supabase)
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# JWT Authentication
JWT_SECRET=tu_secreto_jwt_super_seguro_minimo_32_caracteres

# Supabase Storage
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key

# Roboflow API
ROBOFLOW_API_KEY=tu_roboflow_api_key
ROBOFLOW_URL=https://serverless.roboflow.com/tu-modelo/version

# Redis (para procesamiento asíncrono)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Servidor
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### 2.3. Aplicar Migraciones de Base de Datos

```bash
# Aplicar migraciones automáticamente
node scripts/apply-migrations.js

# O manualmente con psql
psql "tu_database_url" -f migrations/004_add_thumbnail_url_to_photos.sql
psql "tu_database_url" -f migrations/005_add_processing_status_to_photos.sql
```

#### 2.4. Verificar Configuración

```bash
# Verificar variables de entorno
node scripts/verify-env.js

# Verificar conexión a Redis
node scripts/check-redis.js

# Verificar Supabase Storage
node scripts/check-supabase-storage.js
```

#### 2.5. Iniciar Backend

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El backend estará disponible en: `http://localhost:8000`

**Documentación API:** `http://localhost:8000/api` (Swagger)

---

### 3. Configurar Frontend

#### 3.1. Instalar Dependencias

```bash
cd Front
npm install
```

#### 3.2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la carpeta `Front/`:

```env
# URL del backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 3.3. Iniciar Frontend

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run start
```

El frontend estará disponible en: `http://localhost:3000`

---

## 🔧 Configuración de Servicios Externos

### Supabase Storage

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Storage** → **Buckets**
3. Crea un nuevo bucket llamado `race-images`
4. Configura como **público** para lectura
5. Configura políticas de acceso:
   - **Lectura:** Público (anon, authenticated)
   - **Escritura:** Solo autenticado (authenticated)

### Redis

Redis es necesario para el procesamiento asíncrono de fotos.

#### Opción 1: Docker (Recomendado)

```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

#### Opción 2: Instalación Local

- **Windows:** Descargar desde [GitHub](https://github.com/microsoftarchive/redis/releases)
- **Linux:** `sudo apt-get install redis-server`
- **macOS:** `brew install redis`

#### Verificar Redis

```bash
# Desde el backend
cd Back
node scripts/check-redis.js
```

### Roboflow

1. Crea una cuenta en [Roboflow](https://roboflow.com)
2. Crea o importa tu modelo de detección de dorsales
3. Obtén tu API Key desde Settings → API
4. Obtén la URL del modelo desde tu proyecto
5. Agrega las credenciales al `.env` del backend

---

## 📊 Estructura del Proyecto

```
FotoRun/
├── Back/                 # Backend NestJS
│   ├── src/
│   │   ├── auth/        # Autenticación JWT
│   │   ├── photos/      # Gestión de fotos
│   │   ├── races/       # Gestión de eventos
│   │   ├── queue/       # Procesamiento asíncrono
│   │   ├── storage/     # Supabase Storage
│   │   └── roboflow/    # Integración con Roboflow
│   ├── migrations/      # Migraciones de BD
│   ├── scripts/         # Scripts de utilidad
│   └── .env             # Variables de entorno
│
├── Front/                # Frontend Next.js
│   ├── app/
│   │   ├── fotografo/   # Panel de fotógrafos
│   │   ├── buscar/      # Búsqueda de fotos
│   │   └── ...
│   ├── components/      # Componentes React
│   └── .env.local       # Variables de entorno
│
└── README.md            # Este archivo
```

---

## 🔐 Roles de Usuario

El sistema soporta tres roles:

- **`user`** - Corredores (buscan y compran fotos)
- **`photographer`** - Fotógrafos (suben y gestionan fotos)
- **`admin`** - Administradores (acceso completo)

---

## 🎯 Flujo de Trabajo

### Para Fotógrafos:

1. **Registro/Login:** `/fotografo/login` o `/fotografo/registro`
2. **Crear Evento:** `/fotografo/eventos/nuevo`
3. **Subir Fotos:** `/fotografo/eventos/[id]/subir`
4. **Ver Procesamiento:** Las fotos se procesan automáticamente en segundo plano
5. **Revisar Detecciones:** `/fotografo/detecciones`

### Para Corredores:

1. **Buscar Fotos:** `/buscar` (por número de dorsal)
2. **Ver Fotos:** Galería de fotos encontradas
3. **Agregar al Carrito:** Seleccionar fotos para comprar
4. **Pagar:** Integración con MercadoPago (pendiente)

---

## 🧪 Scripts Útiles

### Backend

```bash
# Verificar variables de entorno
node scripts/verify-env.js

# Verificar conexión a Redis
node scripts/check-redis.js

# Verificar Supabase Storage
node scripts/check-supabase-storage.js

# Aplicar migraciones
node scripts/apply-migrations.js
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm run start
```

---

## 🐛 Solución de Problemas

### Error: "JWT_SECRET is required"
**Solución:** Agrega `JWT_SECRET` al `.env` del backend con al menos 32 caracteres.

### Error: "Bucket not found" en Supabase
**Solución:** Crea el bucket `race-images` en Supabase Storage y configúralo como público.

### Error: "Connection refused" en Redis
**Solución:** 
- Verifica que Redis está corriendo: `redis-cli ping`
- Si no está instalado: `docker run -d -p 6379:6379 redis:latest`

### Error: "Unauthorized" al subir fotos
**Solución:** 
- Verifica que estás logueado como fotógrafo
- Verifica que el token JWT está siendo enviado
- Verifica que el usuario tiene rol `photographer` o `admin`

### Las fotos no se procesan
**Solución:**
- Verifica que Redis está corriendo
- Verifica los logs del backend para errores
- Verifica que el `PhotoProcessor` está registrado

---

## 📝 Variables de Entorno

### Backend (.env)

Ver `Back/.env.example` para la lista completa de variables requeridas.

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔄 Git Flow

Este proyecto usa Git Flow con las siguientes ramas:

- **`main`** - Producción
- **`develop`** - Desarrollo
- **`quality`** - Testing/QA
- **`feature/*`** - Nuevas funcionalidades
- **`bugfix/*`** - Corrección de bugs
- **`hotfix/*`** - Correcciones urgentes

---

## 📚 Tecnologías Utilizadas

- **Backend:**
  - NestJS 11
  - TypeORM
  - PostgreSQL
  - Bull Queue
  - Redis
  - Supabase Storage
  - Roboflow API
  - Sharp (procesamiento de imágenes)

- **Frontend:**
  - Next.js 16
  - React 18
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - Lucide Icons

---

## 👥 Contribuir

1. Crear una rama desde `develop`: `git checkout -b feature/mi-feature`
2. Hacer commits descriptivos: `git commit -m "feat: descripción"`
3. Push a la rama: `git push origin feature/mi-feature`
4. Crear Pull Request a `develop`

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 🆘 Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.

---

**Última actualización:** 2025-01-27

