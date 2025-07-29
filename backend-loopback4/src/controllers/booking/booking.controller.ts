import { post, get, requestBody, param, HttpErrors } from '@loopback/rest';
import { authenticate } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { SecurityBindings, UserProfile } from '@loopback/security';
import { BookingService } from '../../services/booking/booking.service';
import { PaymentService } from '../../services/payment.service';
import { SpecialRequirementsService } from '../../services/special-requirements.service';
import { db } from '../../config/database.config';
import { bookings, courseSessions } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

interface CreateBookingRequest {
  sessionId: string;
  attendees: Array<{ name: string; email: string; isPrimary?: boolean }>;
  specialRequirements?: string;
  termsAccepted: boolean;
}

interface ValidateSessionRequest {
  sessionId: string;
  attendeeCount: number;
}

interface ConfirmBookingRequest {
  bookingId: string;
  paymentIntentId: string;
}

export class BookingController {
  constructor() {}

  @post('/api/bookings/validate-session', {
    responses: {
      '200': {
        description: 'Validate session availability',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                valid: {type: 'boolean'},
                message: {type: 'string'},
                remainingSpots: {type: 'number'},
              },
            },
          },
        },
      },
    },
  })
  async validateSession(
    @requestBody() data: ValidateSessionRequest,
  ) {
    return await BookingService.validateSession(data.sessionId, data.attendeeCount);
  }

  @post('/api/bookings/create', {
    responses: {
      '200': {
        description: 'Create a new booking',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                bookingId: {type: 'string'},
                bookingReference: {type: 'string'},
                clientSecret: {type: 'string'},
                amount: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async createBooking(
    @requestBody() bookingData: CreateBookingRequest,
    @inject(SecurityBindings.USER) user: UserProfile,
  ) {
    try {
      // Create booking
      const booking = await BookingService.createBooking({
        ...bookingData,
        userId: user.id,
      });

      // Create payment intent
      const paymentIntent = await PaymentService.createPaymentIntent({
        amount: parseFloat(booking.totalAmount),
        bookingId: booking.id,
        customerEmail: user.email || '',
        metadata: {
          bookingReference: booking.bookingReference,
          userId: user.id,
        },
      });

      return {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        clientSecret: paymentIntent.client_secret,
        amount: booking.totalAmount,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpErrors.BadRequest(error.message);
      }
      throw error;
    }
  }

  @post('/api/bookings/confirm', {
    responses: {
      '200': {
        description: 'Confirm a booking after payment',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {type: 'boolean'},
                message: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  async confirmBooking(
    @requestBody() data: ConfirmBookingRequest,
  ) {
    try {
      // Verify payment with Stripe
      const paymentVerified = await PaymentService.verifyPaymentIntent(data.paymentIntentId);
      
      if (!paymentVerified) {
        throw new HttpErrors.BadRequest('Payment verification failed');
      }

      // Confirm booking
      await BookingService.confirmBooking(data.bookingId, data.paymentIntentId);
      
      return { 
        success: true,
        message: 'Booking confirmed successfully'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpErrors.BadRequest(error.message);
      }
      throw error;
    }
  }

  @get('/api/bookings/reference/{reference}')
  async getBookingByReference(
    @param.path.string('reference') reference: string
  ): Promise<any> {
    const booking = await BookingService.getBookingByReference(reference);
    
    if (!booking) {
      throw new HttpErrors.NotFound('Booking not found');
    }

    return booking;
  }

  @get('/api/bookings/{bookingId}/download-pdf')
  @authenticate('jwt')
  async downloadPDF(
    @param.path.string('bookingId') bookingId: string,
    @inject(SecurityBindings.USER) user: UserProfile
  ) {
    // Verify user owns this booking
    const booking = await BookingService.getBookingWithDetails(bookingId);
    
    if (booking.userId !== user.id) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    // Generate PDF
    const pdfBuffer = await PaymentService.generateBookingPDF(booking);
    
    return {
      content: pdfBuffer.toString('base64'),
      contentType: 'application/pdf',
      filename: `booking-${booking.bookingReference}.pdf`,
    };
  }

  @get('/api/bookings/{bookingId}/download-ics')
  @authenticate('jwt')
  async downloadCalendar(
    @param.path.string('bookingId') bookingId: string,
    @inject(SecurityBindings.USER) user: UserProfile
  ) {
    // Verify user owns this booking
    const booking = await BookingService.getBookingWithDetails(bookingId);
    
    if (booking.userId !== user.id) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    // Generate ICS
    const icsContent = await PaymentService.generateCalendarFile(booking);
    
    return {
      content: icsContent,
      contentType: 'text/calendar',
      filename: 'course-booking.ics',
    };
  }

  @post('/api/bookings/{bookingId}/cancel')
  @authenticate('jwt')
  async cancelBooking(
    @param.path.string('bookingId') bookingId: string,
    @inject(SecurityBindings.USER) user: UserProfile
  ) {
    // Verify user owns this booking
    const booking = await BookingService.getBookingWithDetails(bookingId);
    
    if (booking.userId !== user.id) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    // Check cancellation policy
    const session = await db.select().from(courseSessions).where(eq(courseSessions.id, booking.sessionId));
    const hoursUntilStart = (new Date(session[0].sessionDate).getTime() - Date.now()) / (1000 * 60 * 60);
    
    if (hoursUntilStart < 48) {
      throw new HttpErrors.BadRequest('Cannot cancel within 48 hours of course start');
    }

    // Cancel booking
    await BookingService.cancelBooking(bookingId);

    // Process refund if payment was made
    if (booking.paymentIntentId) {
      await PaymentService.refundPayment(booking.paymentIntentId);
    }

    return {
      success: true,
      message: 'Booking cancelled successfully',
    };
  }

  @get('/api/bookings/user/current')
  @authenticate('jwt')
  async getUserBookings(
    @inject(SecurityBindings.USER) user: UserProfile
  ) {
    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, user.id))
      .orderBy(desc(bookings.createdAt));

    return userBookings;
  }
}