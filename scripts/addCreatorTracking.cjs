#!/usr/bin/env node
const { Client } = require('pg');

async function addCreatorTracking() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const tables = ['contacts', 'deals', 'activities', 'contract_templates', 'email_templates'];

    for (const table of tables) {
      console.log(`\nProcessing table: ${table}`);

      // Check if columns already exist
      const checkQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '${table}'
        AND column_name IN ('created_by', 'updated_by');
      `;

      const { rows } = await client.query(checkQuery);
      const existingColumns = rows.map(r => r.column_name);

      if (existingColumns.includes('created_by') && existingColumns.includes('updated_by')) {
        console.log(`  ✅ Columns already exist in ${table}`);
        continue;
      }

      // Add created_by column if it doesn't exist
      if (!existingColumns.includes('created_by')) {
        await client.query(`
          ALTER TABLE ${table}
          ADD COLUMN created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log(`  ✅ Added created_by column to ${table}`);
      }

      // Add updated_by column if it doesn't exist
      if (!existingColumns.includes('updated_by')) {
        await client.query(`
          ALTER TABLE ${table}
          ADD COLUMN updated_by VARCHAR REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log(`  ✅ Added updated_by column to ${table}`);
      }

      // Create index for faster queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${table}_created_by ON ${table}(created_by);
      `);
      console.log(`  ✅ Created index on created_by for ${table}`);
    }

    console.log('\n✅ Creator tracking columns added successfully to all tables!');
    console.log('\nNote: Existing records will have NULL for created_by/updated_by.');
    console.log('New records will automatically track the creator/updater.\n');

  } catch (error) {
    console.error('❌ Error adding creator tracking:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration
addCreatorTracking()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
