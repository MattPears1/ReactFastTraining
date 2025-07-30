const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Database connected successfully!');

    // Check if admin user exists
    console.log('\n📊 Checking admin user...');
    const result = await client.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE email = 'lex@reactfasttraining.co.uk'"
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Admin user found:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.first_name} ${user.last_name}`);
      console.log(`   - Role: ${user.role}`);
    } else {
      console.log('❌ Admin user not found');
    }

    // List all tables
    console.log('\n📋 Database tables:');
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Count records in key tables (using safe query methods)
    console.log('\n📈 Record counts:');
    const tablesToCount = ['users', 'courses', 'locations', 'settings'];
    
    for (const table of tablesToCount) {
      try {
        // Validate table name against whitelist to prevent SQL injection
        if (!tablesToCount.includes(table)) {
          console.log(`   - ${table}: Invalid table name`);
          continue;
        }
        // Use parameterized query with format specifier
        const count = await client.query(
          `SELECT COUNT(*) FROM ${client.escapeIdentifier(table)}`
        );
        console.log(`   - ${table}: ${count.rows[0].count} records`);
      } catch (e) {
        // Table might not exist
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔚 Connection closed');
  }
}

testConnection();