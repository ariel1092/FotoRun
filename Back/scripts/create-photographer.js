// Script para crear un usuario con rol de photographer
// Uso: node scripts/create-photographer.js <email> <password> <firstName> [lastName]

const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config();

async function createPhotographer() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Uso: node scripts/create-photographer.js <email> <password> <firstName> [lastName]');
    console.error('Ejemplo: node scripts/create-photographer.js fotografo@jerpro.com Password123 JERPRO');
    process.exit(1);
  }

  const [email, password, firstName, lastName] = args;

  try {
    // Generar hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Conectar a la base de datos
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Verificar si el usuario ya existe
    const existingUser = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  El usuario ya existe. Actualizando rol a photographer...');
      await client.query(
        "UPDATE users SET role = 'photographer' WHERE email = $1",
        [email]
      );
      console.log(`✅ Usuario ${email} actualizado a photographer`);
    } else {
      // Crear nuevo usuario photographer
      await client.query(
        `INSERT INTO users (email, password, "firstName", "lastName", role, "isActive")
         VALUES ($1, $2, $3, $4, 'photographer', true)`,
        [email, passwordHash, firstName, lastName || null]
      );
      console.log(`✅ Usuario photographer creado: ${email}`);
    }

    await client.end();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createPhotographer();

