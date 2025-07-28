require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔗 Testing database connection...');
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Current database time:', result.rows[0].now);
    
    // Check migrations table
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'migrations'
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Migrations table exists');
      
      const migrations = await client.query('SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 5');
      console.log(`📊 Found ${migrations.rowCount} recent migrations`);
      migrations.rows.forEach(row => {
        console.log(`  - ${row.filename} (executed: ${row.executed_at})`);
      });
    } else {
      console.log('ℹ️  Migrations table does not exist yet (will be created on first run)');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

testConnection();