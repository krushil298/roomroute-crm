const { Client } = require('pg');

async function checkNeonData() {
  // Neon database (original Replit)
  const neonClient = new Client({
    connectionString: 'postgresql://neondb_owner:npg_41LYUJGkpqtj@ep-fragrant-mountain-aft8s0gr.us-west-2.aws.neon.tech/neondb',
    ssl: { rejectUnauthorized: false }
  });

  // Railway database (current)
  const railwayClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to Neon database (Replit)...');
    await neonClient.connect();
    console.log('✅ Connected to Neon');

    console.log('\nConnecting to Railway database...');
    await railwayClient.connect();
    console.log('✅ Connected to Railway\n');

    // Check data counts in both databases
    console.log('='.repeat(60));
    console.log('DATA COMPARISON: Neon (Replit) vs Railway (Current)');
    console.log('='.repeat(60));

    // Users
    const neonUsers = await neonClient.query('SELECT COUNT(*) FROM users');
    const railwayUsers = await railwayClient.query('SELECT COUNT(*) FROM users');
    console.log(`\nUsers:         Neon: ${neonUsers.rows[0].count}  |  Railway: ${railwayUsers.rows[0].count}`);

    // Organizations
    const neonOrgs = await neonClient.query('SELECT COUNT(*) FROM organizations');
    const railwayOrgs = await railwayClient.query('SELECT COUNT(*) FROM organizations');
    console.log(`Organizations: Neon: ${neonOrgs.rows[0].count}  |  Railway: ${railwayOrgs.rows[0].count}`);

    // Contacts
    const neonContacts = await neonClient.query('SELECT COUNT(*) FROM contacts');
    const railwayContacts = await railwayClient.query('SELECT COUNT(*) FROM contacts');
    console.log(`Contacts:      Neon: ${neonContacts.rows[0].count}  |  Railway: ${railwayContacts.rows[0].count}`);

    // Deals
    const neonDeals = await neonClient.query('SELECT COUNT(*) FROM deals');
    const railwayDeals = await railwayClient.query('SELECT COUNT(*) FROM deals');
    console.log(`Deals:         Neon: ${neonDeals.rows[0].count}  |  Railway: ${railwayDeals.rows[0].count}`);

    // Activities
    const neonActivities = await neonClient.query('SELECT COUNT(*) FROM activities');
    const railwayActivities = await railwayClient.query('SELECT COUNT(*) FROM activities');
    console.log(`Activities:    Neon: ${neonActivities.rows[0].count}  |  Railway: ${railwayActivities.rows[0].count}`);

    console.log('\n' + '='.repeat(60));
    console.log('NEON DATABASE DETAILS:');
    console.log('='.repeat(60));

    // List Neon users
    const neonUsersList = await neonClient.query('SELECT email, first_name, last_name, role FROM users ORDER BY created_at');
    console.log('\nUsers in Neon:');
    neonUsersList.rows.forEach((u, i) => {
      console.log(`  ${i+1}. ${u.email} - ${u.role}`);
    });

    // List Neon organizations
    const neonOrgsList = await neonClient.query('SELECT name, created_at FROM organizations ORDER BY created_at');
    console.log('\nOrganizations in Neon:');
    neonOrgsList.rows.forEach((o, i) => {
      console.log(`  ${i+1}. ${o.name}`);
    });

    console.log('\n' + '='.repeat(60));

    const neonContactSample = await neonClient.query('SELECT name, email FROM contacts LIMIT 5');
    console.log('\nSample Contacts from Neon (first 5):');
    neonContactSample.rows.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.name} - ${c.email || 'no email'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await neonClient.end();
    await railwayClient.end();
  }
}

checkNeonData();
