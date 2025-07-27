import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? {
      rejectUnauthorized: false
    } : undefined,
    host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
    port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'postgres'),
    password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'postgres'),
    database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'react_fast_training'),
  });

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../db/migrations/001_enhance_users_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration: Enhance users table...');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('role', 'phone', 'total_bookings', 'total_spent')
      ORDER BY column_name;
    `);
    
    console.log('\nVerification - New columns added:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\nMigration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export { runMigration };