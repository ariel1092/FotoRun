// Script para crear el primer usuario admin
// Uso: node scripts/create-admin.js <email> <password> <firstName>

const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config();

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Uso: node scripts/create-admin.js <email> <password> <firstName> [lastName]');
    console.error('Ejemplo: node scripts/create-admin.js admin@ejemplo.com Password123 Admin Usuario');
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
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  El usuario ya existe. Actualizando rol a admin...');
      await client.query(
        "UPDATE users SET role = 'admin' WHERE email = $1",
        [email]
      );
      console.log(`✅ Usuario ${email} actualizado a admin`);
    } else {
      // Crear nuevo usuario admin
      await client.query(
        `INSERT INTO users (email, password, "firstName", "lastName", role, "isActive")
         VALUES ($1, $2, $3, $4, 'admin', true)`,
        [email, passwordHash, firstName, lastName || null]
      );
      console.log(`✅ Usuario admin creado: ${email}`);
    }

    await client.end();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();


