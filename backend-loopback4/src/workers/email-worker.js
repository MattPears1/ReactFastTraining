#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/../../.env' });
const { Pool } = require('pg');
const EmailService = require('../services/email.service');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const emailService = new EmailService();

// Process interval (in milliseconds)
const PROCESS_INTERVAL = 30000; // 30 seconds
const BATCH_SIZE = 10;

console.log('Email Worker Started');
console.log('Processing interval:', PROCESS_INTERVAL / 1000, 'seconds');
console.log('Batch size:', BATCH_SIZE);

async function processEmails() {
  console.log('[' + new Date().toISOString() + '] Checking email queue...');
  
  try {
    const result = await emailService.processEmailQueue(pool);
    
    if (result.processed > 0) {
      console.log(`[${new Date().toISOString()}] Processed ${result.processed} emails, ${result.success} successful`);
    }
  } catch (error) {
    console.error('[' + new Date().toISOString() + '] Error processing emails:', error);
  }
}

// Test email configuration on startup
async function testConfiguration() {
  console.log('Testing email configuration...');
  const testResult = await emailService.testEmailConfiguration();
  
  if (testResult.success) {
    console.log('✓ Email configuration is valid');
    console.log('  Host:', process.env.SMTP_HOST || process.env.EMAIL_HOST);
    console.log('  Port:', process.env.SMTP_PORT || process.env.EMAIL_PORT);
    console.log('  User:', process.env.SMTP_USER || process.env.EMAIL_USER);
  } else {
    console.error('✗ Email configuration error:', testResult.message);
    console.error('Please check your environment variables');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  clearInterval(processInterval);
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  clearInterval(processInterval);
  await pool.end();
  process.exit(0);
});

// Start the worker
async function start() {
  await testConfiguration();
  
  // Process immediately on startup
  await processEmails();
  
  // Then process on interval
  const processInterval = setInterval(processEmails, PROCESS_INTERVAL);
}

start().catch(error => {
  console.error('Failed to start email worker:', error);
  process.exit(1);
});