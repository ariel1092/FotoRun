-- Migración: Agregar columna 'name' a la tabla 'users'
-- Ejecutar este script en tu base de datos PostgreSQL/Supabase

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';
        
        -- Si hay usuarios existentes sin nombre, actualizar con un valor por defecto
        UPDATE users SET name = email WHERE name = '' OR name IS NULL;
    END IF;
END $$;

-- Verificar que la columna se creó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'name';


