#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/../../.env' });
const axios = require('axios');
const { Pool } = require('pg');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

let authToken = null;
let testSessionId = null;

async function login() {
  console.log('🔐 Logging in as admin...');
  try {
    const response = await axios.post(`${API_URL}/api/admin/auth/login`, {
      email: 'test.admin@reactfasttraining.co.uk',
      password: 'test123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    authToken = response.data.accessToken;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function getTestSession() {
  console.log('\n🔍 Finding test session with bookings...');
  
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
    GROUP BY cs.id, c.name, cs.start_datetime
    HAVING COUNT(b.id) > 0
    ORDER BY cs.start_datetime
    LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    console.error('❌ No test session found with bookings');
    return null;
  }
  
  const session = result.rows[0];
  console.log(`✅ Found session: ${session.course_name} with ${session.booking_count} bookings`);
  return session;
}

async function getCancellationReasons() {
  console.log('\n📋 Fetching cancellation reasons...');
  
  try {
    const response = await axios.get(`${API_URL}/api/admin/cancellation-reasons`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Found ${response.data.length} cancellation reasons`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch cancellation reasons:', error.response?.data || error.message);
    return [];
  }
}

async function checkEmailQueue() {
  console.log('\n📧 Checking email queue...');
  
  const result = await pool.query(`
    SELECT 
      status, 
      COUNT(*) as count 
    FROM email_queue 
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    GROUP BY status
  `);
  
  console.log('Email queue status:');
  result.rows.forEach(row => {
    console.log(`  - ${row.status}: ${row.count}`);
  });
  
  return result.rows;
}

async function checkRefunds() {
  console.log('\n💰 Checking refund logs...');
  
  const result = await pool.query(`
    SELECT 
      status, 
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM refund_logs 
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    GROUP BY status
  `);
  
  console.log('Refund status:');
  result.rows.forEach(row => {
    console.log(`  - ${row.status}: ${row.count} refunds, Total: £${row.total_amount || 0}`);
  });
  
  return result.rows;
}

async function testCancellationWorkflow() {
  console.log('🧪 Testing Session Cancellation Workflow\n');
  console.log('========================================\n');

  // Step 1: Login
  if (!await login()) {
    console.error('Cannot proceed without authentication');
    process.exit(1);
  }

  // Step 2: Get test session
  const session = await getTestSession();
  if (!session) {
    console.error('Cannot proceed without test session');
    process.exit(1);
  }
  testSessionId = session.id;

  // Step 3: Get cancellation reasons
  const reasons = await getCancellationReasons();
  if (reasons.length === 0) {
    console.error('No cancellation reasons available');
    process.exit(1);
  }

  // Step 4: Cancel the session
  console.log('\n🚫 Cancelling session...');
  console.log(`Session ID: ${testSessionId}`);
  console.log(`Reason: ${reasons[0].reason}`);
  console.log('Sending notifications: YES');
  console.log('Processing refunds: YES (test mode)\n');

  try {
    const response = await axios.post(
      `${API_URL}/api/admin/schedules/${testSessionId}/cancel`,
      {
        cancellationReasonId: reasons[0].id,
        reasonDetails: 'Test cancellation - automated test',
        sendNotifications: true,
        processRefunds: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✅ Cancellation successful!');
    console.log(`  - Affected bookings: ${response.data.affectedBookings}`);
    console.log(`  - Emails sent: ${response.data.emailsSent}`);
    console.log(`  - Refunds processed: ${response.data.refundsProcessed}`);
    console.log(`  - Total refund amount: £${response.data.totalRefundAmount || 0}`);

  } catch (error) {
    console.error('❌ Cancellation failed:', error.response?.data || error.message);
    process.exit(1);
  }

  // Step 5: Verify results
  console.log('\n🔍 Verifying cancellation results...\n');

  // Check session status
  const sessionCheck = await pool.query(
    'SELECT status FROM course_schedules WHERE id = $1',
    [testSessionId]
  );
  console.log(`✅ Session status: ${sessionCheck.rows[0].status}`);

  // Check booking statuses
  const bookingCheck = await pool.query(`
    SELECT status, COUNT(*) as count 
    FROM bookings 
    WHERE course_schedule_id = $1 
    GROUP BY status
  `, [testSessionId]);
  
  console.log('\n📋 Booking statuses:');
  bookingCheck.rows.forEach(row => {
    console.log(`  - ${row.status}: ${row.count}`);
  });

  // Check cancellation log
  const cancellationLog = await pool.query(`
    SELECT * FROM session_cancellations 
    WHERE course_schedule_id = $1
    ORDER BY cancelled_at DESC
    LIMIT 1
  `, [testSessionId]);
  
  if (cancellationLog.rows[0]) {
    console.log('\n📝 Cancellation log created:');
    console.log(`  - Affected bookings: ${cancellationLog.rows[0].affected_bookings}`);
    console.log(`  - Total refund amount: £${cancellationLog.rows[0].total_refund_amount}`);
    console.log(`  - Notification sent: ${cancellationLog.rows[0].notification_sent}`);
  }

  // Check emails and refunds
  await checkEmailQueue();
  await checkRefunds();

  // Check activity log
  const activityLog = await pool.query(`
    SELECT * FROM activity_logs 
    WHERE action = 'session.cancelled'
    AND resource_type = 'schedule'
    AND resource_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `, [testSessionId]);
  
  if (activityLog.rows[0]) {
    console.log('\n📊 Activity log entry found');
    console.log(`  - Details: ${JSON.stringify(activityLog.rows[0].details, null, 2)}`);
  }

  console.log('\n✅ Cancellation workflow test complete!');
}

// Run the test
testCancellationWorkflow()
  .catch(console.error)
  .finally(() => pool.end());