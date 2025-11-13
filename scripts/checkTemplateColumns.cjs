const { Client } = require('pg');

async function checkColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check contract_templates columns
    console.log('📋 contract_templates columns:');
    const contractCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contract_templates'
      ORDER BY ordinal_position
    `);
    contractCols.rows.forEach(row => console.log(`  - ${row.column_name} (${row.data_type})`));

    // Check email_templates columns
    console.log('\n📋 email_templates columns:');
    const emailCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'email_templates'
      ORDER BY ordinal_position
    `);
    emailCols.rows.forEach(row => console.log(`  - ${row.column_name} (${row.data_type})`));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkColumns();
