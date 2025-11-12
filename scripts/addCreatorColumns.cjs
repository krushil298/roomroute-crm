const { Client } = require('pg');

async function addCreatorColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Add created_by and updated_by columns to contacts table
    console.log('\n📝 Adding creator columns to contacts table...');

    const checkContactsColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contacts' AND column_name IN ('created_by', 'updated_by')
    `);

    if (checkContactsColumns.rows.length === 0) {
      await client.query(`
        ALTER TABLE contacts
        ADD COLUMN created_by VARCHAR REFERENCES users(id),
        ADD COLUMN updated_by VARCHAR REFERENCES users(id)
      `);
      console.log('✅ Added created_by and updated_by to contacts table');
    } else {
      console.log('⏭️  Columns already exist in contacts table');
    }

    // Add created_by and updated_by columns to deals table
    console.log('\n📝 Adding creator columns to deals table...');

    const checkDealsColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'deals' AND column_name IN ('created_by', 'updated_by')
    `);

    if (checkDealsColumns.rows.length === 0) {
      await client.query(`
        ALTER TABLE deals
        ADD COLUMN created_by VARCHAR REFERENCES users(id),
        ADD COLUMN updated_by VARCHAR REFERENCES users(id)
      `);
      console.log('✅ Added created_by and updated_by to deals table');
    } else {
      console.log('⏭️  Columns already exist in deals table');
    }

    // Add created_by column to activities table
    console.log('\n📝 Adding creator column to activities table...');

    const checkActivitiesColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'activities' AND column_name = 'created_by'
    `);

    if (checkActivitiesColumns.rows.length === 0) {
      await client.query(`
        ALTER TABLE activities
        ADD COLUMN created_by VARCHAR REFERENCES users(id)
      `);
      console.log('✅ Added created_by to activities table');
    } else {
      console.log('⏭️  Column already exists in activities table');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

addCreatorColumns()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
