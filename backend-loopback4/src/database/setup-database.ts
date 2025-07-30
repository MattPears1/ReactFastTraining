#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

async function setupDatabase() {
  console.log('🚀 Starting database setup for React Fast Training...');
  
  try {
    // Run migrations
    console.log('\n📋 Running database migrations...');
    const migrationResult = await execAsync('npm run migrate:latest');
    console.log(migrationResult.stdout);
    
    // Run seeds
    console.log('\n🌱 Seeding database...');
    const seedResult = await execAsync('npm run seed:run');
    console.log(seedResult.stdout);
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📊 Database contains:');
    console.log('  - Admin user: lex@reactfasttraining.co.uk');
    console.log('  - 3 course types (EFAW, FAW, Paediatric)');
    console.log('  - 5 training venues across Yorkshire');
    console.log('  - System settings configured');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };