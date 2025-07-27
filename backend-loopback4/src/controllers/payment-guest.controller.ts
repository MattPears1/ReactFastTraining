import {
  post,
  requestBody,
  RestBindings,
  Request,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {BookingRepository, CourseSessionRepository} from '../repositories';
import {StripeService} from '../services/stripe.service';
import {EmailService} from '../services/email.service';
import {Booking} from '../models';
import * as crypto from 'crypto';

interface CreatePaymentIntentRequest {
  courseScheduleId: number;
  amount: number;
  bookingData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
    numberOfParticipants: number;
    participantDetails?: Array<{
      firstName: string;
      lastName: string;
      email?: string;
    }>;
    specialRequirements?: string;
    agreedToTerms: boolean;
  };
}

interface ConfirmBookingWithPaymentRequest {
  paymentIntentId: string;
  bookingData: CreatePaymentIntentRequest['bookingData'] & {
    courseScheduleId: number;
    totalAmount: number;
  };
}

export class PaymentGuestController {
  constructor(
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @repository(CourseSessionRepository)
    public courseSessionRepository: CourseSessionRepository,
    @inject('services.EmailService')
    public emailService: EmailService,
  ) {}

  @post('/api/bookings/create-payment-intent')
  async createPaymentIntent(
    @requestBody() body: CreatePaymentIntentRequest,
  ): Promise<{clientSecret: string; paymentIntentId: string}> {
    try {
      const {courseScheduleId, amount, bookingData} = body;
      
      // Verify course session exists and has availability
      const courseSession = await this.courseSessionRepository.findById(courseScheduleId);
      if (!courseSession) {
        throw new Error('Course session not found');
      }
      
      if (courseSession.availableSpots < bookingData.numberOfParticipants) {
        throw new Error('Not enough spots available');
      }

      // Create payment intent with Stripe
      const result = await StripeService.createPaymentIntent({
        amount: amount / 100, // Convert from pence to pounds
        bookingId: `temp-${Date.now()}`, // Temporary booking ID
        customerEmail: bookingData.email,
        customerName: `${bookingData.firstName} ${bookingData.lastName}`,
        metadata: {
          courseScheduleId: courseScheduleId.toString(),
          numberOfParticipants: bookingData.numberOfParticipants.toString(),
        },
      });
      
      const paymentIntent = result.paymentIntent;

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  @post('/api/bookings/confirm-payment')
  async confirmBookingWithPayment(
    @requestBody() body: ConfirmBookingWithPaymentRequest,
  ): Promise<{
    success: boolean;
    data?: {
      booking: Booking;
      confirmationCode: string;
    };
    error?: string;
  }> {
    try {
      const {paymentIntentId, bookingData} = body;
      
      // Verify payment was successful
      const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return {
          success: false,
          error: 'Payment not successful'
        };
      }

      // Generate confirmation code
      const confirmationCode = this.generateConfirmationCode();

      // Get course session details
      const courseSession = await this.courseSessionRepository.findById(bookingData.courseScheduleId);
      if (!courseSession) {
        return {
          success: false,
          error: 'Course session not found'
        };
      }

      // Create booking in database
      const booking = await this.bookingRepository.create({
        confirmationCode,
        courseSessionId: bookingData.courseScheduleId,
        courseName: courseSession.courseName,
        sessionDate: courseSession.sessionDate,
        venue: courseSession.venue,
        pricePerPerson: courseSession.pricePerPerson,
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        companyName: bookingData.companyName,
        numberOfParticipants: bookingData.numberOfParticipants,
        participantDetails: bookingData.participantDetails || [],
        specialRequirements: bookingData.specialRequirements,
        totalAmount: bookingData.totalAmount,
        paymentIntentId: paymentIntentId,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update available spots
      await this.courseSessionRepository.updateById(courseSession.id, {
        availableSpots: courseSession.availableSpots - bookingData.numberOfParticipants,
      });

      // Send confirmation email
      await this.emailService.sendBookingConfirmation({
        to: bookingData.email,
        name: `${bookingData.firstName} ${bookingData.lastName}`,
        confirmationCode: confirmationCode,
        courseName: courseSession.courseName,
        sessionDate: courseSession.sessionDate,
        venue: courseSession.venue,
        venueName: courseSession.venueName || courseSession.venue,
        numberOfParticipants: bookingData.numberOfParticipants,
        totalAmount: bookingData.totalAmount,
      });

      return {
        success: true,
        data: {
          booking: booking,
          confirmationCode: confirmationCode,
        }
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: 'Failed to confirm booking'
      };
    }
  }

  private generateConfirmationCode(): string {
    const prefix = 'RFT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}