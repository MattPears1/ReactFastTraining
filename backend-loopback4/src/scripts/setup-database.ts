#!/usr/bin/env node
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Setting up database for React Fast Training Admin...\n');

try {
  // Run migrations
  console.log('📦 Running database migrations...');
  execSync('npx knex migrate:latest', { stdio: 'inherit' });
  console.log('✅ Migrations completed successfully!\n');

  // Run seeds
  console.log('🌱 Seeding database with admin user...');
  execSync('npx knex seed:run', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully!\n');

  console.log('🎉 Database setup complete!');
  console.log('📧 Admin email: lex@reactfasttraining.co.uk');
  console.log('🔑 Admin password: LexOnly321!');
  console.log('\n👉 You can now access the admin portal by clicking the lock icon in the footer.');
  
} catch (error) {
  console.error('❌ Error setting up database:', error);
  process.exit(1);
}