#!/usr/bin/env node
const { Client } = require('pg');

async function addPasswordResetTokensTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'password_reset_tokens'
      );
    `;

    const { rows } = await client.query(checkTableQuery);
    if (rows[0].exists) {
      console.log('✅ Table password_reset_tokens already exists');
      return;
    }

    // Create password_reset_tokens table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ Created table: password_reset_tokens');

    // Create index on token for faster lookups
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
      ON password_reset_tokens(token);
    `;

    await client.query(createIndexQuery);
    console.log('✅ Created index on token column');

    // Create index on expires_at for cleanup
    const createExpiryIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
      ON password_reset_tokens(expires_at);
    `;

    await client.query(createExpiryIndexQuery);
    console.log('✅ Created index on expires_at column');

    console.log('\n✅ Password reset tokens table created successfully!');
  } catch (error) {
    console.error('❌ Error creating password reset tokens table:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration
addPasswordResetTokensTable()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
