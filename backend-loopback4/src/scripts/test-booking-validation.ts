import { db } from '../db';
import { BookingValidationService } from '../services/booking-validation.service';
import { BookingServiceEnhanced } from '../services/booking-service-enhanced';
import { UserManagementService } from '../services/user-management.service';
import { PaymentManagementService } from '../services/payment-management.service';
import { EmailService } from '../services/email.service';
import { WebSocketService } from '../services/websocket.service';

async function testBookingValidation() {
  console.log('🧪 Testing Booking Validation System');
  console.log('===================================\n');

  // Initialize services
  const validationService = new BookingValidationService();
  const userService = new UserManagementService();
  const paymentService = new PaymentManagementService();
  const emailService = new EmailService();
  const websocketService = new WebSocketService();
  
  const bookingService = new BookingServiceEnhanced(
    userService,
    validationService,
    paymentService,
    emailService,
    websocketService
  );

  try {
    // Test 1: Valid booking
    console.log('Test 1: Valid booking with correct amount');
    const validResult = await validationService.validateBooking({
      courseScheduleId: 1,
      numberOfParticipants: 2,
      totalAmount: 150, // £75 x 2 participants
      email: 'test@example.com',
    });
    console.log('Result:', validResult.isValid ? '✅ PASS' : '❌ FAIL');
    console.log('Errors:', validResult.errors);
    console.log('Warnings:', validResult.warnings);
    console.log('\n');

    // Test 2: Invalid amount
    console.log('Test 2: Invalid payment amount');
    const invalidAmountResult = await validationService.validateBooking({
      courseScheduleId: 1,
      numberOfParticipants: 2,
      totalAmount: 100, // Wrong amount
      email: 'test2@example.com',
    });
    console.log('Result:', !invalidAmountResult.isValid ? '✅ PASS' : '❌ FAIL');
    console.log('Errors:', invalidAmountResult.errors);
    console.log('\n');

    // Test 3: Duplicate booking
    console.log('Test 3: Duplicate booking detection');
    // First, create a booking
    const firstBooking = await bookingService.createBooking({
      courseScheduleId: 1,
      contactDetails: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'duplicate@example.com',
        phone: '07700900000',
      },
      participants: [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'duplicate@example.com',
      }],
      numberOfParticipants: 1,
      totalAmount: 75,
      paymentMethod: 'card',
      confirmedTermsAndConditions: true,
    });
    
    // Try to book again with same email
    const duplicateResult = await validationService.validateBooking({
      courseScheduleId: 1,
      numberOfParticipants: 1,
      totalAmount: 75,
      email: 'duplicate@example.com',
    });
    console.log('Result:', !duplicateResult.isValid ? '✅ PASS' : '❌ FAIL');
    console.log('Errors:', duplicateResult.errors);
    console.log('\n');

    // Test 4: Capacity check
    console.log('Test 4: Capacity check (trying to book more than available)');
    const overCapacityResult = await validationService.validateBooking({
      courseScheduleId: 1,
      numberOfParticipants: 15, // More than max capacity
      totalAmount: 1125, // £75 x 15
      email: 'overcapacity@example.com',
    });
    console.log('Result:', !overCapacityResult.isValid ? '✅ PASS' : '❌ FAIL');
    console.log('Errors:', overCapacityResult.errors);
    console.log('\n');

    // Test 5: Session availability
    console.log('Test 5: Get session availability');
    const availability = await validationService.getSessionAvailability(1);
    console.log('Session availability:', availability);
    console.log('\n');

    // Test 6: Get all available sessions
    console.log('Test 6: Get all available sessions with capacity');
    const sessions = await validationService.getAvailableSessionsWithCapacity();
    console.log(`Found ${sessions.length} available sessions`);
    sessions.slice(0, 3).forEach(session => {
      console.log(`- ${session.courseName} on ${new Date(session.startDatetime).toLocaleDateString()}`);
      console.log(`  Venue: ${session.venueName}`);
      console.log(`  Available: ${session.availableSpots}/${session.maxCapacity} (${session.percentageFull}% full)`);
      console.log(`  Status: ${session.status}${session.isFull ? ' - FULL' : ''}`);
    });

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    await db.$pool.end();
  }
}

// Run the tests
testBookingValidation().catch(console.error);