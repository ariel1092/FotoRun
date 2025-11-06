-- Migración simple: Agregar columna 'name' a la tabla 'users'
-- Ejecutar este script si el anterior no funciona en tu cliente SQL

-- Agregar columna 'name' (si no existe, puede dar error si ya existe, está bien)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Si la columna puede ser NULL, actualizar valores nulos
UPDATE users SET name = COALESCE(email, 'Usuario') WHERE name IS NULL;

-- Hacer la columna NOT NULL (opcional, descomenta si quieres)
-- ALTER TABLE users ALTER COLUMN name SET NOT NULL;


