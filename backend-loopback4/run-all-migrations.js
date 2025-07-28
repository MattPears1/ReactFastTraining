require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runAllMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Migrations table ready');

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'src/db/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sort to run in order

    console.log(`📁 Found ${files.length} migration files`);

    // Check which migrations have been run
    const executedResult = await client.query('SELECT filename FROM migrations');
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename));

    // Run pending migrations
    let migrationsRun = 0;
    for (const file of files) {
      if (!executedMigrations.has(file)) {
        console.log(`\n🚀 Running migration: ${file}`);
        
        try {
          // Special handling for migrations that are partially applied
          if (file === '002_create_payment_system.sql' || file === '002_enhance_payment_system.sql') {
            console.log(`⚠️  Skipping ${file} - already partially applied`);
            // Mark it as complete without running
            await client.query(
              'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
              [file]
            );
            continue;
          }
          
          const migrationPath = path.join(migrationsDir, file);
          const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
          
          // Start transaction for this migration
          await client.query('BEGIN');
          
          // Run the migration
          await client.query(migrationSQL);
          
          // Record that this migration has been run
          await client.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            [file]
          );
          
          // Commit the transaction
          await client.query('COMMIT');
          
          console.log(`✅ Migration ${file} completed successfully`);
          migrationsRun++;
        } catch (error) {
          // Rollback on error
          await client.query('ROLLBACK');
          console.error(`❌ Migration ${file} failed:`, error.message);
          throw error; // Stop running further migrations
        }
      } else {
        console.log(`⏭️  Skipping ${file} (already executed)`);
      }
    }

    if (migrationsRun === 0) {
      console.log('\n✅ All migrations are already up to date!');
    } else {
      console.log(`\n✅ Successfully ran ${migrationsRun} migration(s)`);
    }

    // Show current migration status
    const statusResult = await client.query(
      'SELECT filename, executed_at FROM migrations ORDER BY executed_at DESC LIMIT 5'
    );
    console.log('\n📊 Recent migrations:');
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.filename} (executed: ${row.executed_at})`);
    });

  } catch (error) {
    console.error('❌ Migration runner failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migrations
console.log('🏁 Starting database migrations...\n');
runAllMigrations()
  .then(() => {
    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  });