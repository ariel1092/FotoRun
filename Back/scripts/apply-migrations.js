/**
 * Script para aplicar migraciones de base de datos
 * Uso: node scripts/apply-migrations.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function applyMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL no está definida en el archivo .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false, // Necesario para Supabase
    },
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conexión exitosa');

    // Lista de migraciones a aplicar
    const migrations = [
      {
        name: '004_add_thumbnail_url_to_photos',
        file: path.join(__dirname, '..', 'migrations', '004_add_thumbnail_url_to_photos.sql'),
      },
      {
        name: '005_add_processing_status_to_photos',
        file: path.join(__dirname, '..', 'migrations', '005_add_processing_status_to_photos.sql'),
      },
    ];

    // Verificar columnas existentes antes de aplicar
    console.log('\n📊 Verificando estado actual de la tabla photos...');
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'photos' 
      AND column_name IN ('thumbnailUrl', 'processingStatus', 'processingError')
      ORDER BY column_name;
    `;
    const existingColumns = await client.query(checkQuery);
    
    if (existingColumns.rows.length > 0) {
      console.log('⚠️  Columnas existentes:');
      existingColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name}`);
      });
    } else {
      console.log('ℹ️  No se encontraron las columnas nuevas');
    }

    // Aplicar cada migración
    for (const migration of migrations) {
      console.log(`\n📝 Aplicando migración: ${migration.name}...`);
      
      if (!fs.existsSync(migration.file)) {
        console.error(`❌ Error: No se encontró el archivo ${migration.file}`);
        continue;
      }

      const sql = fs.readFileSync(migration.file, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Migración ${migration.name} aplicada exitosamente`);
      } catch (error) {
        // Si la columna ya existe, no es un error crítico
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  ${migration.name}: ${error.message.split('\n')[0]}`);
          console.log('   (La migración ya fue aplicada anteriormente)');
        } else {
          throw error;
        }
      }
    }

    // Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const finalCheck = await client.query(checkQuery);
    
    if (finalCheck.rows.length === 3) {
      console.log('✅ Todas las columnas fueron creadas exitosamente:');
      finalCheck.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name}`);
      });
    } else {
      console.log('⚠️  Algunas columnas pueden no haberse creado:');
      finalCheck.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name}`);
      });
      const expected = ['thumbnailUrl', 'processingStatus', 'processingError'];
      const missing = expected.filter(col => 
        !finalCheck.rows.some(row => row.column_name === col)
      );
      if (missing.length > 0) {
        console.log('❌ Columnas faltantes:', missing.join(', '));
      }
    }

    console.log('\n✅ Proceso de migración completado');
  } catch (error) {
    console.error('\n❌ Error al aplicar migraciones:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar
applyMigrations();

