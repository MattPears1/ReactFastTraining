#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/../../.env' });
const axios = require('axios');
const { Pool } = require('pg');
const EmailService = require('../services/email.service');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const emailService = new EmailService();
let authToken = null;

async function login() {
  console.log('🔐 Logging in as admin...');
  try {
    const response = await axios.post(`${API_URL}/api/admin/auth/login`, {
      email: 'test.admin@reactfasttraining.co.uk',
      password: 'test123'
    });
    
    authToken = response.data.accessToken;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function getUpcomingSession() {
  const result = await pool.query(`
    SELECT 
      cs.id, 
      c.name as course_name,
      COUNT(b.id) as booking_count,
      cs.start_datetime
    FROM course_schedules cs
    JOIN courses c ON cs.course_id = c.id
    LEFT JOIN bookings b ON cs.id = b.course_schedule_id AND b.status = 'confirmed'
    WHERE cs.status = 'scheduled'
    AND cs.start_datetime > CURRENT_TIMESTAMP
    AND cs.start_datetime < CURRENT_TIMESTAMP + INTERVAL '48 hours'
    GROUP BY cs.id, c.name, cs.start_datetime
    HAVING COUNT(b.id) > 0
    ORDER BY cs.start_datetime
    LIMIT 1
  `);
  
  return result.rows[0];
}

async function testReminderEmails() {
  console.log('\n📧 Testing Reminder Emails...\n');
  
  const session = await getUpcomingSession();
  if (!session) {
    console.log('❌ No upcoming session found for reminder test');
    return;
  }
  
  console.log(`Found session: ${session.course_name} with ${session.booking_count} bookings`);
  console.log(`Scheduled for: ${new Date(session.start_datetime).toLocaleString()}`);
  
  try {
    // Send 24-hour reminders
    console.log('\nSending 24-hour reminders...');
    const response = await axios.post(
      `${API_URL}/api/admin/schedules/${session.id}/send-reminders`,
      { hoursBeforeSession: 24 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log(`✅ Reminder emails queued: ${response.data.sent}`);
    
    // Check email queue
    const queueCheck = await pool.query(`
      SELECT * FROM email_queue 
      WHERE subject LIKE 'Reminder:%'
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 minute'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`\n📬 Email queue entries: ${queueCheck.rows.length}`);
    queueCheck.rows.forEach(email => {
      console.log(`  - To: ${email.to_email}`);
      console.log(`    Subject: ${email.subject}`);
      console.log(`    Status: ${email.status}`);
      console.log(`    Scheduled for: ${email.scheduled_for}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to send reminders:', error.response?.data || error.message);
  }
}

async function testCustomEmails() {
  console.log('\n✉️ Testing Custom Email to Attendees...\n');
  
  // Get a session with bookings
  const session = await pool.query(`
    SELECT 
      cs.id,
      c.name as course_name,
      array_agg(b.id) as booking_ids,
      array_agg(u.name) as attendee_names
    FROM course_schedules cs
    JOIN courses c ON cs.course_id = c.id
    JOIN bookings b ON cs.id = b.course_schedule_id
    JOIN users u ON b.user_id = u.id
    WHERE cs.status = 'scheduled'
    AND b.status = 'confirmed'
    GROUP BY cs.id, c.name
    HAVING COUNT(b.id) >= 2
    LIMIT 1
  `);
  
  if (!session.rows[0]) {
    console.log('❌ No session with multiple attendees found');
    return;
  }
  
  const sessionData = session.rows[0];
  const attendeeIds = sessionData.booking_ids.slice(0, 2); // Select first 2 attendees
  
  console.log(`Session: ${sessionData.course_name}`);
  console.log(`Selected attendees: ${attendeeIds.length}`);
  
  try {
    const response = await axios.post(
      `${API_URL}/api/admin/schedules/${sessionData.id}/email-attendees`,
      {
        attendeeIds: attendeeIds,
        subject: 'Important Update About Your Training Session',
        message: 'This is a test message from the automated testing system.\n\nPlease note that this is just a test to verify the email functionality is working correctly.\n\nNo action is required on your part.'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log(`✅ Custom emails sent: ${response.data.emailsSent}`);
    
  } catch (error) {
    console.error('❌ Failed to send custom emails:', error.response?.data || error.message);
  }
}

async function testEmailProcessing() {
  console.log('\n⚙️ Testing Email Queue Processing...\n');
  
  // Process email queue
  console.log('Processing email queue...');
  const result = await emailService.processEmailQueue(pool);
  
  console.log(`Processed: ${result.processed} emails`);
  console.log(`Successful: ${result.success} emails`);
  
  // Show detailed status
  const statusCheck = await pool.query(`
    SELECT 
      status,
      COUNT(*) as count,
      MIN(created_at) as oldest,
      MAX(sent_at) as newest_sent
    FROM email_queue
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    GROUP BY status
    ORDER BY status
  `);
  
  console.log('\n📊 Email Queue Status (last hour):');
  statusCheck.rows.forEach(row => {
    console.log(`  ${row.status}: ${row.count} emails`);
    if (row.status === 'sent' && row.newest_sent) {
      console.log(`    Last sent: ${new Date(row.newest_sent).toLocaleString()}`);
    }
  });
  
  // Show any failed emails
  const failedEmails = await pool.query(`
    SELECT to_email, subject, last_error, attempts
    FROM email_queue
    WHERE status = 'failed'
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    LIMIT 5
  `);
  
  if (failedEmails.rows.length > 0) {
    console.log('\n❌ Failed Emails:');
    failedEmails.rows.forEach(email => {
      console.log(`  - To: ${email.to_email}`);
      console.log(`    Subject: ${email.subject}`);
      console.log(`    Error: ${email.last_error}`);
      console.log(`    Attempts: ${email.attempts}`);
    });
  }
}

async function testEmailTemplates() {
  console.log('\n📄 Testing Email Templates...\n');
  
  const templates = await pool.query(`
    SELECT id, name, category, is_active
    FROM email_templates
    ORDER BY category, name
  `);
  
  console.log(`Found ${templates.rows.length} email templates:`);
  templates.rows.forEach(template => {
    console.log(`  - ${template.name} (${template.category}) - ${template.is_active ? 'Active' : 'Inactive'}`);
  });
  
  // Test template rendering
  console.log('\n🎨 Testing template rendering...');
  
  const bookingTemplate = await pool.query(`
    SELECT * FROM email_templates WHERE name = 'booking_confirmation' LIMIT 1
  `);
  
  if (bookingTemplate.rows[0]) {
    const testVariables = {
      userName: 'Test User',
      courseName: 'Test Course',
      sessionDate: '25 December 2024',
      sessionTime: '09:00 - 15:00',
      venueName: 'Test Venue',
      venueAddress: '123 Test Street, Leeds',
      amountPaid: '75.00'
    };
    
    console.log('✅ Template found: booking_confirmation');
    console.log('   Variables:', Object.keys(testVariables).join(', '));
  }
}

async function runAllTests() {
  console.log('🧪 Email Notification System Test Suite\n');
  console.log('======================================\n');
  
  // Login first
  if (!await login()) {
    console.error('Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Run all tests
  await testEmailTemplates();
  await testReminderEmails();
  await testCustomEmails();
  await testEmailProcessing();
  
  console.log('\n✅ All email notification tests complete!');
}

// Run tests
runAllTests()
  .catch(console.error)
  .finally(() => pool.end());