/**
 * Script para verificar Supabase Storage
 * Uso: node scripts/check-supabase-storage.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

async function checkSupabaseStorage() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados');
    process.exit(1);
  }

  console.log('🔍 Verificando Supabase Storage...');
  console.log(`   URL: ${supabaseUrl}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Listar buckets
    console.log('📦 Verificando buckets disponibles...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error al listar buckets:', bucketsError.message);
      
      if (bucketsError.message.includes('JWT')) {
        console.log('\n💡 Solución: Verifica que SUPABASE_ANON_KEY es correcta');
      } else if (bucketsError.message.includes('permission')) {
        console.log('\n💡 Solución: Verifica las políticas de acceso en Supabase');
      }
      
      process.exit(1);
    }

    console.log(`   Buckets encontrados: ${buckets.length}`);
    buckets.forEach(bucket => {
      console.log(`   • ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });

    // Verificar bucket 'race-images' (el que usa el código)
    const bucketName = 'race-images';
    const bucketExists = buckets.some(b => b.name === bucketName);

    if (bucketExists) {
      console.log(`\n✅ Bucket '${bucketName}' existe`);
      
      // Intentar listar archivos (para verificar permisos)
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('photos', { limit: 1 });

      if (listError) {
        console.log(`   ⚠️  Advertencia: No se pueden listar archivos: ${listError.message}`);
        console.log('   (Esto puede ser normal si el bucket está vacío o tiene políticas restrictivas)');
      } else {
        console.log(`   ✅ Permisos de lectura funcionan correctamente`);
      }
    } else {
      console.log(`\n❌ Bucket '${bucketName}' NO existe`);
      console.log('\n💡 Necesitas crear el bucket:');
      console.log('   1. Ve a tu proyecto en Supabase Dashboard');
      console.log('   2. Storage → Buckets → New bucket');
      console.log('   3. Nombre: race-images');
      console.log('   4. Public: Sí (para que las fotos sean accesibles)');
      console.log('   5. Crea el bucket');
      process.exit(1);
    }

    // Verificar bucket 'photos' (alternativo mencionado en docs)
    const photosBucket = 'photos';
    const photosBucketExists = buckets.some(b => b.name === photosBucket);
    
    if (photosBucketExists) {
      console.log(`\n✅ Bucket '${photosBucket}' también existe`);
    } else {
      console.log(`\nℹ️  Bucket '${photosBucket}' no existe (no es necesario si usas 'race-images')`);
    }

    console.log('\n✅ Supabase Storage está configurado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error verificando Supabase Storage:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

checkSupabaseStorage();

