import { db } from '../../config/database.config';
import { bookings, bookingAttendees, courseSessions, BookingStatus, payments } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { CourseSessionService } from '../course-session.service';
import { PaymentService } from '../payment.service';
import { EmailService } from '../email.service';
import { SpecialRequirementsService } from '../special-requirements.service';
import { InvoiceService } from '../invoice.service';

interface CreateBookingData {
  userId: string;
  sessionId: string;
  attendees: Array<{ name: string; email: string; isPrimary?: boolean }>;
  specialRequirements?: string;
  termsAccepted: boolean;
}

interface BookingWithDetails {
  id: string;
  bookingReference: string;
  sessionId: string;
  userId: string;
  numberOfAttendees: number;
  totalAmount: string;
  specialRequirements?: string;
  attendees: Array<{ name: string; email: string; isPrimary: boolean }>;
  courseDetails: any;
}

export class BookingService {
  static generateBookingReference(): string {
    const prefix = 'RFT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`.substring(0, 10);
  }

  static async createBooking(data: CreateBookingData) {
    if (!data.termsAccepted) {
      throw new Error('Terms must be accepted');
    }

    // Use transaction for atomic operations
    return await db.transaction(async (tx) => {
      // Check availability with row locking
      const [session] = await tx
        .select()
        .from(courseSessions)
        .where(eq(courseSessions.id, data.sessionId))
        .for('update'); // Lock the row to prevent concurrent modifications

      if (!session) {
        throw new Error('Session not found');
      }

      const remainingSpots = session.maxParticipants - session.currentBookings;
      if (data.attendees.length > remainingSpots) {
        throw new Error(`Only ${remainingSpots} spots available`);
      }

      // Get course price (assuming it's stored in session or related course)
      const coursePrice = await this.getCoursePrice(session.courseId);
      const totalAmount = coursePrice * data.attendees.length;

      // Create booking
      const [booking] = await tx.insert(bookings).values({
        userId: data.userId,
        sessionId: data.sessionId,
        bookingReference: this.generateBookingReference(),
        numberOfAttendees: data.attendees.length,
        totalAmount: totalAmount.toString(),
        specialRequirements: data.specialRequirements,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        status: BookingStatus.PENDING,
      }).returning();

      // Add attendees
      const attendeesToInsert = data.attendees.map((attendee, index) => ({
        bookingId: booking.id,
        name: attendee.name,
        email: attendee.email,
        isPrimary: attendee.isPrimary || index === 0,
      }));

      await tx.insert(bookingAttendees).values(attendeesToInsert);

      // Update session booking count
      await tx
        .update(courseSessions)
        .set({
          currentBookings: sql`${courseSessions.currentBookings} + ${data.attendees.length}`,
          status: remainingSpots - data.attendees.length <= 0 ? 'full' : 'scheduled',
          updatedAt: new Date(),
        })
        .where(eq(courseSessions.id, data.sessionId));

      return booking;
    });
  }

  static async confirmBooking(bookingId: string, paymentIntentId: string) {
    await db
      .update(bookings)
      .set({
        status: BookingStatus.CONFIRMED,
        paymentIntentId,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    // Get payment details for the invoice
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntentId));

    // Generate invoice if payment exists
    if (payment && payment.status === 'succeeded') {
      try {
        await InvoiceService.createInvoice(bookingId);
      } catch (error) {
        console.error('Invoice generation failed:', error);
        // Don't fail the booking confirmation if invoice fails
      }
    }

    // Send confirmation emails
    const booking = await this.getBookingWithDetails(bookingId);
    await EmailService.sendBookingConfirmation(booking);
  }

  static async cancelBooking(bookingId: string) {
    return await db.transaction(async (tx) => {
      // Get booking details
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new Error('Booking is already cancelled');
      }

      // Update booking status
      await tx
        .update(bookings)
        .set({
          status: BookingStatus.CANCELLED,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      // Release spots in session
      await tx
        .update(courseSessions)
        .set({
          currentBookings: sql`${courseSessions.currentBookings} - ${booking.numberOfAttendees}`,
          status: 'scheduled', // Reset from 'full' if applicable
          updatedAt: new Date(),
        })
        .where(eq(courseSessions.id, booking.sessionId));

      return booking;
    });
  }

  static async getBookingWithDetails(bookingId: string): Promise<BookingWithDetails> {
    // Get booking with attendees
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get attendees
    const attendees = await db
      .select()
      .from(bookingAttendees)
      .where(eq(bookingAttendees.bookingId, bookingId));

    // Get session and course details
    const [session] = await db
      .select()
      .from(courseSessions)
      .where(eq(courseSessions.id, booking.sessionId));

    // TODO: Join with courses table when properly set up
    const courseDetails = {
      courseType: 'Emergency First Aid at Work', // Placeholder
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      price: 75, // Placeholder
    };

    return {
      id: booking.id,
      bookingReference: booking.bookingReference,
      sessionId: booking.sessionId,
      userId: booking.userId,
      numberOfAttendees: booking.numberOfAttendees,
      totalAmount: booking.totalAmount,
      specialRequirements: booking.specialRequirements || undefined,
      attendees: attendees.map(a => ({
        name: a.name,
        email: a.email,
        isPrimary: a.isPrimary || false,
      })),
      courseDetails,
    };
  }

  static async getBookingByReference(reference: string): Promise<BookingWithDetails | null> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingReference, reference));

    if (!booking) {
      return null;
    }

    return this.getBookingWithDetails(booking.id);
  }

  static async validateSession(sessionId: string, attendeeCount: number) {
    const [session] = await db
      .select()
      .from(courseSessions)
      .where(eq(courseSessions.id, sessionId));

    if (!session) {
      return {
        valid: false,
        message: 'Session not found',
      };
    }

    const remainingSpots = session.maxParticipants - session.currentBookings;
    
    if (remainingSpots < attendeeCount) {
      return {
        valid: false,
        message: `Only ${remainingSpots} spots available`,
        remainingSpots,
      };
    }

    return {
      valid: true,
      remainingSpots,
    };
  }

  private static async getCoursePrice(courseId: string): Promise<number> {
    // TODO: Implement when courses table is properly joined
    // For now, return fixed prices based on course type
    const prices: Record<string, number> = {
      'Emergency First Aid at Work': 75,
      'First Aid at Work': 200,
      'Paediatric First Aid': 120,
    };
    
    return 75; // Default EFAW price
  }
}