const { Client } = require('pg');

async function migrateData() {
  // Neon database (original Replit)
  const neonClient = new Client({
    connectionString: 'postgresql://neondb_owner:npg_41LYUJGkpqtj@ep-fragrant-mountain-aft8s0gr.us-west-2.aws.neon.tech/neondb?sslmode=require',
  });

  // Railway database (current)
  const railwayClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔗 Connecting to Neon database (Replit)...');
    await neonClient.connect();
    console.log('✅ Connected to Neon\n');

    console.log('🔗 Connecting to Railway database...');
    await railwayClient.connect();
    console.log('✅ Connected to Railway\n');

    // Step 1: Check what data exists in Neon
    console.log('='.repeat(60));
    console.log('STEP 1: Analyzing Neon Database (Replit Production Data)');
    console.log('='.repeat(60));

    const neonUsers = await neonClient.query('SELECT COUNT(*) FROM users');
    const neonOrgs = await neonClient.query('SELECT COUNT(*) FROM organizations');
    const neonContacts = await neonClient.query('SELECT COUNT(*) FROM contacts');
    const neonDeals = await neonClient.query('SELECT COUNT(*) FROM deals');
    const neonActivities = await neonClient.query('SELECT COUNT(*) FROM activities');
    const neonTemplates = await neonClient.query('SELECT COUNT(*) FROM contract_templates');
    const neonEmailTemplates = await neonClient.query('SELECT COUNT(*) FROM email_templates');

    console.log(`\nNeon Database Contents:`);
    console.log(`  Users:             ${neonUsers.rows[0].count}`);
    console.log(`  Organizations:     ${neonOrgs.rows[0].count}`);
    console.log(`  Contacts:          ${neonContacts.rows[0].count}`);
    console.log(`  Deals:             ${neonDeals.rows[0].count}`);
    console.log(`  Activities:        ${neonActivities.rows[0].count}`);
    console.log(`  Contract Templates: ${neonTemplates.rows[0].count}`);
    console.log(`  Email Templates:   ${neonEmailTemplates.rows[0].count}`);

    // List organizations
    const neonOrgsList = await neonClient.query('SELECT id, name FROM organizations ORDER BY created_at');
    console.log('\nOrganizations in Neon:');
    neonOrgsList.rows.forEach((o, i) => {
      console.log(`  ${i+1}. ${o.name} (ID: ${o.id})`);
    });

    // List users
    const neonUsersList = await neonClient.query('SELECT id, email, role FROM users ORDER BY created_at');
    console.log('\nUsers in Neon:');
    neonUsersList.rows.forEach((u, i) => {
      console.log(`  ${i+1}. ${u.email} - ${u.role}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Current Railway Database');
    console.log('='.repeat(60));

    const railwayUsers = await railwayClient.query('SELECT COUNT(*) FROM users');
    const railwayOrgs = await railwayClient.query('SELECT COUNT(*) FROM organizations');
    const railwayContacts = await railwayClient.query('SELECT COUNT(*) FROM contacts');

    console.log(`\nRailway Database Contents (before migration):`);
    console.log(`  Users:         ${railwayUsers.rows[0].count}`);
    console.log(`  Organizations: ${railwayOrgs.rows[0].count}`);
    console.log(`  Contacts:      ${railwayContacts.rows[0].count}`);

    console.log('\n⚠️  WARNING: Railway database will be cleared and replaced with Neon data');
    console.log('\nPress Ctrl+C now to cancel, or the script will continue in 5 seconds...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Starting Migration');
    console.log('='.repeat(60));

    // Clear Railway database (except sessions table)
    console.log('\n🗑️  Clearing Railway database...');
    await railwayClient.query('TRUNCATE activities, deals, contacts, contract_templates, email_templates, user_organizations, user_invitations, users, organizations CASCADE');
    console.log('✅ Railway database cleared');

    // Migrate in order due to foreign key constraints
    console.log('\n📦 Migrating data...\n');

    // 1. Organizations
    console.log('1️⃣  Migrating organizations...');
    const orgs = await neonClient.query('SELECT * FROM organizations');
    for (const org of orgs.rows) {
      await railwayClient.query(`
        INSERT INTO organizations (id, name, legal_name, brand_name, active, number_of_rooms, address, city, state, zip_code, country, contact_name, contact_phone, contact_email, has_meeting_rooms, meeting_room_capacity, meeting_room_details, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [org.id, org.name, org.legal_name, org.brand_name, org.active, org.number_of_rooms, org.address, org.city, org.state, org.zip_code, org.country, org.contact_name, org.contact_phone, org.contact_email, org.has_meeting_rooms, org.meeting_room_capacity, org.meeting_room_details, org.created_at, org.updated_at]);
    }
    console.log(`   ✅ Migrated ${orgs.rows.length} organizations`);

    // 2. Users
    console.log('2️⃣  Migrating users...');
    const users = await neonClient.query('SELECT * FROM users');
    for (const user of users.rows) {
      await railwayClient.query(`
        INSERT INTO users (id, email, password, first_name, last_name, birthday, profile_image_url, organization_id, role, current_organization_id, auth_provider, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [user.id, user.email, user.password, user.first_name, user.last_name, user.birthday, user.profile_image_url, user.organization_id, user.role, user.current_organization_id, user.auth_provider, user.created_at, user.updated_at]);
    }
    console.log(`   ✅ Migrated ${users.rows.length} users`);

    // 3. User Organizations
    console.log('3️⃣  Migrating user-organization relationships...');
    const userOrgs = await neonClient.query('SELECT * FROM user_organizations');
    for (const userOrg of userOrgs.rows) {
      await railwayClient.query(`
        INSERT INTO user_organizations (id, user_id, organization_id, role, active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userOrg.id, userOrg.user_id, userOrg.organization_id, userOrg.role, userOrg.active, userOrg.created_at]);
    }
    console.log(`   ✅ Migrated ${userOrgs.rows.length} user-organization relationships`);

    // 4. User Invitations
    console.log('4️⃣  Migrating user invitations...');
    const invitations = await neonClient.query('SELECT * FROM user_invitations');
    for (const inv of invitations.rows) {
      await railwayClient.query(`
        INSERT INTO user_invitations (id, email, organization_id, role, invited_by, status, sent_at, accepted_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [inv.id, inv.email, inv.organization_id, inv.role, inv.invited_by, inv.status, inv.sent_at, inv.accepted_at, inv.created_at]);
    }
    console.log(`   ✅ Migrated ${invitations.rows.length} invitations`);

    // 5. Contacts
    console.log('5️⃣  Migrating contacts...');
    const contacts = await neonClient.query('SELECT * FROM contacts');
    for (const contact of contacts.rows) {
      await railwayClient.query(`
        INSERT INTO contacts (id, organization_id, lead_or_project, company, company_address, company_city, company_state, company_zip_code, segment, primary_contact, phone, email, est_room_nights, potential_value, avatar_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [contact.id, contact.organization_id, contact.lead_or_project, contact.company, contact.company_address, contact.company_city, contact.company_state, contact.company_zip_code, contact.segment, contact.primary_contact, contact.phone, contact.email, contact.est_room_nights, contact.potential_value, contact.avatar_url, contact.created_at]);
    }
    console.log(`   ✅ Migrated ${contacts.rows.length} contacts`);

    // 6. Deals
    console.log('6️⃣  Migrating deals...');
    const deals = await neonClient.query('SELECT * FROM deals');
    for (const deal of deals.rows) {
      await railwayClient.query(`
        INSERT INTO deals (id, organization_id, contact_id, title, value, stage, probability, expected_close_date, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [deal.id, deal.organization_id, deal.contact_id, deal.title, deal.value, deal.stage, deal.probability, deal.expected_close_date, deal.notes, deal.created_at, deal.updated_at]);
    }
    console.log(`   ✅ Migrated ${deals.rows.length} deals`);

    // 7. Activities
    console.log('7️⃣  Migrating activities...');
    const activities = await neonClient.query('SELECT * FROM activities');
    for (const activity of activities.rows) {
      await railwayClient.query(`
        INSERT INTO activities (id, organization_id, contact_id, deal_id, type, description, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [activity.id, activity.organization_id, activity.contact_id, activity.deal_id, activity.type, activity.description, activity.created_at]);
    }
    console.log(`   ✅ Migrated ${activities.rows.length} activities`);

    // 8. Contract Templates
    console.log('8️⃣  Migrating contract templates...');
    const templates = await neonClient.query('SELECT * FROM contract_templates');
    for (const template of templates.rows) {
      await railwayClient.query(`
        INSERT INTO contract_templates (id, organization_id, name, type, content, variables, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [template.id, template.organization_id, template.name, template.type, template.content, template.variables, template.created_at, template.updated_at]);
    }
    console.log(`   ✅ Migrated ${templates.rows.length} contract templates`);

    // 9. Email Templates
    console.log('9️⃣  Migrating email templates...');
    const emailTemplates = await neonClient.query('SELECT * FROM email_templates');
    for (const template of emailTemplates.rows) {
      await railwayClient.query(`
        INSERT INTO email_templates (id, organization_id, name, subject, body, variables, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [template.id, template.organization_id, template.name, template.subject, template.body, template.variables, template.created_at, template.updated_at]);
    }
    console.log(`   ✅ Migrated ${emailTemplates.rows.length} email templates`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));

    // Verify
    const finalCounts = {
      users: await railwayClient.query('SELECT COUNT(*) FROM users'),
      orgs: await railwayClient.query('SELECT COUNT(*) FROM organizations'),
      contacts: await railwayClient.query('SELECT COUNT(*) FROM contacts'),
      deals: await railwayClient.query('SELECT COUNT(*) FROM deals'),
      activities: await railwayClient.query('SELECT COUNT(*) FROM activities'),
    };

    console.log('\n📊 Final Railway Database:');
    console.log(`  Users:         ${finalCounts.users.rows[0].count}`);
    console.log(`  Organizations: ${finalCounts.orgs.rows[0].count}`);
    console.log(`  Contacts:      ${finalCounts.contacts.rows[0].count}`);
    console.log(`  Deals:         ${finalCounts.deals.rows[0].count}`);
    console.log(`  Activities:    ${finalCounts.activities.rows[0].count}`);

  } catch (error) {
    console.error('\n❌ Migration Error:', error.message);
    console.error(error);
  } finally {
    await neonClient.end();
    await railwayClient.end();
  }
}

migrateData();
