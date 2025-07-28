#!/usr/bin/env node

/**
 * Database Setup Script for React Fast Training
 * 
 * This script handles:
 * 1. Testing database connection
 * 2. Running migrations
 * 3. Seeding initial data
 * 4. Verifying database state
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { testDatabaseConnection, createDatabaseConnection } from './config';

// Load environment variables
dotenv.config();

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

async function runMigrations(db: any, options: { latest?: boolean; rollback?: boolean } = {}) {
  try {
    if (options.rollback) {
      log('🔄 Rolling back migrations...', colors.yellow);
      await db.migrate.rollback();
      log('✅ Migrations rolled back successfully', colors.green);
      return;
    }

    // Check pending migrations
    const [completed, pending] = await Promise.all([
      db.migrate.list(),
      db.migrate.list({ loadExtensions: ['.ts'] })
    ]);

    if (pending[1].length === 0) {
      log('✅ All migrations are up to date', colors.green);
      return;
    }

    log(`📋 Found ${pending[1].length} pending migration(s):`, colors.yellow);
    pending[1].forEach((migration: string) => {
      console.log(`   - ${migration}`);
    });

    // Run migrations
    log('\n🚀 Running migrations...', colors.yellow);
    const result = await db.migrate.latest();

    if (result[1].length === 0) {
      log('✅ No new migrations to run', colors.green);
    } else {
      log(`✅ Successfully ran ${result[1].length} migration(s):`, colors.green);
      result[1].forEach((migration: string) => {
        console.log(`   ✓ ${migration}`);
      });
    }
  } catch (error) {
    log(`❌ Migration error: ${error.message}`, colors.red);
    throw error;
  }
}

async function runSeeds(db: any, options: { specific?: string } = {}) {
  try {
    log('🌱 Running seed files...', colors.yellow);
    
    if (options.specific) {
      await db.seed.run({ specific: options.specific });
      log(`✅ Seed file '${options.specific}' executed successfully`, colors.green);
    } else {
      await db.seed.run();
      log('✅ All seed files executed successfully', colors.green);
    }
  } catch (error) {
    log(`❌ Seed error: ${error.message}`, colors.red);
    throw error;
  }
}

async function verifyDatabaseState(db: any) {
  try {
    log('🔍 Verifying database state...', colors.yellow);
    
    // Check if tables exist
    const tables = [
      'users',
      'courses',
      'venues',
      'course_schedules',
      'bookings',
      'payment_transactions',
      'certificates',
      'trainers',
      'settings'
    ];
    
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      if (exists) {
        const count = await db(table).count('* as count').first();
        console.log(`   ✓ ${table}: ${count.count} records`);
      } else {
        console.log(`   ✗ ${table}: NOT FOUND`);
      }
    }
    
    log('\n✅ Database verification complete', colors.green);
  } catch (error) {
    log(`❌ Verification error: ${error.message}`, colors.red);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  logSection('React Fast Training - Database Setup');
  
  // Show environment info
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, colors.magenta);
  log(`Database: ${process.env.DB_NAME || 'Using DATABASE_URL'}`, colors.magenta);
  
  // Test connection first
  logSection('Testing Database Connection');
  const connectionOk = await testDatabaseConnection();
  
  if (!connectionOk) {
    log('\n❌ Cannot proceed without database connection', colors.red);
    process.exit(1);
  }
  
  // Create database connection
  const db = await createDatabaseConnection();
  
  try {
    switch (command) {
      case 'migrate':
        logSection('Running Migrations');
        await runMigrations(db, { latest: true });
        break;
        
      case 'rollback':
        logSection('Rolling Back Migrations');
        await runMigrations(db, { rollback: true });
        break;
        
      case 'seed':
        logSection('Running Seeds');
        await runSeeds(db, { specific: args[1] });
        break;
        
      case 'reset':
        logSection('Resetting Database');
        log('⚠️  This will drop all tables and recreate them!', colors.yellow);
        await runMigrations(db, { rollback: true });
        await runMigrations(db, { latest: true });
        await runSeeds(db);
        break;
        
      case 'verify':
        await verifyDatabaseState(db);
        break;
        
      case 'setup':
      default:
        // Full setup: migrate + seed + verify
        logSection('Running Full Database Setup');
        await runMigrations(db, { latest: true });
        await runSeeds(db);
        await verifyDatabaseState(db);
        break;
    }
    
    logSection('✅ Database setup completed successfully!');
    
  } catch (error) {
    logSection('❌ Database setup failed!');
    console.error(error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { runMigrations, runSeeds, verifyDatabaseState };