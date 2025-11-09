const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function testSignup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Hash password
    const hashedPassword = await bcrypt.hash('Test12345678', 10);
    console.log('Password hashed');

    // Try to insert a test user
    const result = await client.query(`
      INSERT INTO users (email, first_name, last_name, password, auth_provider, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role, auth_provider, created_at;
    `, ['test@example.com', 'Test', 'User', hashedPassword, 'email', 'user']);

    console.log('✅ User created successfully:', result.rows[0]);

    // Now try to delete it
    await client.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Detail:', error.detail);
    console.error('Code:', error.code);
  } finally {
    await client.end();
  }
}

testSignup();
