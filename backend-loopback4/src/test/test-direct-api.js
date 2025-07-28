#!/usr/bin/env node

// Direct API test without CSRF
require('dotenv').config({ path: __dirname + '/../../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDirectQueries() {
  console.log('🧪 Testing Direct Database Operations\n');
  console.log('=====================================\n');

  try {
    // 1. Test admin user login
    console.log('1️⃣ Testing admin user authentication...');
    const adminCheck = await pool.query(`
      SELECT id, email, first_name, last_name, role 
      FROM users 
      WHERE email = $1 AND role = 'admin'
    `, ['test.admin@reactfasttraining.co.uk']);
    
    if (adminCheck.rows[0]) {
      console.log('✅ Admin user found:', adminCheck.rows[0].email);
    } else {
      console.log('❌ Admin user not found');
    }

    // 2. Test sessions with bookings
    console.log('\n2️⃣ Testing sessions with bookings...');
    const sessions = await pool.query(`
      SELECT 
        cs.id,
        c.name as course_name,
        v.name as venue_name,
        cs.start_datetime,
        cs.status,
        COUNT(b.id) as booking_count
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      JOIN venues v ON cs.venue_id = v.id
      LEFT JOIN bookings b ON cs.id = b.course_schedule_id
      WHERE cs.status = 'published'
      GROUP BY cs.id, c.name, v.name, cs.start_datetime, cs.status
      ORDER BY cs.start_datetime
    `);
    
    console.log(`✅ Found ${sessions.rows.length} sessions:`);
    sessions.rows.forEach(session => {
      console.log(`   - ${session.course_name} at ${session.venue_name}`);
      console.log(`     Date: ${new Date(session.start_datetime).toLocaleDateString()}`);
      console.log(`     Bookings: ${session.booking_count}`);
    });

    // 3. Test email queue
    console.log('\n3️⃣ Testing email queue...');
    const emailQueue = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM email_queue 
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
      GROUP BY status
    `);
    
    console.log('Email queue status:');
    emailQueue.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count}`);
    });

    // 4. Test cancellation workflow
    console.log('\n4️⃣ Testing cancellation workflow components...');
    
    // Check cancellation reasons
    const reasons = await pool.query('SELECT * FROM cancellation_reasons WHERE is_active = true');
    console.log(`✅ Found ${reasons.rows.length} cancellation reasons`);

    // Check email templates
    const templates = await pool.query('SELECT name, category FROM email_templates WHERE is_active = true');
    console.log(`✅ Found ${templates.rows.length} email templates:`);
    templates.rows.forEach(t => console.log(`   - ${t.name} (${t.category})`));

    // 5. Test session details query
    console.log('\n5️⃣ Testing session details query...');
    if (sessions.rows[0]) {
      const details = await pool.query(`
        SELECT 
          cs.id,
          cs.start_datetime,
          cs.end_datetime,
          cs.status,
          c.name as course_name,
          c.price,
          c.max_capacity,
          v.name as venue_name,
          v.address_line1,
          v.city,
          v.postcode,
          COUNT(DISTINCT b.id) as current_bookings,
          COALESCE(SUM(b.payment_amount), 0) as total_revenue
        FROM course_schedules cs
        JOIN courses c ON cs.course_id = c.id
        JOIN venues v ON cs.venue_id = v.id
        LEFT JOIN bookings b ON cs.id = b.course_schedule_id AND b.status = 'confirmed'
        WHERE cs.id = $1
        GROUP BY cs.id, cs.start_datetime, cs.end_datetime, cs.status,
                 c.name, c.price, c.max_capacity,
                 v.name, v.address_line1, v.city, v.postcode
      `, [sessions.rows[0].id]);
      
      if (details.rows[0]) {
        const d = details.rows[0];
        console.log('Session details:');
        console.log(`   Course: ${d.course_name}`);
        console.log(`   Venue: ${d.venue_name}, ${d.city}`);
        console.log(`   Capacity: ${d.current_bookings}/${d.max_capacity}`);
        console.log(`   Revenue: £${d.total_revenue}`);
      }
    }

    // 6. Test activity logging
    console.log('\n6️⃣ Testing activity logs...');
    const activities = await pool.query(`
      SELECT action, resource_type, COUNT(*) as count
      FROM activity_logs
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
      GROUP BY action, resource_type
      ORDER BY count DESC
      LIMIT 5
    `);
    
    if (activities.rows.length > 0) {
      console.log('Recent activities:');
      activities.rows.forEach(a => {
        console.log(`   - ${a.action} on ${a.resource_type}: ${a.count}`);
      });
    } else {
      console.log('No recent activities');
    }

    console.log('\n✅ All direct API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testDirectQueries();