#!/bin/bash
# Script de post-deploy para Render
# Se ejecuta automáticamente después del build

echo "🚀 Ejecutando post-deploy..."

# Verificar variables de entorno
echo "📋 Verificando variables de entorno..."
node scripts/verify-env.js

# Aplicar migraciones de base de datos
echo "🗄️  Aplicando migraciones de base de datos..."
node scripts/apply-migrations.js

echo "✅ Post-deploy completado"


