const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');

    await client.connect();
    console.log('✅ Connected successfully');

    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful:', result.rows[0]);

  } catch (error) {
    console.error('❌ Connection failed');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
  } finally {
    await client.end();
  }
}

testConnection();
