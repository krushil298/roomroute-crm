const { Client } = require('pg');

async function addCompanyWebsiteColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if company_website column already exists
    console.log('\n📝 Checking if company_website column exists in contacts table...');
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contacts' AND column_name = 'company_website'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⏭️  company_website column already exists in contacts table');
    } else {
      console.log('\n📝 Adding company_website column to contacts table...');
      await client.query(`
        ALTER TABLE contacts
        ADD COLUMN company_website TEXT
      `);
      console.log('✅ Added company_website column to contacts table');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

addCompanyWebsiteColumn()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
