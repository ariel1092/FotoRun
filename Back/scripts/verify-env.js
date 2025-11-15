/**
 * Script para verificar variables de entorno
 * Uso: node scripts/verify-env.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const requiredVars = {
  // Base de datos
  DATABASE_URL: 'Conexión a PostgreSQL (Supabase)',
  
  // JWT
  JWT_SECRET: 'Secreto para firmar tokens JWT',
  
  // Supabase Storage
  SUPABASE_URL: 'URL de tu proyecto Supabase',
  SUPABASE_ANON_KEY: 'Clave anónima de Supabase (para Storage)',
  
  // Roboflow
  ROBOFLOW_API_KEY: 'API Key de Roboflow',
  ROBOFLOW_URL: 'URL del modelo de Roboflow',
};

const optionalVars = {
  PORT: 'Puerto del servidor (default: 8004)',
  NODE_ENV: 'Entorno (development/production)',
  CORS_ORIGIN: 'Orígenes permitidos para CORS',
  THROTTLE_TTL: 'TTL para rate limiting (default: 60)',
  THROTTLE_LIMIT: 'Límite de requests (default: 100)',
  REDIS_HOST: 'Host de Redis (default: localhost)',
  REDIS_PORT: 'Puerto de Redis (default: 6379)',
  REDIS_PASSWORD: 'Password de Redis (opcional)',
  REDIS_DB: 'Base de datos de Redis (default: 0)',
};

console.log('🔍 Verificando variables de entorno...\n');

let allOk = true;
const missing = [];
const present = [];
const warnings = [];

// Verificar variables requeridas
console.log('📋 Variables Requeridas:');
for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`  ❌ ${varName}: FALTANTE - ${description}`);
    missing.push(varName);
    allOk = false;
  } else {
    // Ocultar valores sensibles
    const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')
      ? '***' + value.slice(-4)
      : value.length > 50
      ? value.substring(0, 50) + '...'
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
    present.push(varName);
    
    // Advertencias específicas
    if (varName === 'JWT_SECRET' && value.length < 32) {
      warnings.push(`${varName} debería tener al menos 32 caracteres para mayor seguridad`);
    }
  }
}

// Verificar variables opcionales
console.log('\n📋 Variables Opcionales:');
for (const [varName, description] of Object.entries(optionalVars)) {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')
      ? '***' + value.slice(-4)
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ⚪ ${varName}: No configurada (${description})`);
  }
}

// Verificar configuración específica
console.log('\n🔧 Verificaciones Específicas:');

// Verificar DATABASE_URL
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
    console.log('  ✅ DATABASE_URL tiene formato correcto (PostgreSQL)');
  } else {
    warnings.push('DATABASE_URL no parece ser una URL de PostgreSQL válida');
  }
}

// Verificar SUPABASE_URL
if (process.env.SUPABASE_URL) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl.includes('supabase.co')) {
    console.log('  ✅ SUPABASE_URL parece ser una URL de Supabase válida');
  } else {
    warnings.push('SUPABASE_URL no parece ser una URL de Supabase válida');
  }
}

// Verificar Redis
if (!process.env.REDIS_HOST) {
  console.log('  ⚠️  REDIS_HOST no configurado (usará localhost por defecto)');
  warnings.push('Redis no está configurado. El procesamiento asíncrono no funcionará sin Redis');
}

// Verificar Roboflow
if (process.env.ROBOFLOW_URL) {
  const roboflowUrl = process.env.ROBOFLOW_URL;
  if (roboflowUrl.includes('roboflow.com') || roboflowUrl.includes('infer.roboflow.com')) {
    console.log('  ✅ ROBOFLOW_URL parece ser una URL de Roboflow válida');
  } else {
    warnings.push('ROBOFLOW_URL no parece ser una URL de Roboflow válida');
  }
}

// Mostrar advertencias
if (warnings.length > 0) {
  console.log('\n⚠️  Advertencias:');
  warnings.forEach(warning => {
    console.log(`  • ${warning}`);
  });
}

// Resumen
console.log('\n📊 Resumen:');
console.log(`  ✅ Variables presentes: ${present.length}/${Object.keys(requiredVars).length}`);
console.log(`  ❌ Variables faltantes: ${missing.length}`);

if (allOk) {
  console.log('\n✅ Todas las variables requeridas están configuradas');
  process.exit(0);
} else {
  console.log('\n❌ Faltan variables requeridas. Por favor, configura las siguientes:');
  missing.forEach(varName => {
    console.log(`  • ${varName}: ${requiredVars[varName]}`);
  });
  process.exit(1);
}

