const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createJoshSuperAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if Josh's account already exists
    const checkResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['josh.gaddis@roomroute.org']
    );

    if (checkResult.rows.length > 0) {
      console.log('⚠️  Account already exists for josh.gaddis@roomroute.org');
      console.log('Updating to super_admin role and setting new password...');

      // Hash the temporary password
      const tempPassword = 'RoomRoute2025!';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await client.query(`
        UPDATE users
        SET password = $1,
            role = 'super_admin',
            auth_provider = 'email'
        WHERE email = $2
      `, [hashedPassword, 'josh.gaddis@roomroute.org']);

      console.log('✅ Account updated successfully!');
    } else {
      console.log('Creating new super admin account for Josh...');

      // Hash the temporary password
      const tempPassword = 'RoomRoute2025!';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create Josh's account
      const result = await client.query(`
        INSERT INTO users (email, first_name, last_name, password, role, auth_provider)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, role
      `, ['josh.gaddis@roomroute.org', 'Josh', 'Gaddis', hashedPassword, 'super_admin', 'email']);

      console.log('✅ Super admin account created successfully!');
      console.log('User ID:', result.rows[0].id);
    }

    console.log('\n📧 Login Credentials for Josh:');
    console.log('Email: josh.gaddis@roomroute.org');
    console.log('Password: RoomRoute2025!');
    console.log('\n⚠️  IMPORTANT: Josh should change this password after first login!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createJoshSuperAdmin();
