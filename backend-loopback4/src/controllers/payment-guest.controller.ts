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
    console.log('=== PAYMENT GUEST CONTROLLER: Create Payment Intent ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    try {
      const {courseScheduleId, amount, bookingData} = body;
      console.log('Course Schedule ID:', courseScheduleId);
      console.log('Amount (pence):', amount);
      console.log('Amount (pounds):', amount / 100);
      console.log('Number of participants:', bookingData.numberOfParticipants);
      
      // Verify course session exists and has availability
      console.log('Looking up course session...');
      const courseSession = await this.courseSessionRepository.findById(courseScheduleId);
      console.log('Course session found:', !!courseSession);
      
      if (!courseSession) {
        console.error('Course session not found for ID:', courseScheduleId);
        throw new Error('Course session not found');
      }
      
      console.log('Course session details:', {
        name: courseSession.courseName,
        date: courseSession.sessionDate,
        availableSpots: courseSession.availableSpots,
        venue: courseSession.venue,
      });
      
      if (courseSession.availableSpots < bookingData.numberOfParticipants) {
        console.error('Not enough spots!', {
          available: courseSession.availableSpots,
          requested: bookingData.numberOfParticipants,
        });
        throw new Error('Not enough spots available');
      }

      // Create payment intent with Stripe
      console.log('Creating Stripe payment intent...');
      const stripeData = {
        amount: amount / 100, // Convert from pence to pounds
        bookingId: `temp-${Date.now()}`, // Temporary booking ID
        customerEmail: bookingData.email,
        customerName: `${bookingData.firstName} ${bookingData.lastName}`,
        metadata: {
          courseScheduleId: courseScheduleId.toString(),
          numberOfParticipants: bookingData.numberOfParticipants.toString(),
        },
      };
      console.log('Stripe data:', stripeData);
      
      const result = await StripeService.createPaymentIntent(stripeData);
      console.log('Stripe result received:', !!result);
      
      const paymentIntent = result.paymentIntent;
      console.log('Payment Intent ID:', paymentIntent.id);
      console.log('Client Secret exists:', !!paymentIntent.client_secret);

      const response = {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
      
      console.log('Returning response with client secret');
      return response;
    } catch (error) {
      console.error('=== ERROR CREATING PAYMENT INTENT ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
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
    console.log('=== PAYMENT GUEST CONTROLLER: Confirm Booking With Payment ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    try {
      const {paymentIntentId, bookingData} = body;
      console.log('Payment Intent ID:', paymentIntentId);
      console.log('Course Schedule ID:', bookingData.courseScheduleId);
      
      // Verify payment was successful
      console.log('Retrieving payment intent from Stripe...');
      const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId);
      console.log('Payment Intent Status:', paymentIntent.status);
      
      if (paymentIntent.status !== 'succeeded') {
        console.error('Payment not successful!', {
          status: paymentIntent.status,
          paymentIntentId,
        });
        return {
          success: false,
          error: 'Payment not successful'
        };
      }

      // Generate confirmation code
      const confirmationCode = this.generateConfirmationCode();
      console.log('Generated confirmation code:', confirmationCode);

      // Get course session details
      console.log('Looking up course session...');
      const courseSession = await this.courseSessionRepository.findById(bookingData.courseScheduleId);
      if (!courseSession) {
        console.error('Course session not found for ID:', bookingData.courseScheduleId);
        return {
          success: false,
          error: 'Course session not found'
        };
      }
      
      console.log('Course session found:', {
        name: courseSession.courseName,
        date: courseSession.sessionDate,
        availableSpots: courseSession.availableSpots,
      });

      // Create booking in database
      console.log('Creating booking in database...');
      const bookingRecord = {
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
      };
      console.log('Booking record:', bookingRecord);
      
      const booking = await this.bookingRepository.create(bookingRecord);
      console.log('Booking created with ID:', booking.id);

      // Update available spots
      console.log('Updating available spots...');
      const newAvailableSpots = courseSession.availableSpots - bookingData.numberOfParticipants;
      console.log('New available spots:', newAvailableSpots);
      
      await this.courseSessionRepository.updateById(courseSession.id, {
        availableSpots: newAvailableSpots,
      });

      // Send confirmation email
      console.log('Sending confirmation email...');
      const emailData = {
        to: bookingData.email,
        name: `${bookingData.firstName} ${bookingData.lastName}`,
        confirmationCode: confirmationCode,
        courseName: courseSession.courseName,
        sessionDate: courseSession.sessionDate,
        venue: courseSession.venue,
        venueName: courseSession.venueName || courseSession.venue,
        numberOfParticipants: bookingData.numberOfParticipants,
        totalAmount: bookingData.totalAmount,
      };
      console.log('Email data:', emailData);
      
      await this.emailService.sendBookingConfirmation(emailData);
      console.log('Confirmation email sent successfully');

      console.log('Booking confirmed successfully!');
      return {
        success: true,
        data: {
          booking: booking,
          confirmationCode: confirmationCode,
        }
      };
    } catch (error) {
      console.error('=== ERROR CONFIRMING PAYMENT ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
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