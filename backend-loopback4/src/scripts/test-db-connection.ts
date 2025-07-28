#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * Use this to verify database connectivity and troubleshoot connection issues
 */

import * as dotenv from 'dotenv';
import { testDatabaseConnection, createDatabaseConnection } from '../database/config';

// Load environment variables
dotenv.config();

async function runTests() {
  console.log('🔍 React Fast Training - Database Connection Test\n');
  
  // Display environment info
  console.log('📋 Environment Information:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Not set'}`);
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'Not set'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || 'Not set'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || 'Not set'}`);
  console.log('\n');
  
  // Test basic connectivity
  console.log('🔌 Testing Database Connection...');
  const connected = await testDatabaseConnection();
  
  if (!connected) {
    console.error('\n❌ Database connection test failed!');
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check your DATABASE_URL or individual DB_* environment variables');
    console.log('   2. Ensure PostgreSQL is running');
    console.log('   3. Verify network connectivity to the database server');
    console.log('   4. Check firewall rules and security groups');
    return;
  }
  
  // Test connection with retry
  console.log('\n🔄 Testing connection with retry logic...');
  try {
    const db = await createDatabaseConnection(3, 2000);
    
    // Run some basic queries
    console.log('\n📊 Running diagnostic queries...');
    
    // Check database size
    const sizeResult = await db.raw(`
      SELECT pg_database_size(current_database()) as size,
             pg_size_pretty(pg_database_size(current_database())) as size_pretty
    `);
    console.log(`   Database size: ${sizeResult.rows[0].size_pretty}`);
    
    // Check table count
    const tableResult = await db.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    console.log(`   Number of tables: ${tableResult.rows[0].count}`);
    
    // Check connection info
    const connResult = await db.raw(`
      SELECT current_database() as database,
             current_user as user,
             inet_server_addr() as server_address,
             inet_server_port() as server_port,
             version() as pg_version
    `);
    const conn = connResult.rows[0];
    console.log(`   Connected to: ${conn.database}`);
    console.log(`   User: ${conn.user}`);
    console.log(`   Server: ${conn.server_address}:${conn.server_port}`);
    
    // Check for required extensions
    console.log('\n🔧 Checking PostgreSQL extensions...');
    const extResult = await db.raw(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    
    if (extResult.rows.length === 0) {
      console.log('   ⚠️  No UUID extensions found. Creating pgcrypto extension...');
      try {
        await db.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');
        console.log('   ✅ pgcrypto extension created');
      } catch (error) {
        console.log('   ❌ Failed to create pgcrypto extension:', error.message);
      }
    } else {
      extResult.rows.forEach((ext: any) => {
        console.log(`   ✓ ${ext.extname} v${ext.extversion}`);
      });
    }
    
    // List tables if any exist
    const tablesResult = await db.raw(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('\n📋 Existing tables:');
      tablesResult.rows.forEach((table: any) => {
        console.log(`   - ${table.tablename}`);
      });
    } else {
      console.log('\n📋 No tables found (database is empty)');
    }
    
    // Close connection
    await db.destroy();
    
    console.log('\n✅ All database tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during extended tests:', error);
  }
}

// Run the tests
runTests().catch(console.error);