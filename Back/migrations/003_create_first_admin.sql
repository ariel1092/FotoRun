-- Script para crear el primer usuario admin
-- Ejecutar en Supabase SQL Editor

-- IMPORTANTE: Reemplaza estos valores con los tuyos
-- email: el email que quieres usar para el admin
-- password_hash: hash bcrypt de tu contraseña (ver instrucciones abajo)

-- Opción 1: Crear usuario admin directamente (si ya tienes el hash de la contraseña)
-- Necesitas generar el hash bcrypt primero (ver abajo)
/*
INSERT INTO users (email, password, "firstName", "lastName", role, "isActive")
VALUES (
  'admin@tudominio.com',
  '$2b$10$TU_HASH_BCRYPT_AQUI',  -- Reemplaza con tu hash bcrypt
  'Admin',
  'Usuario',
  'admin',
  true
);
*/

-- Opción 2: Actualizar un usuario existente a admin (más fácil)
-- Primero registra un usuario normal desde Swagger, luego ejecuta esto:
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE email = 'tu-email@ejemplo.com';

-- Para generar el hash bcrypt de tu contraseña, puedes usar:
-- 1. Node.js: require('bcrypt').hashSync('tu-password', 10)
-- 2. Herramienta online: https://bcrypt-generator.com/
-- 3. O usar el script create_admin.js (ver abajo)


