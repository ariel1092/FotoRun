# 📝 Guía para Aplicar Migraciones Manualmente

Si prefieres aplicar las migraciones manualmente, sigue estos pasos:

## Opción 1: Usando psql (Línea de comandos)

```bash
# Conectar a tu base de datos
psql "tu_database_url_completa"

# O si tienes las credenciales separadas:
psql -h tu_host -U tu_usuario -d tu_base_de_datos

# Luego ejecutar cada migración:
\i migrations/004_add_thumbnail_url_to_photos.sql
\i migrations/005_add_processing_status_to_photos.sql
```

## Opción 2: Usando un cliente gráfico (pgAdmin, DBeaver, etc.)

1. Conectarte a tu base de datos
2. Abrir el archivo `Back/migrations/004_add_thumbnail_url_to_photos.sql`
3. Copiar y ejecutar el contenido SQL
4. Repetir con `005_add_processing_status_to_photos.sql`

## Opción 3: Usando el script automatizado

```bash
cd Back
node scripts/apply-migrations.js
```

## Verificar que funcionó

Ejecuta esta consulta SQL:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('thumbnailUrl', 'processingStatus', 'processingError')
ORDER BY column_name;
```

Deberías ver 3 filas:
- `processingError`
- `processingStatus`
- `thumbnailUrl`

