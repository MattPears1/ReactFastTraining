#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

// Try to load dotenv, but continue if it's not available
try {
  require('dotenv').config();
} catch (error) {
  console.log('Note: dotenv not available, using environment variables directly');
}

console.log('🚀 Setting up database for React Fast Training Admin...\n');

// Change to the backend directory
const backendDir = path.join(__dirname, '../..');
process.chdir(backendDir);
console.log(`Working directory: ${process.cwd()}`);

try {
  // Run migrations
  console.log('📦 Running database migrations...');
  execSync('npm run migrate:latest', { stdio: 'inherit' });
  console.log('✅ Migrations completed successfully!\n');

  // Run seeds
  console.log('🌱 Seeding database with admin user...');
  execSync('npm run seed:run', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully!\n');

  console.log('🎉 Database setup complete!');
  console.log('📧 Admin email: lex@reactfasttraining.co.uk');
  console.log('🔑 Admin password: LexOnly321!');
  console.log('\n👉 You can now access the admin portal by clicking the lock icon in the footer.');
  
} catch (error) {
  console.error('❌ Error setting up database:', error);
  process.exit(1);
}