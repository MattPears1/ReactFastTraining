import { injectable, inject } from '@loopback/core';
import { db } from '../db';
import { 
  bookings, 
  courseSchedules, 
  courses,
  users,
  adminAlerts,
  payments
} from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { HttpErrors } from '@loopback/rest';
import { UserManagementService } from './user-management.service';
import { BookingValidationService } from './booking-validation.service';
import { PaymentManagementService } from './payment-management.service';
import { EmailService } from './email.service';
import { WebSocketService } from './websocket.service';

export interface CreateBookingData {
  courseScheduleId: number;
  userId?: number;
  contactDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
  };
  participants: Array<{
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalConditions?: string;
    dietaryRequirements?: string;
  }>;
  numberOfParticipants: number;
  totalAmount: number;
  paymentMethod: string;
  stripePaymentIntentId?: string;
  specialRequirements?: string;
  confirmedTermsAndConditions: boolean;
}

export interface BookingResult {
  booking: any;
  user: any;
  payment?: any;
  validationWarnings: any[];
}

@injectable()
export class BookingServiceEnhanced {
  constructor(
    @inject('services.UserManagementService')
    private userManagementService: UserManagementService,
    @inject('services.BookingValidationService')
    private validationService: BookingValidationService,
    @inject('services.PaymentManagementService')
    private paymentService: PaymentManagementService,
    @inject('services.EmailService')
    private emailService: EmailService,
    @inject('services.WebSocketService')
    private websocketService: WebSocketService,
  ) {}

  /**
   * Create a booking with comprehensive validation
   */
  async createBooking(data: CreateBookingData): Promise<BookingResult> {
    const validationWarnings: any[] = [];

    try {
      // Use a transaction for the entire booking process
      return await db.transaction(async (tx) => {
        // Step 1: Validate the booking
        const validation = await this.validationService.validateBooking({
          courseScheduleId: data.courseScheduleId,
          numberOfParticipants: data.numberOfParticipants,
          totalAmount: data.totalAmount,
          email: data.contactDetails.email,
          userId: data.userId,
        });

        if (!validation.isValid) {
          throw new HttpErrors.BadRequest(
            'Booking validation failed',
            { errors: validation.errors }
          );
        }

        // Store warnings to return to client
        validationWarnings.push(...validation.warnings);

        // Step 2: Lock the session for update
        const [session] = await tx
          .select()
          .from(courseSchedules)
          .where(eq(courseSchedules.id, data.courseScheduleId))
          .for('update')
          .limit(1);

        if (!session) {
          throw new HttpErrors.NotFound('Course session not found');
        }

        // Double-check capacity with locked row
        const availableSpots = session.maxCapacity - session.currentCapacity;
        if (availableSpots < data.numberOfParticipants) {
          throw new HttpErrors.BadRequest(
            `Only ${availableSpots} spots available. The session filled up while you were booking.`
          );
        }

        // Step 3: Find or create user
        const user = await this.userManagementService.findOrCreateCustomer({
          email: data.contactDetails.email,
          name: `${data.contactDetails.firstName} ${data.contactDetails.lastName}`,
          phone: data.contactDetails.phone,
          company: data.contactDetails.company,
        });

        // Step 4: Generate booking reference
        const bookingReference = await this.generateBookingReference();

        // Step 5: Create the booking
        const [booking] = await tx.insert(bookings).values({
          bookingReference,
          courseScheduleId: data.courseScheduleId,
          userId: user.id,
          userEmail: data.contactDetails.email.toLowerCase(),
          contactDetails: data.contactDetails,
          participants: data.participants,
          numberOfParticipants: data.numberOfParticipants,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          stripePaymentIntentId: data.stripePaymentIntentId,
          specialRequirements: data.specialRequirements,
          status: 'pending',
          paymentStatus: 'pending',
          confirmedTermsAndConditions: data.confirmedTermsAndConditions,
          bookingType: data.numberOfParticipants > 1 ? 'group' : 'individual',
        }).returning();

        // Step 6: Create payment record if payment intent provided
        let payment;
        if (data.stripePaymentIntentId) {
          payment = await this.paymentService.createPayment({
            bookingId: booking.id,
            userId: user.id,
            amount: data.totalAmount,
            paymentMethod: data.paymentMethod,
            stripePaymentIntentId: data.stripePaymentIntentId,
            description: `Booking ${bookingReference}`,
          });
        }

        // Step 7: Update session capacity (will be done by trigger, but also do it here)
        await this.validationService.updateSessionCapacity(data.courseScheduleId);

        // Step 8: Check for suspicious patterns
        await this.checkBookingPatterns(booking, user);

        // Step 9: Send confirmation email (async, don't wait)
        this.sendBookingConfirmation(booking, session, user).catch(err => 
          console.error('Failed to send booking confirmation:', err)
        );

        return {
          booking,
          user,
          payment,
          validationWarnings
        };
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      
      // Create alert for booking failure
      if (error instanceof HttpErrors.BadRequest && error.message.includes('validation failed')) {
        await this.createBookingFailureAlert(data, error);
      }
      
      throw error;
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: number, 
    status: string,
    updateData?: any
  ): Promise<any> {
    try {
      const [existingBooking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!existingBooking) {
        throw new HttpErrors.NotFound('Booking not found');
      }

      // Update booking
      const [updatedBooking] = await db
        .update(bookings)
        .set({
          status,
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      // Update session capacity if status changed
      if (existingBooking.status !== status) {
        await this.validationService.updateSessionCapacity(existingBooking.courseScheduleId);
      }

      return updatedBooking;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    bookingId: number,
    reason: string,
    cancelledBy?: number
  ): Promise<any> {
    try {
      return await db.transaction(async (tx) => {
        // Get booking details
        const [booking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, bookingId))
          .limit(1);

        if (!booking) {
          throw new HttpErrors.NotFound('Booking not found');
        }

        if (booking.status === 'cancelled') {
          throw new HttpErrors.BadRequest('Booking is already cancelled');
        }

        // Update booking status
        const [updatedBooking] = await tx
          .update(bookings)
          .set({
            status: 'cancelled',
            paymentStatus: 'refund_pending',
            cancellationReason: reason,
            cancelledAt: new Date(),
            cancelledBy,
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, bookingId))
          .returning();

        // Update session capacity
        await this.validationService.updateSessionCapacity(booking.courseScheduleId);

        // Create refund if payment exists
        if (booking.paymentStatus === 'paid') {
          await this.paymentService.createRefund({
            bookingId: booking.id,
            userId: booking.userId,
            amount: booking.totalAmount,
            reason: 'customer_cancelled',
            reasonDetails: reason,
            requestedBy: cancelledBy || booking.userId,
          });
        }

        // Send cancellation email
        if (booking.userId) {
          this.sendCancellationConfirmation(booking).catch(err =>
            console.error('Failed to send cancellation email:', err)
          );
        }

        return updatedBooking;
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Check for suspicious booking patterns
   */
  private async checkBookingPatterns(booking: any, user: any): Promise<void> {
    try {
      // Check for multiple bookings in short time
      const recentBookings = await db
        .select()
        .from(bookings)
        .where(and(
          eq(bookings.userId, user.id),
          sql`${bookings.createdAt} > NOW() - INTERVAL '1 hour'`
        ));

      if (recentBookings.length > 3) {
        await db.insert(adminAlerts).values({
          alertType: 'suspicious_booking_pattern',
          severity: 'medium',
          title: 'Multiple Bookings Detected',
          description: `User ${user.email} has made ${recentBookings.length} bookings in the last hour`,
          metadata: {
            userId: user.id,
            email: user.email,
            bookingCount: recentBookings.length,
            latestBookingId: booking.id,
          },
        });
      }

      // Check for unusual payment amounts
      if (booking.numberOfParticipants > 10) {
        await db.insert(adminAlerts).values({
          alertType: 'large_group_booking',
          severity: 'low',
          title: 'Large Group Booking',
          description: `Booking ${booking.bookingReference} has ${booking.numberOfParticipants} participants`,
          metadata: {
            bookingId: booking.id,
            numberOfParticipants: booking.numberOfParticipants,
            totalAmount: booking.totalAmount,
          },
        });
      }
    } catch (error) {
      console.error('Error checking booking patterns:', error);
    }
  }

  /**
   * Create alert for booking failure
   */
  private async createBookingFailureAlert(data: CreateBookingData, error: any): Promise<void> {
    try {
      await db.insert(adminAlerts).values({
        alertType: 'booking_validation_failure',
        severity: 'low',
        title: 'Booking Validation Failed',
        description: `Booking attempt failed for ${data.contactDetails.email}`,
        metadata: {
          email: data.contactDetails.email,
          sessionId: data.courseScheduleId,
          errors: error.details?.errors || [],
          attemptTime: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('Error creating booking failure alert:', err);
    }
  }

  /**
   * Send booking confirmation email
   */
  private async sendBookingConfirmation(booking: any, session: any, user: any): Promise<void> {
    try {
      // Get course details
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, session.courseId))
        .limit(1);

      await this.emailService.sendBookingConfirmation({
        to: user.email,
        booking: {
          reference: booking.bookingReference,
          courseName: course?.name || 'Course',
          sessionDate: session.startDatetime,
          participants: booking.participants,
          totalAmount: booking.totalAmount,
        },
      });
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      throw error;
    }
  }

  /**
   * Send cancellation confirmation email
   */
  private async sendCancellationConfirmation(booking: any): Promise<void> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

      if (user) {
        await this.emailService.sendCancellationConfirmation({
          to: user.email,
          booking: {
            reference: booking.bookingReference,
            cancellationReason: booking.cancellationReason,
          },
        });
      }
    } catch (error) {
      console.error('Error sending cancellation confirmation:', error);
    }
  }

  /**
   * Generate unique booking reference
   */
  private async generateBookingReference(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RFT${year}${month}${day}${random}`;
  }

  /**
   * Get available sessions with real-time capacity
   */
  async getAvailableSessions(courseId?: number): Promise<any[]> {
    try {
      const query = db
        .select({
          id: courseSchedules.id,
          courseId: courseSchedules.courseId,
          courseName: courses.name,
          price: courses.price,
          startDatetime: courseSchedules.startDatetime,
          endDatetime: courseSchedules.endDatetime,
          venueId: courseSchedules.venueId,
          maxCapacity: courseSchedules.maxCapacity,
          currentCapacity: courseSchedules.currentCapacity,
          availableSpots: sql`${courseSchedules.maxCapacity} - ${courseSchedules.currentCapacity}`,
          status: courseSchedules.status,
          isFull: sql`CASE WHEN ${courseSchedules.currentCapacity} >= ${courseSchedules.maxCapacity} THEN true ELSE false END`,
        })
        .from(courseSchedules)
        .innerJoin(courses, eq(courseSchedules.courseId, courses.id))
        .where(and(
          courseId ? eq(courseSchedules.courseId, courseId) : undefined,
          eq(courseSchedules.status, 'published'),
          sql`${courseSchedules.startDatetime} > NOW()`,
          sql`${courseSchedules.currentCapacity} < ${courseSchedules.maxCapacity}`
        ))
        .orderBy(courseSchedules.startDatetime);

      return await query;
    } catch (error) {
      console.error('Error getting available sessions:', error);
      throw error;
    }
  }
}