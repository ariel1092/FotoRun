-- Migración: Ajustar enum de roles en la tabla 'users'
-- El esquema de Supabase tiene un enum 'users_role_enum' con valor por defecto 'participant'
-- Necesitamos agregar los valores 'user', 'photographer', 'admin' o cambiar a VARCHAR

-- Opción 1: Si el enum existe, agregar los nuevos valores
DO $$
BEGIN
    -- Intentar agregar los valores al enum si no existen
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
        -- Agregar nuevos valores al enum (si no existen)
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')) THEN
            ALTER TYPE users_role_enum ADD VALUE 'user';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'photographer' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')) THEN
            ALTER TYPE users_role_enum ADD VALUE 'photographer';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')) THEN
            ALTER TYPE users_role_enum ADD VALUE 'admin';
        END IF;
    END IF;
END $$;

-- Opción 2: Si prefieres cambiar a VARCHAR (descomenta si la opción 1 no funciona)
-- ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20) USING role::text;
-- ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Verificar los valores del enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')
ORDER BY enumsortorder;


