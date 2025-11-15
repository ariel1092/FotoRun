-- Migración: Agregar columna createdBy a la tabla races
-- Esta columna almacena el ID del usuario que creó el evento

-- Agregar columna createdBy (nullable para eventos existentes)
ALTER TABLE races 
ADD COLUMN IF NOT EXISTS "createdBy" UUID;

-- Crear índice para mejorar las consultas por fotógrafo
CREATE INDEX IF NOT EXISTS idx_races_created_by ON races("createdBy");

-- Comentario en la columna
COMMENT ON COLUMN races."createdBy" IS 'ID del usuario (fotógrafo) que creó el evento';

