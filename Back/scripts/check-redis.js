/**
 * Script para verificar conexión a Redis
 * Uso: node scripts/check-redis.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Redis = require('ioredis');

async function checkRedis() {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const db = parseInt(process.env.REDIS_DB || '0', 10);

  console.log('🔍 Verificando conexión a Redis...');
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   DB: ${db}`);
  console.log(`   Password: ${password ? '***' : 'No configurado'}\n`);

  const redis = new Redis({
    host,
    port,
    password,
    db,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // No más reintentos
      }
      return Math.min(times * 200, 2000);
    },
    maxRetriesPerRequest: 3,
  });

  try {
    // Intentar conectar
    await redis.ping();
    console.log('✅ Conexión a Redis exitosa');

    // Obtener información del servidor
    const info = await redis.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    if (versionMatch) {
      console.log(`   Versión: ${versionMatch[1]}`);
    }

    // Verificar que Bull Queue puede usar Redis
    console.log('\n📊 Verificando configuración para Bull Queue...');
    
    // Probar operaciones básicas
    await redis.set('test:connection', 'ok', 'EX', 10);
    const testValue = await redis.get('test:connection');
    
    if (testValue === 'ok') {
      console.log('✅ Redis está funcionando correctamente');
      await redis.del('test:connection');
    }

    // Verificar espacio disponible
    const memory = await redis.info('memory');
    const usedMemoryMatch = memory.match(/used_memory_human:([^\r\n]+)/);
    if (usedMemoryMatch) {
      console.log(`   Memoria usada: ${usedMemoryMatch[1]}`);
    }

    console.log('\n✅ Redis está listo para usar con Bull Queue');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error conectando a Redis:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Soluciones:');
      console.log('   1. Verificar que Redis está corriendo:');
      console.log('      - Windows: Descargar Redis desde https://github.com/microsoftarchive/redis/releases');
      console.log('      - Docker: docker run -d -p 6379:6379 redis:latest');
      console.log('   2. Verificar que REDIS_HOST y REDIS_PORT son correctos');
      console.log('   3. Si Redis está en otro servidor, verificar firewall y red');
    } else if (error.message.includes('password')) {
      console.log('💡 Verificar que REDIS_PASSWORD es correcto');
    }

    process.exit(1);
  } finally {
    redis.disconnect();
  }
}

checkRedis();

