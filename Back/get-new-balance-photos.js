const { Client } = require('pg');

async function getNewBalancePhotos() {
  const client = new Client({
    connectionString: 'postgresql://postgres.fwvcougpqgrksxultizq:Foto-run-Supabase@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, get the New Balance race ID
    const raceQuery = `SELECT id, name FROM races WHERE name ILIKE '%new balance%'`;
    const raceResult = await client.query(raceQuery);

    if (raceResult.rows.length === 0) {
      console.log('No New Balance race found');
      return;
    }

    const race = raceResult.rows[0];
    console.log(`\nFound race: ${race.name} (ID: ${race.id})`);

    // Get all photos for this race
    const photoQuery = `
      SELECT id, "originalName", "cloudinaryPublicId", "createdAt"
      FROM photos
      WHERE "raceId" = $1
      ORDER BY "createdAt" DESC
    `;
    const photoResult = await client.query(photoQuery, [race.id]);

    console.log(`\nFound ${photoResult.rows.length} photos for New Balance:\n`);
    console.log('Photo IDs:');
    photoResult.rows.forEach((photo, index) => {
      console.log(`${index + 1}. ${photo.id} - ${photo.originalName} (cloudinaryPublicId: ${photo.cloudinaryPublicId || 'null'})`);
    });

    console.log('\n\nCopy these IDs to delete them:');
    const ids = photoResult.rows.map(p => p.id);
    console.log(ids.join('\n'));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

getNewBalancePhotos();
