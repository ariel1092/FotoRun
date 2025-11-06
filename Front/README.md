# JERPRO - Plataforma de Fotografía Deportiva

Plataforma personalizada de JERPRO para la venta de fotografías deportivas. Los atletas pueden buscar sus fotos por número de dorsal en diferentes disciplinas (Running, Ciclismo, Enduro, MTB, Trail, Triatlón) y el fotógrafo puede gestionar eventos y subir fotos.

## Características

### Para Atletas
- Búsqueda de fotos por disciplina y número de dorsal
- Galería de fotos con vista previa
- Carrito de compras
- Redirección al link de pago de JERPRO
- Descarga de fotos en alta resolución sin marca de agua
- Panel de usuario para gestionar compras

### Para Fotógrafo (JERPRO)
- Panel de administración de eventos
- Subida masiva de fotos
- Gestión de múltiples disciplinas deportivas
- Seguimiento de ventas y ganancias
- Link de pago personalizado de MercadoPago

## Tecnologías

- **Framework**: Next.js 16 con App Router
- **UI**: shadcn/ui + Tailwind CSS v4
- **Estado**: Zustand para carrito de compras
- **Pagos**: Redirección a link de MercadoPago de JERPRO
- **Base de datos**: Neon PostgreSQL
- **Storage**: Vercel Blob (por implementar)
- **IA**: Detección de dorsales (por implementar)

## Instalación

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno (ver `.env.example`)
4. Ejecutar en desarrollo: `npm run dev`

## Variables de Entorno

\`\`\`env
# JERPRO Configuration
NEXT_PUBLIC_JERPRO_PAYMENT_LINK=https://mpago.la/tu-link-de-pago-aqui

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Neon)
NEON_NEON_DATABASE_URL=your_database_url
\`\`\`

## Disciplinas Soportadas

- Running
- Ciclismo
- Enduro
- MTB (Mountain Bike)
- Trail Running
- Triatlón

## Próximos Pasos

1. Integrar autenticación para usuarios y fotógrafo
2. Implementar almacenamiento de fotos con Vercel Blob
3. Integrar IA para detección automática de dorsales
4. Implementar confirmación de pagos
5. Agregar sistema de notificaciones por email
6. Implementar búsqueda avanzada y filtros por evento

## Licencia

MIT
