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
let createdSessionId = null;

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

async function getCourseAndVenue() {
  const courses = await pool.query('SELECT id, name FROM courses WHERE status = $1 LIMIT 1', ['active']);
  const venues = await pool.query('SELECT id, name FROM venues WHERE is_active = $1 LIMIT 1', [true]);
  
  if (!courses.rows[0] || !venues.rows[0]) {
    throw new Error('No active courses or venues found');
  }
  
  return {
    course: courses.rows[0],
    venue: venues.rows[0]
  };
}

async function testCreateSession() {
  console.log('\n📅 Testing Session Creation...\n');
  
  const { course, venue } = await getCourseAndVenue();
  
  // Create a session for next month
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setHours(9, 0, 0, 0);
  
  const sessionData = {
    courseId: course.id,
    venueId: venue.id,
    date: nextMonth.toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '15:00',
    maxCapacity: 15,
    notes: 'Test session created by automated test'
  };
  
  console.log('Creating session:');
  console.log(`  Course: ${course.name}`);
  console.log(`  Venue: ${venue.name}`);
  console.log(`  Date: ${sessionData.date}`);
  console.log(`  Time: ${sessionData.startTime} - ${sessionData.endTime}`);
  console.log(`  Capacity: ${sessionData.maxCapacity}`);
  
  try {
    const response = await axios.post(
      `${API_URL}/course-sessions`,
      {
        ...sessionData,
        startDatetime: `${sessionData.date} ${sessionData.startTime}:00`,
        endDatetime: `${sessionData.date} ${sessionData.endTime}:00`
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    createdSessionId = response.data.id;
    console.log(`\n✅ Session created successfully! ID: ${createdSessionId}`);
    
    // Verify in database
    const verify = await pool.query(
      'SELECT * FROM course_schedules WHERE id = $1',
      [createdSessionId]
    );
    
    if (verify.rows[0]) {
      console.log('✅ Session verified in database');
    }
    
  } catch (error) {
    console.error('❌ Failed to create session:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetSessionDetails() {
  console.log('\n🔍 Testing Get Session Details...\n');
  
  if (!createdSessionId) {
    console.log('❌ No session ID available for testing');
    return;
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/api/admin/schedules/${createdSessionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const session = response.data;
    console.log('Session details retrieved:');
    console.log(`  ID: ${session.id}`);
    console.log(`  Course: ${session.courseName}`);
    console.log(`  Venue: ${session.venueName}`);
    console.log(`  Date: ${session.date}`);
    console.log(`  Time: ${session.startTime} - ${session.endTime}`);
    console.log(`  Bookings: ${session.currentBookings}/${session.maxParticipants}`);
    console.log(`  Status: ${session.status}`);
    
  } catch (error) {
    console.error('❌ Failed to get session details:', error.response?.data || error.message);
  }
}

async function testUpdateSession() {
  console.log('\n✏️ Testing Session Update...\n');
  
  if (!createdSessionId) {
    console.log('❌ No session ID available for testing');
    return;
  }
  
  const updateData = {
    maxCapacity: 20,
    notes: 'Updated by automated test - capacity increased'
  };
  
  console.log('Updating session:');
  console.log(`  New capacity: ${updateData.maxCapacity}`);
  console.log(`  New notes: ${updateData.notes}`);
  
  try {
    const response = await axios.put(
      `${API_URL}/api/admin/schedules/${createdSessionId}`,
      updateData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('\n✅ Session updated successfully!');
    
    // Verify update
    const verify = await pool.query(
      'SELECT max_capacity, notes FROM course_schedules WHERE id = $1',
      [createdSessionId]
    );
    
    if (verify.rows[0]) {
      console.log('✅ Update verified in database:');
      console.log(`  Capacity: ${verify.rows[0].max_capacity}`);
      console.log(`  Notes: ${verify.rows[0].notes}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to update session:', error.response?.data || error.message);
  }
}

async function testScheduleList() {
  console.log('\n📋 Testing Schedule List...\n');
  
  try {
    const response = await axios.get(
      `${API_URL}/api/admin/schedules`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const schedules = response.data;
    console.log(`Found ${schedules.length} schedules`);
    
    // Show first 5
    console.log('\nFirst 5 schedules:');
    schedules.slice(0, 5).forEach(schedule => {
      console.log(`  - ${schedule.courseName} on ${schedule.date}`);
      console.log(`    ${schedule.startTime} - ${schedule.endTime} at ${schedule.location}`);
      console.log(`    Bookings: ${schedule.currentBookings}/${schedule.maxParticipants}`);
      console.log(`    Status: ${schedule.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to get schedule list:', error.response?.data || error.message);
  }
}

async function testDeleteSession() {
  console.log('\n🗑️ Testing Session Deletion...\n');
  
  if (!createdSessionId) {
    console.log('❌ No session ID available for testing');
    return;
  }
  
  // First check if there are bookings
  const bookingCheck = await pool.query(
    'SELECT COUNT(*) as count FROM bookings WHERE course_schedule_id = $1',
    [createdSessionId]
  );
  
  if (bookingCheck.rows[0].count > 0) {
    console.log(`⚠️ Session has ${bookingCheck.rows[0].count} bookings - deletion should fail`);
  }
  
  try {
    const response = await axios.delete(
      `${API_URL}/api/admin/schedules/${createdSessionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Session deleted successfully!');
    
    // Verify deletion
    const verify = await pool.query(
      'SELECT id FROM course_schedules WHERE id = $1',
      [createdSessionId]
    );
    
    if (verify.rows.length === 0) {
      console.log('✅ Deletion verified - session no longer exists');
    }
    
  } catch (error) {
    if (error.response?.status === 400 && bookingCheck.rows[0].count > 0) {
      console.log('✅ Correctly prevented deletion of session with bookings');
    } else {
      console.error('❌ Failed to delete session:', error.response?.data || error.message);
    }
  }
}

async function runAllTests() {
  console.log('🧪 Session Management Test Suite\n');
  console.log('================================\n');
  
  // Login first
  if (!await login()) {
    console.error('Cannot proceed without authentication');
    process.exit(1);
  }
  
  try {
    // Run tests in sequence
    await testCreateSession();
    await testGetSessionDetails();
    await testUpdateSession();
    await testScheduleList();
    await testDeleteSession();
    
    console.log('\n✅ All session management tests complete!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run tests
runAllTests()
  .catch(console.error)
  .finally(() => pool.end());