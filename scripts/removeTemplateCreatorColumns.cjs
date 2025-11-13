const { Client } = require('pg');

async function removeCreatorColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Remove created_by and updated_by from contract_templates
    console.log('\n📝 Removing creator columns from contract_templates table...');
    await client.query(`ALTER TABLE contract_templates DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS updated_by`);
    console.log('✅ Removed columns from contract_templates table');

    // Remove created_by and updated_by from email_templates
    console.log('\n📝 Removing creator columns from email_templates table...');
    await client.query(`ALTER TABLE email_templates DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS updated_by`);
    console.log('✅ Removed columns from email_templates table');

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
