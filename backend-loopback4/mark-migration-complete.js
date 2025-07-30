require('dotenv').config();
const { Client } = require('pg');

async function markMigrationComplete(filename) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mark the migration as complete
    const result = await client.query(
      'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING RETURNING *',
      [filename]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Marked migration ${filename} as completed`);
    } else {
      console.log(`ℹ️  Migration ${filename} was already marked as completed`);
    }

    // Show all migrations
    const allMigrations = await client.query('SELECT * FROM migrations ORDER BY executed_at');
    console.log('\n📊 All migrations:');
    allMigrations.rows.forEach(row => {
      console.log(`  - ${row.filename} (executed: ${row.executed_at})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Get filename from command line
const filename = process.argv[2];
if (!filename) {
  console.error('❌ Please provide a migration filename as argument');
  console.error('Usage: node mark-migration-complete.js <filename>');
  process.exit(1);
}

markMigrationComplete(filename);