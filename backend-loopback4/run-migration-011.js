require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/db/migrations/011_fix_course_statistics_view.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration 011_fix_course_statistics_view.sql...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Verify the view works
    console.log('🔍 Verifying course_statistics view...');
    const result = await client.query('SELECT COUNT(*) FROM course_statistics');
    console.log(`✅ View is working! Found ${result.rows[0].count} courses in statistics`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();