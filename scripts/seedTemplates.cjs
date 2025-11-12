const { Client } = require('pg');

// Template data - UPDATE THESE WITH ACTUAL CONTENT FROM CLIENT
const contractTemplates = [
  {
    name: "LNR Contact Agreement",
    type: "standard",
    content: `
[LNR CONTACT AGREEMENT TEMPLATE]

This agreement is made between [HOTEL_NAME] and [CONTACT_NAME].

TERMS AND CONDITIONS:
1. Room Nights: [ROOM_NIGHTS]
2. Rate: [RATE]
3. Duration: [START_DATE] to [END_DATE]

ADDITIONAL TERMS:
[ADDITIONAL_TERMS]

Signatures:
_______________________
Hotel Representative

_______________________
Contact Representative

Date: __________________
    `.trim(),
    description: "Standard LNR contact agreement template"
  },
  {
    name: "Group Contract",
    type: "group",
    content: `
[GROUP CONTRACT TEMPLATE]

GROUP BOOKING AGREEMENT

Hotel: [HOTEL_NAME]
Group Name: [GROUP_NAME]
Event Date: [EVENT_DATE]

ROOM BLOCK:
- Number of Rooms: [ROOM_COUNT]
- Check-in: [CHECKIN_DATE]
- Check-out: [CHECKOUT_DATE]
- Group Rate: $[RATE] per night

MEETING SPACE:
[MEETING_SPACE_DETAILS]

FOOD & BEVERAGE:
[FB_DETAILS]

PAYMENT TERMS:
- Deposit: [DEPOSIT_AMOUNT] due [DEPOSIT_DATE]
- Final Payment: [FINAL_PAYMENT_DATE]

CANCELLATION POLICY:
[CANCELLATION_POLICY]

Agreed and Accepted:

_______________________
Hotel Representative

_______________________
Group Representative

Date: __________________
    `.trim(),
    description: "Group booking contract template for events and conferences"
  }
];

const emailTemplates = [
  {
    name: "Initial Contact Email",
    subject: "Partnership Opportunity with [HOTEL_NAME]",
    body: `
Hi [CONTACT_NAME],

I hope this email finds you well. My name is [YOUR_NAME] and I'm reaching out from [HOTEL_NAME].

We specialize in providing exceptional accommodations for [SEGMENT] clients, and I believe we could be a great fit for your upcoming needs.

WHAT WE OFFER:
- [AMENITY_1]
- [AMENITY_2]
- [AMENITY_3]

I'd love to schedule a brief call to discuss how we can support your lodging requirements.

Are you available for a 15-minute call this week?

Best regards,
[YOUR_NAME]
[YOUR_TITLE]
[HOTEL_NAME]
[PHONE]
[EMAIL]
    `.trim(),
    description: "Initial outreach email to new contacts"
  },
  {
    name: "Follow-Up Email",
    subject: "Following Up: [HOTEL_NAME] Partnership",
    body: `
Hi [CONTACT_NAME],

I wanted to follow up on my previous email regarding a potential partnership with [HOTEL_NAME].

I understand you're busy, but I'd really appreciate a few minutes of your time to discuss how we can support your lodging needs.

QUICK RECAP:
- Competitive rates for [SEGMENT] clients
- Flexible booking terms
- Dedicated account management

Would [DATE_OPTION_1] or [DATE_OPTION_2] work for a quick call?

Looking forward to hearing from you.

Best regards,
[YOUR_NAME]
[YOUR_TITLE]
[HOTEL_NAME]
    `.trim(),
    description: "Follow-up email for unresponsive leads"
  },
  {
    name: "Proposal Email",
    subject: "Proposal: Room Block for [CONTACT_NAME]",
    body: `
Hi [CONTACT_NAME],

Thank you for your interest in [HOTEL_NAME]. Based on our conversation, I've prepared a proposal for your review.

PROPOSAL SUMMARY:
- Room Nights: [ROOM_NIGHTS]
- Rate: $[RATE] per night
- Dates: [START_DATE] to [END_DATE]
- Estimated Value: $[TOTAL_VALUE]

INCLUDED AMENITIES:
- [AMENITY_1]
- [AMENITY_2]
- [AMENITY_3]

I've attached a detailed proposal for your review. Please let me know if you have any questions or if you'd like to move forward.

I'm excited about the opportunity to work together!

Best regards,
[YOUR_NAME]
[YOUR_TITLE]
[HOTEL_NAME]
    `.trim(),
    description: "Proposal email with rate and terms"
  },
  {
    name: "Contract Sent Email",
    subject: "Contract Ready: [HOTEL_NAME] Agreement",
    body: `
Hi [CONTACT_NAME],

Great news! Your contract is ready for review and signature.

NEXT STEPS:
1. Review the attached contract
2. Sign and return by [DUE_DATE]
3. Submit deposit of $[DEPOSIT_AMOUNT]

CONTRACT SUMMARY:
- Room Nights: [ROOM_NIGHTS]
- Rate: $[RATE] per night
- Total Value: $[TOTAL_VALUE]

Please don't hesitate to reach out if you have any questions. I'm here to help!

Looking forward to welcoming you to [HOTEL_NAME].

Best regards,
[YOUR_NAME]
[YOUR_TITLE]
[HOTEL_NAME]
    `.trim(),
    description: "Email sent when contract is ready for signature"
  },
  {
    name: "Thank You Email",
    subject: "Thank You from [HOTEL_NAME]!",
    body: `
Hi [CONTACT_NAME],

I wanted to personally thank you for choosing [HOTEL_NAME] for your lodging needs.

We're committed to providing exceptional service and ensuring your guests have a wonderful experience.

YOUR ACCOUNT MANAGER:
- Name: [YOUR_NAME]
- Email: [YOUR_EMAIL]
- Phone: [YOUR_PHONE]

I'm always just a phone call or email away if you need anything.

We look forward to a long and successful partnership!

Warm regards,
[YOUR_NAME]
[YOUR_TITLE]
[HOTEL_NAME]
    `.trim(),
    description: "Thank you email after deal is closed"
  }
];

async function seedTemplates() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get super admin user (Josh) to set as creator
    const superAdminResult = await client.query(
      `SELECT id FROM users WHERE email = 'josh.gaddis@roomroute.org' LIMIT 1`
    );

    if (superAdminResult.rows.length === 0) {
      console.error('❌ Super admin user not found. Templates need a creator.');
      return;
    }

    const superAdminId = superAdminResult.rows[0].id;
    console.log(`✅ Found super admin user: ${superAdminId}`);

    // Get all active organizations
    const orgsResult = await client.query(
      `SELECT id, name FROM organizations WHERE active = true`
    );

    if (orgsResult.rows.length === 0) {
      console.log('⚠️  No active organizations found. Skipping template seeding.');
      return;
    }

    console.log(`✅ Found ${orgsResult.rows.length} active organizations`);

    // Seed templates for each organization
    for (const org of orgsResult.rows) {
      console.log(`\n📝 Seeding templates for organization: ${org.name} (${org.id})`);

      // Seed contract templates
      for (const template of contractTemplates) {
        // Check if template already exists
        const existingTemplate = await client.query(
          `SELECT id FROM contract_templates WHERE name = $1 AND organization_id = $2`,
          [template.name, org.id]
        );

        if (existingTemplate.rows.length > 0) {
          console.log(`   ⏭️  Contract template "${template.name}" already exists, skipping`);
          continue;
        }

        await client.query(
          `INSERT INTO contract_templates (name, type, content, description, organization_id, created_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [template.name, template.type, template.content, template.description, org.id, superAdminId]
        );
        console.log(`   ✅ Created contract template: ${template.name}`);
      }

      // Seed email templates
      for (const template of emailTemplates) {
        // Check if template already exists
        const existingTemplate = await client.query(
          `SELECT id FROM email_templates WHERE name = $1 AND organization_id = $2`,
          [template.name, org.id]
        );

        if (existingTemplate.rows.length > 0) {
          console.log(`   ⏭️  Email template "${template.name}" already exists, skipping`);
          continue;
        }

        await client.query(
          `INSERT INTO email_templates (name, subject, body, organization_id, created_by, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [template.name, template.subject, template.body, org.id, superAdminId]
        );
        console.log(`   ✅ Created email template: ${template.name}`);
      }
    }

    console.log('\n✅ Template seeding completed successfully!');
    console.log(`\n📊 SUMMARY:`);
    console.log(`   - Contract Templates: ${contractTemplates.length} types`);
    console.log(`   - Email Templates: ${emailTemplates.length} types`);
    console.log(`   - Organizations: ${orgsResult.rows.length}`);

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seeding
seedTemplates()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
