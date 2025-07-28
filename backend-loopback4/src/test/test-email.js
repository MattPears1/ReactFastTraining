#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/../../.env' });
const EmailService = require('../services/email.service');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const emailService = new EmailService();

async function testEmail() {
  console.log('Testing email configuration...\n');
  
  // Test configuration
  const configTest = await emailService.testEmailConfiguration();
  console.log('Configuration test:', configTest);
  
  if (!configTest.success) {
    console.error('Email configuration failed. Please check your .env file');
    process.exit(1);
  }
  
  console.log('\nQueuing test email...');
  
  try {
    // Queue a test email
    const result = await pool.query(`
      INSERT INTO email_queue (
        to_email, 
        subject, 
        body_html, 
        body_text,
        priority
      ) VALUES (
        $1, 
        $2, 
        $3, 
        $4,
        $5
      ) RETURNING id
    `, [
      process.env.ADMIN_EMAIL || 'lex@reactfasttraining.co.uk',
      'Test Email - React Fast Training System',
      `
        <h2>Test Email</h2>
        <p>This is a test email from your React Fast Training system.</p>
        <p>If you're receiving this, your email configuration is working correctly!</p>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>From: ${process.env.EMAIL_FROM}</li>
        </ul>
        <p>Best regards,<br>React Fast Training System</p>
      `,
      'Test Email\n\nThis is a test email from your React Fast Training system.\n\nIf you\'re receiving this, your email configuration is working correctly!',
      10 // highest priority
    ]);
    
    console.log('Test email queued with ID:', result.rows[0].id);
    
    // Process the queue immediately
    console.log('\nProcessing email queue...');
    const processResult = await emailService.processEmailQueue(pool);
    console.log('Process result:', processResult);
    
    // Check the status
    const statusCheck = await pool.query(
      'SELECT * FROM email_queue WHERE id = $1',
      [result.rows[0].id]
    );
    
    console.log('\nEmail status:', statusCheck.rows[0].status);
    
    if (statusCheck.rows[0].status === 'sent') {
      console.log('✅ Email sent successfully!');
    } else if (statusCheck.rows[0].status === 'failed') {
      console.log('❌ Email failed to send');
      console.log('Error:', statusCheck.rows[0].last_error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

testEmail();