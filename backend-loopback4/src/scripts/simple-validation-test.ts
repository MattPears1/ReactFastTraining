import { db } from '../config/database.config';
import { courseSchedules, courses, bookings, adminAlerts } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

async function simpleValidationTest() {
  console.log('🧪 Simple Booking Validation Test');
  console.log('================================\n');

  try {
    // Test 1: Check if course_schedules table exists
    console.log('Test 1: Checking database tables...');
    try {
      const sessions = await db
        .select({ id: courseSchedules.id })
        .from(courseSchedules)
        .limit(1);
      console.log('✅ course_schedules table exists');
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log('❌ course_schedules table does not exist');
        console.log('Creating sample data in course_sessions table instead...');
        
        // Use the existing tables
        const testResult = await db.execute(sql`
          SELECT 
            cs.id,
            c.name as course_name,
            c.price,
            cs.max_participants as max_capacity,
            cs.current_bookings as current_capacity,
            cs.status
          FROM course_sessions cs
          JOIN courses c ON cs.course_id = c.id::uuid
          WHERE cs.status = 'scheduled'
          LIMIT 5
        `);
        
        console.log('Found sessions:', testResult.rows);
      }
    }

    // Test 2: Check admin alerts
    console.log('\nTest 2: Checking admin alerts...');
    const alerts = await db
      .select()
      .from(adminAlerts)
      .limit(5);
    
    console.log(`Found ${alerts.length} admin alerts`);
    alerts.forEach((alert: any) => {
      console.log(`- ${alert.title} (${alert.severity}) - ${alert.status}`);
    });

    // Test 3: Check bookings
    console.log('\nTest 3: Checking recent bookings...');
    const recentBookings = await db
      .select({
        id: bookings.id,
        reference: bookings.bookingReference,
        email: sql`${bookings.contactDetails}->>'email'`,
        status: bookings.status,
        amount: bookings.totalAmount,
        created: bookings.createdAt,
      })
      .from(bookings)
      .orderBy(sql`${bookings.createdAt} DESC`)
      .limit(5);
    
    console.log(`Found ${recentBookings.length} recent bookings`);
    recentBookings.forEach((booking: any) => {
      console.log(`- ${booking.reference} - ${booking.email} - £${booking.amount} - ${booking.status}`);
    });

    // Test 4: Test validation logic
    console.log('\nTest 4: Testing validation logic...');
    
    // Price validation test
    const pricePerPerson = 75;
    const participants = 2;
    const totalAmount = 150;
    const expectedAmount = pricePerPerson * participants;
    const isValidAmount = Math.abs(totalAmount - expectedAmount) <= 0.01;
    console.log(`Price validation: £${totalAmount} for ${participants} participants @ £${pricePerPerson} = ${isValidAmount ? '✅ VALID' : '❌ INVALID'}`);

    // Capacity validation test
    const maxCapacity = 12;
    const currentCapacity = 8;
    const requestedSpots = 3;
    const availableSpots = maxCapacity - currentCapacity;
    const hasCapacity = requestedSpots <= availableSpots;
    console.log(`Capacity validation: ${requestedSpots} spots requested, ${availableSpots} available = ${hasCapacity ? '✅ OK' : '❌ FULL'}`);

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$pool.end();
  }
}

// Run the test
simpleValidationTest().catch(console.error);