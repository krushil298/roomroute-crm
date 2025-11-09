const { Client } = require('pg');

async function checkJoshAccount() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check Josh's account
    const result = await client.query(`
      SELECT id, email, first_name, last_name, role, password, auth_provider, created_at
      FROM users
      WHERE email = $1
    `, ['josh.gaddis@roomroute.org']);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n✅ Josh\'s account found:');
      console.log('Email:', user.email);
      console.log('Name:', user.first_name, user.last_name);
      console.log('Role:', user.role);
      console.log('Password set:', user.password ? 'Yes' : 'No (NULL)');
      console.log('Auth provider:', user.auth_provider);
      console.log('Created:', user.created_at);
      console.log('\nAccount ID:', user.id);
    } else {
      console.log('❌ No account found for josh.gaddis@roomroute.org');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkJoshAccount();
