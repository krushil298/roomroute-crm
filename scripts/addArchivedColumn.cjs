const { Client } = require('pg');

async function addArchivedColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if archived column already exists
    console.log('\n📝 Checking if archived column exists in contacts table...');
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contacts' AND column_name = 'archived'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⏭️  archived column already exists in contacts table');
    } else {
      console.log('\n📝 Adding archived column to contacts table...');
      await client.query(`
        ALTER TABLE contacts
        ADD COLUMN archived BOOLEAN DEFAULT false NOT NULL
      `);
      console.log('✅ Added archived column to contacts table');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

addArchivedColumn()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
