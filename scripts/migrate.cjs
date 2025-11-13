// CommonJS migration script that works in production
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  // Use regular pg Pool for migrations
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // In production (dist/), migrations are in dist/migrations
    // In development, migrations are in migrations/
    const migrationsDir = fs.existsSync(path.join(__dirname, '../migrations'))
      ? path.join(__dirname, '../migrations')
      : path.join(__dirname, '../../migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ Migrations directory not found:', migrationsDir);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n📦 Found ${files.length} migration files in ${migrationsDir}`);

    for (const file of files) {
      console.log(`\n🔄 Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pool.query(sql);
      console.log(`✅ Completed: ${file}`);
    }

    console.log('\n✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
