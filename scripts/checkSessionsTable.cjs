const { Client } = require('pg');

async function checkAndCreateSessionsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if sessions table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
      );
    `);

    const tableExists = checkResult.rows[0].exists;
    console.log('Sessions table exists:', tableExists);

    if (!tableExists) {
      console.log('Creating sessions table...');

      // Create sessions table using connect-pg-simple schema
      await client.query(`
        CREATE TABLE "sessions" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        )
        WITH (OIDS=FALSE);

        ALTER TABLE "sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

        CREATE INDEX "IDX_session_expire" ON "sessions" ("expire");
      `);

      console.log('✅ Sessions table created successfully');
    } else {
      console.log('✅ Sessions table already exists');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkAndCreateSessionsTable();
