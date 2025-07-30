const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function ensureAdminUnlocked() {
  try {
    console.log('🔓 Ensuring admin account is unlocked...');
    
    // First ensure all columns exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bypass_lockout BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
    `);
    
    // Update the admin account
    const result = await pool.query(`
      UPDATE users 
      SET 
        bypass_lockout = true,
        failed_login_attempts = 0,
        account_locked_until = NULL,
        is_active = true
      WHERE 
        email = 'lex@reactfasttraining.co.uk'
      RETURNING email, role, is_active, bypass_lockout, failed_login_attempts;
    `);
    
    if (result.rowCount === 0) {
      console.log('❌ Admin account not found');
      return;
    }
    
    console.log('✅ Admin account updated:', result.rows[0]);
    
    // Clear any rate limiting
    await pool.query(`
      DELETE FROM login_attempts 
      WHERE user_id = (SELECT id FROM users WHERE email = 'lex@reactfasttraining.co.uk');
    `).catch(() => {
      console.log('ℹ️  No login_attempts table or no records to clear');
    });
    
    // Verify the account can be accessed
    const checkResult = await pool.query(`
      SELECT 
        id, email, role, is_active, 
        bypass_lockout, failed_login_attempts, account_locked_until
      FROM users 
      WHERE email = 'lex@reactfasttraining.co.uk';
    `);
    
    console.log('🔍 Final admin account state:', checkResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

ensureAdminUnlocked();