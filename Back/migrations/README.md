# Migraciones de Base de Datos

Este directorio contiene scripts SQL para actualizar el esquema de la base de datos.

## Ejecutar Migraciones

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo de migración
4. Ejecuta el script

### Opción 2: Desde línea de comandos (psql)

```bash
psql "TU_DATABASE_URL" -f migrations/001_add_name_to_users.sql
```

### Opción 3: Desde tu cliente PostgreSQL favorito

Abre el archivo `.sql` y ejecútalo en tu cliente (pgAdmin, DBeaver, etc.)

## Migraciones Disponibles

### `001_add_name_to_users.sql` / `001_add_name_to_users_simple.sql`
**NOTA:** Esta migración NO es necesaria si tu esquema de Supabase ya tiene `firstName` y `lastName`.

El código ahora está sincronizado con el esquema de Supabase que usa `firstName` y `lastName` en lugar de `name`.

**¿Cuándo ejecutarla?**
- Solo si tu tabla `users` no tiene ni `name` ni `firstName`/`lastName`
- Si tienes `firstName` y `lastName` en Supabase, NO necesitas ejecutar esta migración

### `002_fix_users_role_enum.sql`
Ajusta el enum de roles en la tabla `users` para incluir los valores `'user'`, `'photographer'`, `'admin'`.

**¿Cuándo ejecutarla?**
- Si tu tabla `users` tiene un enum `users_role_enum` con valores diferentes a `'user'`, `'photographer'`, `'admin'`
- Si recibes errores relacionados con valores de roles inválidos

**Nota:** Si prefieres usar VARCHAR en lugar de enum, descomenta la opción 2 en el script.

### `003_create_first_admin.sql`
Script de referencia para crear el primer usuario admin. **No ejecutar directamente** - usar el script Node.js o SQL manual.

**Mejor opción:** Usar el script `Back/scripts/create-admin.js` (ver `Back/scripts/README.md`)

## Notas

- Las migraciones son **idempotentes**: puedes ejecutarlas múltiples veces sin problemas
- Verifica que la columna se creó correctamente después de ejecutar la migración

