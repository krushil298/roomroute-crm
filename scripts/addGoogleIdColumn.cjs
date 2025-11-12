const { Client } = require('pg');

async function addGoogleIdColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if google_id column already exists
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'google_id'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⏭️  Column google_id already exists, skipping');
      return;
    }

    // Add google_id column
    await client.query(`
      ALTER TABLE users
      ADD COLUMN google_id VARCHAR
    `);
    console.log('✅ Added google_id column to users table');

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
    `);
    console.log('✅ Created index on google_id column');

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the migration
addGoogleIdColumn()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
