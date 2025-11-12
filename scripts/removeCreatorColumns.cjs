const { Client } = require('pg');

async function removeCreatorColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Remove created_by and updated_by from contacts
    console.log('\n📝 Removing creator columns from contacts table...');
    await client.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS updated_by`);
    console.log('✅ Removed columns from contacts table');

    // Remove created_by and updated_by from deals
    console.log('\n📝 Removing creator columns from deals table...');
    await client.query(`ALTER TABLE deals DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS updated_by`);
    console.log('✅ Removed columns from deals table');

    // Remove created_by and updated_by from activities
    console.log('\n📝 Removing creator columns from activities table...');
    await client.query(`ALTER TABLE activities DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS updated_by`);
    console.log('✅ Removed columns from activities table');

    console.log('\n✅ All creator columns removed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

removeCreatorColumns()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
