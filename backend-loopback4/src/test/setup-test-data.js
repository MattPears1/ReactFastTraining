#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/../../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  try {
    // 1. Create test admin user
    console.log('1️⃣ Creating test admin user...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const adminUser = await pool.query(`
      INSERT INTO users (email, password, name, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE
      SET password = $2, name = $3, role = $4, is_active = $5
      RETURNING id, email
    `, ['test.admin@reactfasttraining.co.uk', hashedPassword, 'Test Admin', 'admin', true]);
    
    console.log('✅ Admin user created:', adminUser.rows[0].email);

    // 2. Create test customers
    console.log('\n2️⃣ Creating test customers...');
    const customers = [];
    
    for (let i = 1; i <= 5; i++) {
      const customer = await pool.query(`
        INSERT INTO users (email, password, name, phone, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO UPDATE
        SET name = $3, phone = $4
        RETURNING id, email, name
      `, [
        `test.customer${i}@example.com`,
        hashedPassword,
        `Test Customer ${i}`,
        `0770000000${i}`,
        'customer',
        true
      ]);
      customers.push(customer.rows[0]);
      console.log(`✅ Customer created: ${customer.rows[0].name}`);
    }

    // 3. Ensure courses exist
    console.log('\n3️⃣ Ensuring courses exist...');
    const courses = await pool.query(`
      SELECT id, name, price FROM courses 
      WHERE status = 'active' 
      ORDER BY id 
      LIMIT 3
    `);
    
    if (courses.rows.length === 0) {
      console.log('❌ No active courses found. Please create courses first.');
      process.exit(1);
    }
    
    console.log('✅ Found courses:');
    courses.rows.forEach(course => {
      console.log(`   - ${course.name} (£${course.price})`);
    });

    // 4. Ensure venues exist
    console.log('\n4️⃣ Ensuring venues exist...');
    const venues = await pool.query(`
      SELECT id, name, city FROM venues 
      WHERE is_active = true 
      ORDER BY id 
      LIMIT 2
    `);
    
    if (venues.rows.length === 0) {
      console.log('Creating test venue...');
      const venue = await pool.query(`
        INSERT INTO venues (
          name, address_line1, city, county, postcode, 
          capacity, facilities, is_active
        ) VALUES (
          'Test Training Centre',
          '123 Test Street',
          'Leeds',
          'West Yorkshire',
          'LS1 1AA',
          20,
          '["WiFi", "Parking", "Refreshments"]'::jsonb,
          true
        ) RETURNING id, name, city
      `);
      venues.rows = [venue.rows[0]];
    }
    
    console.log('✅ Found venues:');
    venues.rows.forEach(venue => {
      console.log(`   - ${venue.name}, ${venue.city}`);
    });

    // 5. Create test sessions
    console.log('\n5️⃣ Creating test sessions...');
    const sessions = [];
    
    // Session 1: Tomorrow, fully booked
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const session1 = await pool.query(`
      INSERT INTO course_schedules (
        course_id, venue_id, start_datetime, end_datetime, 
        max_capacity, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      courses.rows[0].id,
      venues.rows[0].id,
      tomorrow.toISOString(),
      new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours later
      3, // Small capacity for testing
      'scheduled'
    ]);
    
    if (session1.rows[0]) {
      sessions.push({ id: session1.rows[0].id, name: 'Tomorrow - Fully Booked' });
      console.log('✅ Created session: Tomorrow - Fully Booked');
    }

    // Session 2: Next week, partial bookings
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    
    const session2 = await pool.query(`
      INSERT INTO course_schedules (
        course_id, venue_id, start_datetime, end_datetime, 
        max_capacity, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      courses.rows[1] ? courses.rows[1].id : courses.rows[0].id,
      venues.rows[0].id,
      nextWeek.toISOString(),
      new Date(nextWeek.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      10,
      'scheduled'
    ]);
    
    if (session2.rows[0]) {
      sessions.push({ id: session2.rows[0].id, name: 'Next Week - Partial' });
      console.log('✅ Created session: Next Week - Partial');
    }

    // Session 3: Two weeks, no bookings
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    twoWeeks.setHours(9, 0, 0, 0);
    
    const session3 = await pool.query(`
      INSERT INTO course_schedules (
        course_id, venue_id, start_datetime, end_datetime, 
        max_capacity, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      courses.rows[2] ? courses.rows[2].id : courses.rows[0].id,
      venues.rows[0].id,
      twoWeeks.toISOString(),
      new Date(twoWeeks.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      12,
      'scheduled'
    ]);
    
    if (session3.rows[0]) {
      sessions.push({ id: session3.rows[0].id, name: 'Two Weeks - Empty' });
      console.log('✅ Created session: Two Weeks - Empty');
    }

    // 6. Create test bookings
    console.log('\n6️⃣ Creating test bookings...');
    
    // Book session 1 to capacity
    if (sessions[0]) {
      for (let i = 0; i < 3; i++) {
        await pool.query(`
          INSERT INTO bookings (
            user_id, course_schedule_id, status, payment_status,
            payment_amount, payment_method, stripe_payment_intent_id,
            booking_reference
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          customers[i].id,
          sessions[0].id,
          'confirmed',
          'completed',
          courses.rows[0].price,
          'card',
          `pi_test_${Date.now()}_${i}`,
          `TEST${Date.now()}${i}`
        ]);
      }
      console.log('✅ Fully booked session 1');
    }

    // Book session 2 partially
    if (sessions[1]) {
      for (let i = 0; i < 2; i++) {
        await pool.query(`
          INSERT INTO bookings (
            user_id, course_schedule_id, status, payment_status,
            payment_amount, payment_method, stripe_payment_intent_id,
            booking_reference
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          customers[i].id,
          sessions[1].id,
          'confirmed',
          'completed',
          courses.rows[1] ? courses.rows[1].price : courses.rows[0].price,
          'card',
          `pi_test_${Date.now()}_${i}_s2`,
          `TEST${Date.now()}${i}S2`
        ]);
      }
      console.log('✅ Partially booked session 2');
    }

    // 7. Display summary
    console.log('\n📊 Test Data Summary:');
    console.log('====================');
    console.log(`Admin User: test.admin@reactfasttraining.co.uk (password: test123)`);
    console.log(`Test Customers: ${customers.length} created`);
    console.log(`Test Sessions: ${sessions.filter(s => s).length} created`);
    console.log(`  - Tomorrow: Fully booked (3/3)`);
    console.log(`  - Next Week: Partially booked (2/10)`);
    console.log(`  - Two Weeks: No bookings (0/12)`);
    
    console.log('\n✅ Test data setup complete!');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupTestData();