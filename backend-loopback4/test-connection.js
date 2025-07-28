#!/usr/bin/env node

/**
 * Simple database connection test
 * Can be run directly with: node test-connection.js
 */

require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  // Parse DATABASE_URL or use individual variables
  const connectionString = process.env.DATABASE_URL;
  
  const config = connectionString ? {
    connectionString,
    ssl: { rejectUnauthorized: false }
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'react_fast_training',
  };
  
  const client = new Client(config);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Check current database
    const dbResult = await client.query('SELECT current_database()');
    console.log('Current database:', dbResult.rows[0].current_database);
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('\nTables found:', tablesResult.rows.length);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your DATABASE_URL or DB_* environment variables');
    console.log('2. Ensure PostgreSQL is accessible');
    console.log('3. Verify credentials are correct');
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();