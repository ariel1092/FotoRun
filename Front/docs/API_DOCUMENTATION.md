# 📚 JERPRO - Documentación de API Backend

## Información General

**Versión:** 1.0.0  
**Base URL:** `https://api.jerpro.com/v1`  
**Autenticación:** JWT (JSON Web Tokens)  
**Stack Tecnológico:** NestJS, TypeScript, Supabase, JWT

---

## 📑 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Búsqueda de Fotos](#búsqueda-de-fotos)
3. [Eventos](#eventos)
4. [Gestión de Fotos (Fotógrafos)](#gestión-de-fotos-fotógrafos)
5. [Carrito y Compras](#carrito-y-compras)
6. [Descargas](#descargas)
7. [Webhooks](#webhooks)
8. [Perfil de Usuario](#perfil-de-usuario)
9. [Estructura de Base de Datos](#estructura-de-base-de-datos)
10. [Consideraciones de Seguridad](#consideraciones-de-seguridad)

---

## 🔐 Autenticación

### Registro de Usuario

**Endpoint:** `POST /auth/register`

**Descripción:** Registra un nuevo usuario en la plataforma (corredor o fotógrafo).

**Body:**
\`\`\`json
{
  "email": "string (required)",
  "password": "string (required, min 8 caracteres)",
  "userType": "runner | photographer (required)",
  "name": "string (optional)",
  "phone": "string (optional)"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "userType": "string",
    "name": "string"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
\`\`\`

**Errores:**
- `400` - Datos inválidos
- `409` - Email ya registrado

---

### Login

**Endpoint:** `POST /auth/login`

**Descripción:** Autentica un usuario existente.

**Body:**
\`\`\`json
{
  "email": "string (required)",
  "password": "string (required)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "userType": "string"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
\`\`\`

**Errores:**
- `401` - Credenciales inválidas
- `404` - Usuario no encontrado

---

### Refresh Token

**Endpoint:** `POST /auth/refresh`

**Descripción:** Genera un nuevo access token usando el refresh token.

**Body:**
\`\`\`json
{
  "refreshToken": "string (required)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "accessToken": "string"
}
\`\`\`

**Errores:**
- `401` - Refresh token inválido o expirado

---

### Logout

**Endpoint:** `POST /auth/logout`

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Logout exitoso"
}
\`\`\`

---

### Recuperar Contraseña

**Endpoint:** `POST /auth/forgot-password`

**Descripción:** Envía un email con link para resetear contraseña.

**Body:**
\`\`\`json
{
  "email": "string (required)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Email enviado con instrucciones"
}
\`\`\`

---

### Resetear Contraseña

**Endpoint:** `POST /auth/reset-password`

**Body:**
\`\`\`json
{
  "token": "string (required)",
  "newPassword": "string (required, min 8 caracteres)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Contraseña actualizada exitosamente"
}
\`\`\`

---

## 🏃 Búsqueda de Fotos

### Buscar Fotos

**Endpoint:** `GET /photos/search`

**Descripción:** Busca fotos por número de dorsal, disciplina o evento.

**Query Parameters:**
- `bibNumber` (string, optional) - Número de dorsal
- `discipline` (string, optional) - running | ciclismo | enduro | mtb | trail | triatlon
- `eventId` (uuid, optional) - ID del evento
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20, max: 100)

**Response (200):**
\`\`\`json
{
  "photos": [
    {
      "id": "uuid",
      "url": "string (URL con watermark)",
      "urlOriginal": "string | null (solo si está comprada)",
      "bibNumber": "number",
      "eventId": "uuid",
      "eventName": "string",
      "discipline": "string",
      "date": "ISO 8601 date",
      "price": "number",
      "isPurchased": "boolean",
      "thumbnailUrl": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
\`\`\`

**Ejemplo de Request:**
\`\`\`
GET /photos/search?bibNumber=1234&discipline=running&page=1&limit=20
\`\`\`

---

### Obtener Foto Individual

**Endpoint:** `GET /photos/:id`

**Descripción:** Obtiene los detalles de una foto específica.

**Response (200):**
\`\`\`json
{
  "photo": {
    "id": "uuid",
    "url": "string",
    "urlOriginal": "string | null",
    "bibNumber": "number",
    "eventId": "uuid",
    "eventName": "string",
    "discipline": "string",
    "date": "ISO 8601 date",
    "price": "number",
    "isPurchased": "boolean",
    "thumbnailUrl": "string",
    "metadata": {
      "width": "number",
      "height": "number",
      "size": "number (bytes)"
    }
  }
}
\`\`\`

**Errores:**
- `404` - Foto no encontrada

---

## 🎪 Eventos

### Listar Eventos

**Endpoint:** `GET /events`

**Descripción:** Lista todos los eventos públicos disponibles.

**Query Parameters:**
- `discipline` (string, optional) - Filtrar por disciplina
- `status` (string, optional) - active | archived (default: active)
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)

**Response (200):**
\`\`\`json
{
  "events": [
    {
      "id": "uuid",
      "name": "string",
      "date": "ISO 8601 date",
      "location": "string",
      "discipline": "string",
      "photoCount": "number",
      "coverImage": "string | null",
      "pricePerPhoto": "number"
    }
  ],
  "total": "number"
}
\`\`\`

---

### Obtener Evento Específico

**Endpoint:** `GET /events/:id`

**Response (200):**
\`\`\`json
{
  "event": {
    "id": "uuid",
    "name": "string",
    "date": "ISO 8601 date",
    "location": "string",
    "discipline": "string",
    "photoCount": "number",
    "coverImage": "string | null",
    "pricePerPhoto": "number",
    "description": "string",
    "photographerId": "uuid",
    "photographerName": "string"
  }
}
\`\`\`

**Errores:**
- `404` - Evento no encontrado

---

### Crear Evento

**Endpoint:** `POST /events`

**Autenticación:** Requerida (solo fotógrafos)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Body:**
\`\`\`json
{
  "name": "string (required)",
  "date": "ISO 8601 date (required)",
  "location": "string (required)",
  "discipline": "string (required)",
  "pricePerPhoto": "number (required)",
  "description": "string (optional)"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "event": {
    "id": "uuid",
    "name": "string",
    "date": "ISO 8601 date",
    "location": "string",
    "discipline": "string",
    "pricePerPhoto": "number",
    "status": "active",
    "createdAt": "ISO 8601 date"
  }
}
\`\`\`

**Errores:**
- `401` - No autenticado
- `403` - Usuario no es fotógrafo
- `400` - Datos inválidos

---

### Actualizar Evento

**Endpoint:** `PUT /events/:id`

**Autenticación:** Requerida (solo el fotógrafo dueño)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Body:**
\`\`\`json
{
  "name": "string (optional)",
  "date": "ISO 8601 date (optional)",
  "location": "string (optional)",
  "discipline": "string (optional)",
  "pricePerPhoto": "number (optional)",
  "description": "string (optional)",
  "status": "active | archived (optional)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "event": {
    "id": "uuid",
    "name": "string",
    "date": "ISO 8601 date",
    "location": "string",
    "discipline": "string",
    "pricePerPhoto": "number",
    "status": "string",
    "updatedAt": "ISO 8601 date"
  }
}
\`\`\`

**Errores:**
- `401` - No autenticado
- `403` - No autorizado (no es el dueño)
- `404` - Evento no encontrado

---

### Eliminar Evento

**Endpoint:** `DELETE /events/:id`

**Autenticación:** Requerida (solo el fotógrafo dueño)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Evento eliminado exitosamente"
}
\`\`\`

**Errores:**
- `401` - No autenticado
- `403` - No autorizado
- `404` - Evento no encontrado
- `409` - No se puede eliminar (tiene fotos vendidas)

---

## 📸 Gestión de Fotos (Fotógrafos)

### Subir Fotos a un Evento

**Endpoint:** `POST /photographer/events/:eventId/photos/upload`

**Autenticación:** Requerida (solo fotógrafos)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
\`\`\`

**Body (FormData):**
- `files` - Array de archivos (JPG/PNG, max 10MB cada uno)
- `autoDetectBib` - boolean (default: true) - Detectar dorsales con IA

**Response (202):**
\`\`\`json
{
  "uploadId": "uuid",
  "status": "processing",
  "totalFiles": "number",
  "message": "Fotos en proceso de análisis con IA",
  "estimatedTime": "number (segundos)"
}
\`\`\`

**Errores:**
- `401` - No autenticado
- `403` - No autorizado (no es el dueño del evento)
- `404` - Evento no encontrado
- `400` - Archivos inválidos
- `413` - Archivos muy grandes

---

### Verificar Estado del Procesamiento

**Endpoint:** `GET /photographer/uploads/:uploadId/status`

**Autenticación:** Requerida

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
\`\`\`json
{
  "uploadId": "uuid",
  "status": "processing | completed | failed",
  "processed": "number",
  "total": "number",
  "photos": [
    {
      "id": "uuid",
      "url": "string",
      "bibNumber": "number | null",
      "detectionConfidence": "number (0-1)"
    }
  ],
  "errors": [
    {
      "fileName": "string",
      "error": "string"
    }
  ]
}
\`\`\`

---

### Listar Fotos de un Evento

**Endpoint:** `GET /photographer/events/:eventId/photos`

**Autenticación:** Requerida

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 50)
- `bibNumber` (number, optional) - Filtrar por dorsal
- `status` (string, optional) - pending | approved

**Response (200):**
\`\`\`json
{
  "photos": [
    {
      "id": "uuid",
      "url": "string",
      "thumbnailUrl": "string",
      "bibNumber": "number | null",
      "detectionConfidence": "number",
      "status": "pending | approved",
      "uploadedAt": "ISO 8601 date",
      "views": "number",
      "purchases": "number"
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
\`\`\`

---

### Editar Número de Dorsal

**Endpoint:** `PUT /photographer/photos/:photoId`

**Autenticación:** Requerida

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Body:**
\`\`\`json
{
  "bibNumber": "number (required)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "photo": {
    "id": "uuid",
    "bibNumber": "number",
    "updatedAt": "ISO 8601 date"
  }
}
\`\`\`

**Errores:**
- `401` - No autenticado
- `403` - No autorizado
- `404` - Foto no encontrada

---

### Eliminar Foto

**Endpoint:** `DELETE /photographer/photos/:photoId`

**Autenticación:** Requerida

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Foto eliminada exitosamente"
}
\`\`\`

**Errores:**
- `401` - No autenticado
- `403` - No autorizado
- `404` - Foto no encontrada
- `409` - No se puede eliminar (ya fue vendida)

---

## 🛒 Carrito y Compras

### Crear Orden de Compra

**Endpoint:** `POST /purchases/create`

**Autenticación:** Opcional (puede comprar sin registro)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken> (optional)
\`\`\`

**Body:**
\`\`\`json
{
  "email": "string (required)",
  "photoIds": ["uuid"] (required, min 1 item),
  "total": "number (required)"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "purchaseId": "uuid",
  "status": "pending",
  "message": "Compra registrada. Serás redirigido al link de pago del fotógrafo."
}
\`\`\`

**Notas importantes:**
- El sistema NO procesa pagos directamente
- Cada fotógrafo tiene su propio link de pago de MercadoPago
- El frontend redirige al usuario al link de pago del fotógrafo
- El fotógrafo debe confirmar manualmente el pago en su dashboard
- Una vez confirmado, el cliente recibe email con links de descarga

**Errores:**
- `400` - Datos inválidos
- `404` - Una o más fotos no encontradas

---

### Confirmar Pago (Fotógrafo)

**Endpoint:** `POST /purchases/:purchaseId/confirm-payment`

**Autenticación:** Requerida (solo fotógrafos)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Body:**
\`\`\`json
{
  "paymentReference": "string (optional)",
  "notes": "string (optional)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "status": "approved",
  "purchase": {
    "id": "uuid",
    "email": "string",
    "photos": [...],
    "downloadTokens": ["string"],
    "confirmedAt": "ISO 8601 date"
  },
  "message": "Pago confirmado. Email enviado al cliente con links de descarga."
}
\`\`\`

**Proceso automático al confirmar:**
1. Marca la compra como "approved"
2. Genera tokens de descarga únicos para cada foto
3. Envía email al cliente con links de descarga
4. Notifica al fotógrafo de la confirmación

**Errores:**
- `401` - No autenticado
- `403` - No autorizado (no es el fotógrafo dueño de las fotos)
- `404` - Compra no encontrada
- `409` - Compra ya confirmada

---

### Rechazar/Cancelar Compra (Fotógrafo)

**Endpoint:** `POST /purchases/:purchaseId/reject`

**Autenticación:** Requerida (solo fotógrafos)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Body:**
\`\`\`json
{
  "reason": "string (optional)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "status": "rejected",
  "message": "Compra rechazada"
}
\`\`\`

---

### Listar Compras Pendientes (Fotógrafo)

**Endpoint:** `GET /photographer/purchases/pending`

**Autenticación:** Requerida (solo fotógrafos)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)

**Response (200):**
\`\`\`json
{
  "purchases": [
    {
      "id": "uuid",
      "email": "string",
      "date": "ISO 8601 date",
      "total": "number",
      "status": "pending",
      "photoCount": "number",
      "photos": [
        {
          "id": "uuid",
          "thumbnailUrl": "string",
          "bibNumber": "number",
          "eventName": "string"
        }
      ]
    }
  ],
  "total": "number"
}
\`\`\`

---

## 📥 Descargas

### Descargar Foto sin Watermark

**Endpoint:** `GET /downloads/photo/:photoId`

**Autenticación:** Requerida o Token

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Query Parameters:**
- `token` (string, optional) - Token de descarga alternativo

**Response (200):**
- Content-Type: image/jpeg
- Content-Disposition: attachment; filename="photo-{bibNumber}-{eventName}.jpg"
- Body: Binary stream del archivo JPG

**Errores:**
- `401` - No autenticado
- `403` - Foto no comprada
- `404` - Foto no encontrada

---

### Descargar Todas las Fotos (ZIP)

**Endpoint:** `GET /downloads/purchase/:purchaseId`

**Autenticación:** Requerida

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
- Content-Type: application/zip
- Content-Disposition: attachment; filename="jerpro-photos-{purchaseId}.zip"
- Body: Binary stream del archivo ZIP

**Errores:**
- `401` - No autenticado
- `403` - No autorizado
- `404` - Compra no encontrada

---

### Generar Link de Descarga Temporal

**Endpoint:** `POST /downloads/generate-link`

**Autenticación:** Requerida

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Body:**
\`\`\`json
{
  "photoId": "uuid (required)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "downloadUrl": "string",
  "expiresAt": "ISO 8601 date (24 horas)"
}
\`\`\`

**Errores:**
- `401` - No autenticado
- `403` - Foto no comprada
- `404` - Foto no encontrada

---

## 🔔 Webhooks

**NOTA:** En este modelo de negocio, los webhooks de MercadoPago NO son necesarios ya que cada fotógrafo maneja sus propios pagos a través de sus links personales de MercadoPago. El fotógrafo confirma manualmente los pagos desde su dashboard.

Si en el futuro se desea automatizar la confirmación de pagos, se puede implementar un webhook opcional que el fotógrafo configure con su cuenta de MercadoPago.

---

## 👤 Perfil de Usuario

### Obtener Perfil

**Endpoint:** `GET /users/me`

**Autenticación:** Requerida

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
\`\`\`json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "phone": "string",
    "userType": "runner | photographer",
    "createdAt": "ISO 8601 date",
    "avatar": "string | null"
  }
}
\`\`\`

---

### Actualizar Perfil

**Endpoint:** `PUT /users/me`

**Autenticación:** Requerida

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Body:**
\`\`\`json
{
  "name": "string (optional)",
  "phone": "string (optional)",
  "avatar": "string (optional, URL)"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "phone": "string",
    "userType": "string",
    "avatar": "string | null",
    "updatedAt": "ISO 8601 date"
  }
}
\`\`\`

---

### Obtener Estadísticas (Fotógrafos)

**Endpoint:** `GET /users/photographer/stats`

**Autenticación:** Requerida (solo fotógrafos)

**Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

**Response (200):**
\`\`\`json
{
  "stats": {
    "totalPhotos": "number",
    "totalEvents": "number",
    "totalSales": "number",
    "totalRevenue": "number",
    "monthlyRevenue": "number",
    "topEvents": [
      {
        "eventId": "uuid",
        "eventName": "string",
        "sales": "number",
        "revenue": "number"
      }
    ],
    "recentSales": [
      {
        "purchaseId": "uuid",
        "date": "ISO 8601 date",
        "photoCount": "number",
        "total": "number"
      }
    ]
  }
}
\`\`\`

**Errores:**
- `401` - No autenticado
- `403` - Usuario no es fotógrafo

---

## 🗄️ Estructura de Base de Datos

### Tabla: users

\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) CHECK (user_type IN ('runner', 'photographer')),
  name VARCHAR(255),
  phone VARCHAR(50),
  avatar VARCHAR(500),
  payment_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
\`\`\`

---

### Tabla: events

\`\`\`sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255),
  discipline VARCHAR(50) CHECK (discipline IN ('running', 'ciclismo', 'enduro', 'mtb', 'trail', 'triatlon')),
  price_per_photo DECIMAL(10,2) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_photographer ON events(photographer_id);
CREATE INDEX idx_events_discipline ON events(discipline);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
\`\`\`

---

### Tabla: photos

\`\`\`sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  url_watermark VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  bib_number INTEGER,
  detection_confidence DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_photos_event ON photos(event_id);
CREATE INDEX idx_photos_bib ON photos(bib_number);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_event_bib ON photos(event_id, bib_number);
\`\`\`

---

### Tabla: purchases

\`\`\`sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  photographer_id UUID NOT NULL REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  payment_reference VARCHAR(255),
  notes TEXT,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_email ON purchases(email);
CREATE INDEX idx_purchases_photographer ON purchases(photographer_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_created ON purchases(created_at);
\`\`\`

---

### Tabla: purchase_photos

\`\`\`sql
CREATE TABLE purchase_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  download_token VARCHAR(255) UNIQUE,
  downloaded_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_photos_purchase ON purchase_photos(purchase_id);
CREATE INDEX idx_purchase_photos_photo ON purchase_photos(photo_id);
CREATE INDEX idx_purchase_photos_token ON purchase_photos(download_token);
CREATE UNIQUE INDEX idx_purchase_photo_unique ON purchase_photos(purchase_id, photo_id);
\`\`\`

---

### Tabla: upload_batches

\`\`\`sql
CREATE TABLE upload_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  photographer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_files INTEGER NOT NULL,
  processed_files INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_upload_batches_event ON upload_batches(event_id);
CREATE INDEX idx_upload_batches_photographer ON upload_batches(photographer_id);
CREATE INDEX idx_upload_batches_status ON upload_batches(status);
\`\`\`

---

### Tabla: refresh_tokens

\`\`\`sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
\`\`\`

---

## 🔒 Consideraciones de Seguridad

### 1. Autenticación JWT

- **Access Token:** Duración de 15 minutos
- **Refresh Token:** Duración de 7 días
- **Algoritmo:** HS256 o RS256
- **Secret Key:** Almacenar en variables de entorno
- **Payload mínimo:** `{ userId, email, userType, iat, exp }`

\`\`\`typescript
// Ejemplo de configuración JWT en NestJS
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '15m' }
})
\`\`\`

---

### 2. Rate Limiting

Implementar límites de requests por IP/usuario:

- **Búsqueda de fotos:** 100 requests/minuto
- **Login:** 5 intentos/minuto
- **Registro:** 3 intentos/minuto
- **Descargas:** 10 descargas/minuto
- **Upload de fotos:** 5 uploads/hora

\`\`\`typescript
// Ejemplo con @nestjs/throttler
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 100
})
\`\`\`

---

### 3. Validación de Archivos

- **Formatos permitidos:** JPG, JPEG, PNG
- **Tamaño máximo:** 10MB por archivo
- **Validación de MIME type:** Verificar headers del archivo
- **Sanitización de nombres:** Remover caracteres especiales
- **Escaneo de malware:** Integrar con ClamAV o similar

\`\`\`typescript
// Ejemplo de validación
const allowedMimeTypes = ['image/jpeg', 'image/png'];
const maxSize = 10 * 1024 * 1024; // 10MB
\`\`\`

---

### 4. Watermarks

- **Aplicar en el backend:** Nunca confiar en el cliente
- **Texto:** "JERPRO" en diagonal
- **Opacidad:** 30-40%
- **Posición:** Centro de la imagen
- **Librería recomendada:** Sharp (Node.js)

\`\`\`typescript
// Ejemplo con Sharp
import sharp from 'sharp';

await sharp(inputBuffer)
  .composite([{
    input: watermarkBuffer,
    gravity: 'center'
  }])
  .toFile(outputPath);
\`\`\`

---

### 5. Tokens de Descarga

- **Generación:** UUID v4 único por foto comprada
- **Expiración:** 24 horas desde la generación
- **Uso único:** Opcional, o limitar a N descargas
- **Almacenamiento:** En tabla `purchase_photos`

\`\`\`typescript
// Ejemplo de generación
import { v4 as uuidv4 } from 'uuid';

const downloadToken = uuidv4();
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
\`\`\`

---

### 6. CORS

Configurar correctamente para el dominio del frontend:

\`\`\`typescript
// Ejemplo en NestJS
app.enableCors({
  origin: [
    'https://jerpro.com',
    'https://www.jerpro.com',
    'http://localhost:3000' // Solo en desarrollo
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
\`\`\`

---

### 7. Validación de Webhook de MercadoPago

**Verificar firma x-signature:**

\`\`\`typescript
import crypto from 'crypto';

function verifyMercadoPagoSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const parts = xSignature.split(',');
  
  const ts = parts[0].replace('ts=', '');
  const hash = parts[1].replace('v1=', '');
  
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');
  
  return hmac === hash;
}
\`\`\`

---

### 8. Protección de Datos Sensibles

- **Passwords:** Hash con bcrypt (salt rounds: 10-12)
- **Tokens:** Almacenar hasheados en BD
- **Datos de pago:** NUNCA almacenar datos de tarjetas
- **Logs:** No loguear información sensible
- **Variables de entorno:** Usar .env y nunca commitear

\`\`\`typescript
// Ejemplo de hash de password
import * as bcrypt from 'bcrypt';

const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
\`\`\`

---

### 9. Validación de Inputs

Usar class-validator y class-transformer en todos los DTOs:

\`\`\`typescript
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(['runner', 'photographer'])
  userType: string;
}
\`\`\`

---

### 10. Logging y Monitoreo

- **Logs estructurados:** Usar Winston o Pino
- **Niveles:** error, warn, info, debug
- **Información a loguear:**
  - Intentos de login fallidos
  - Cambios en permisos
  - Errores de servidor
  - Requests sospechosos
- **Monitoreo:** Integrar con Sentry o similar

\`\`\`typescript
// Ejemplo con Winston
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

WinstonModule.createLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
\`\`\`

---

## 📊 Códigos de Estado HTTP

### Códigos de Éxito (2xx)

- `200 OK` - Request exitoso
- `201 Created` - Recurso creado exitosamente
- `202 Accepted` - Request aceptado para procesamiento
- `204 No Content` - Request exitoso sin contenido de respuesta

### Códigos de Error del Cliente (4xx)

- `400 Bad Request` - Datos inválidos
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No autorizado
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: email duplicado)
- `413 Payload Too Large` - Archivo muy grande
- `422 Unprocessable Entity` - Validación fallida
- `429 Too Many Requests` - Rate limit excedido

### Códigos de Error del Servidor (5xx)

- `500 Internal Server Error` - Error interno
- `502 Bad Gateway` - Error de gateway
- `503 Service Unavailable` - Servicio no disponible

---

## 📧 Notificaciones por Email

### Eventos que requieren email:

1. **Registro de usuario** - Email de bienvenida
2. **Recuperación de contraseña** - Link de reset
3. **Compra exitosa** - Confirmación con links de descarga
4. **Nueva venta (fotógrafo)** - Notificación de venta
5. **Upload completado** - Confirmación de procesamiento

### Proveedor recomendado:

- SendGrid
- AWS SES
- Resend

---

## 🚀 Despliegue y Configuración

### Variables de Entorno Requeridas

\`\`\`env
# Base de datos
NEON_NEON_DATABASE_URL=postgresql://user:password@host:5432/jerpro
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx

# Storage (Supabase Storage o AWS S3)
STORAGE_BUCKET=jerpro-photos
STORAGE_URL=https://xxx.supabase.co/storage/v1

# Email
SENDGRID_API_KEY=xxx
FROM_EMAIL=noreply@jerpro.com

# Frontend URL
FRONTEND_URL=https://jerpro.com

# Otros
NODE_ENV=production
PORT=3000
API_VERSION=v1
\`\`\`

---

## 📝 Notas Adicionales

### Detección de Dorsales con IA

Para la detección automática de números de dorsal, se recomienda:

1. **Google Cloud Vision API** - OCR robusto
2. **AWS Rekognition** - Detección de texto
3. **Tesseract.js** - Solución open source

**Flujo recomendado:**
1. Usuario sube fotos
2. Backend procesa en background (queue con Bull)
3. IA detecta números de dorsal
4. Almacena resultado con nivel de confianza
5. Fotógrafo puede corregir manualmente

---

### Optimización de Imágenes

Generar múltiples versiones de cada foto:

- **Original:** Alta resolución (solo para descargas)
- **Watermark:** Resolución media con marca de agua (para preview)
- **Thumbnail:** 300x300px (para listados)

Usar Sharp para procesamiento eficiente:

\`\`\`typescript
// Thumbnail
await sharp(input)
  .resize(300, 300, { fit: 'cover' })
  .jpeg({ quality: 80 })
  .toFile(thumbnailPath);

// Watermark version
await sharp(input)
  .resize(1200, null, { withoutEnlargement: true })
  .composite([{ input: watermark }])
  .jpeg({ quality: 85 })
  .toFile(watermarkPath);
\`\`\`

---

### Caché

Implementar caché para mejorar performance:

- **Redis:** Para sesiones y datos temporales
- **CDN:** Para servir imágenes (CloudFlare, AWS CloudFront)
- **Cache-Control headers:** Para recursos estáticos

\`\`\`typescript
// Ejemplo de caché con Redis
@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get(key: string): Promise<any> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
\`\`\`

---

## 📞 Soporte

Para preguntas o problemas con la API, contactar a:

- **Email:** dev@jerpro.com
- **Documentación:** https://docs.jerpro.com
- **Status:** https://status.jerpro.com

---

**Versión del documento:** 1.0.0  
**Última actualización:** Enero 2024  
**Autor:** Equipo de Desarrollo JERPRO
