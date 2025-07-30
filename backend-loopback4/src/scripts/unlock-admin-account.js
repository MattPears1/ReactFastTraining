const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function unlockAdminAccount(email) {
  try {
    console.log(`🔓 Unlocking admin account: ${email}`);
    
    // Reset failed login attempts and unlock the account
    const result = await pool.query(`
      UPDATE users 
      SET 
        failed_login_attempts = 0,
        last_failed_login = NULL,
        account_locked_until = NULL,
        is_active = true,
        updated_at = NOW()
      WHERE 
        email = $1 
        AND role = 'admin'
      RETURNING id, email, first_name, last_name, is_active, failed_login_attempts
    `, [email]);

    if (result.rows.length === 0) {
      console.error(`❌ No admin account found with email: ${email}`);
      return;
    }

    const user = result.rows[0];
    console.log('✅ Account unlocked successfully!');
    console.log('📊 Account details:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.first_name} ${user.last_name}`);
    console.log(`   - Active: ${user.is_active}`);
    console.log(`   - Failed attempts: ${user.failed_login_attempts}`);

    // Also check if there are any login_attempts records to clear
    const attemptsResult = await pool.query(`
      DELETE FROM login_attempts 
      WHERE user_id = $1 
      AND created_at > NOW() - INTERVAL '24 hours'
      RETURNING id
    `, [user.id]);

    if (attemptsResult.rows.length > 0) {
      console.log(`🧹 Cleared ${attemptsResult.rows.length} recent login attempt records`);
    }

  } catch (error) {
    console.error('❌ Error unlocking account:', error);
  } finally {
    await pool.end();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'lex@reactfasttraining.co.uk';

console.log('🔐 Admin Account Unlock Script');
console.log('==============================');
unlockAdminAccount(email);