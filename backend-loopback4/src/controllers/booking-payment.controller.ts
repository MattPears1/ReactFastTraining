import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  RestBindings,
  Request,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {Booking} from '../models';
import {BookingRepository, CourseSessionRepository, UserRepository} from '../repositories';
import Stripe from 'stripe';

interface PaymentIntentRequest {
  courseSessionId: string;
  amount: number;
  bookingData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
    specialRequirements?: string;
  };
}

interface BookingConfirmationRequest {
  paymentIntentId: string;
  courseSessionId: string;
  bookingData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
    specialRequirements?: string;
  };
  totalAmount: number;
}

export class BookingPaymentController {
  private stripe: Stripe;

  constructor(
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @repository(CourseSessionRepository)
    public courseSessionRepository: CourseSessionRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  @post('/api/bookings/create-payment-intent')
  @response(200, {
    description: 'Create Stripe payment intent for booking',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {type: 'boolean'},
            paymentIntent: {
              type: 'object',
              properties: {
                id: {type: 'string'},
                client_secret: {type: 'string'},
                status: {type: 'string'},
                amount: {type: 'number'},
                currency: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  async createPaymentIntent(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['courseSessionId', 'amount', 'bookingData'],
            properties: {
              courseSessionId: {type: 'string'},
              amount: {type: 'number'},
              bookingData: {
                type: 'object',
                properties: {
                  firstName: {type: 'string'},
                  lastName: {type: 'string'},
                  email: {type: 'string'},
                  phone: {type: 'string'},
                  companyName: {type: 'string'},
                  specialRequirements: {type: 'string'},
                },
              },
            },
          },
        },
      },
    })
    request: PaymentIntentRequest,
  ): Promise<{success: boolean; paymentIntent: any}> {
    try {
      // Validate course session exists and has availability
      const courseSession = await this.courseSessionRepository.findById(
        request.courseSessionId,
        {include: [{relation: 'course'}]},
      );

      if (!courseSession) {
        throw new Error('Course session not found');
      }

      // Check availability
      const currentBookings = await this.bookingRepository.count({
        sessionId: request.courseSessionId,
        status: {inq: ['CONFIRMED', 'PENDING']},
      });

      if (currentBookings.count >= (courseSession.maxParticipants || 0)) {
        throw new Error('Course is fully booked');
      }

      // Create payment intent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount, // Amount in pence
        currency: 'gbp',
        metadata: {
          courseSessionId: request.courseSessionId.toString(),
          customerEmail: request.bookingData.email,
          customerName: `${request.bookingData.firstName} ${request.bookingData.lastName}`,
          companyName: request.bookingData.companyName || '',
        },
        receipt_email: request.bookingData.email,
        description: `Course booking for ${courseSession.course?.name || 'Training Course'}`,
      });

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      };
    } catch (error) {
      console.error('Payment intent creation error:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  @post('/api/bookings/confirm-with-payment')
  @response(200, {
    description: 'Confirm booking after successful payment',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {type: 'boolean'},
            booking: {type: 'object'},
            confirmationCode: {type: 'string'},
          },
        },
      },
    },
  })
  async confirmBookingWithPayment(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['paymentIntentId', 'courseSessionId', 'bookingData', 'totalAmount'],
            properties: {
              paymentIntentId: {type: 'string'},
              courseSessionId: {type: 'string'},
              totalAmount: {type: 'number'},
              bookingData: {
                type: 'object',
                properties: {
                  firstName: {type: 'string'},
                  lastName: {type: 'string'},
                  email: {type: 'string'},
                  phone: {type: 'string'},
                  companyName: {type: 'string'},
                  specialRequirements: {type: 'string'},
                },
              },
            },
          },
        },
      },
    })
    request: BookingConfirmationRequest,
  ): Promise<{success: boolean; booking: any; confirmationCode: string}> {
    try {
      // Verify payment with Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        request.paymentIntentId,
      );

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not completed');
      }

      // Get course session
      const courseSession = await this.courseSessionRepository.findById(
        request.courseSessionId,
        {include: [{relation: 'course'}]},
      );

      if (!courseSession) {
        throw new Error('Course session not found');
      }

      // Create or find user
      let user = await this.userRepository.findOne({
        where: {email: request.bookingData.email},
      });

      if (!user) {
        user = await this.userRepository.create({
          email: request.bookingData.email,
          firstName: request.bookingData.firstName,
          lastName: request.bookingData.lastName,
          phone: request.bookingData.phone,
          role: 'customer',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Generate booking reference
      const bookingReference = `RFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create booking
      const booking = await this.bookingRepository.create({
        sessionId: request.courseSessionId,
        bookingReference,
        type: 'INDIVIDUAL',
        contactDetails: {
          firstName: request.bookingData.firstName,
          lastName: request.bookingData.lastName,
          email: request.bookingData.email,
          phone: request.bookingData.phone,
          company: request.bookingData.companyName,
        },
        participants: [{
          firstName: request.bookingData.firstName,
          lastName: request.bookingData.lastName,
          email: request.bookingData.email,
          dateOfBirth: new Date(), // This should be collected from frontend
        }],
        numberOfParticipants: 1,
        totalAmount: request.totalAmount / 100,
        discountAmount: 0,
        finalAmount: request.totalAmount / 100,
        status: 'CONFIRMED',
        paymentMethod: 'CARD',
        paymentDate: new Date(),
        paymentReference: request.paymentIntentId,
        specialRequirements: request.bookingData.specialRequirements,
        confirmedTermsAndConditions: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // TODO: Send confirmation email
      // TODO: Update course schedule booking count

      return {
        success: true,
        booking: {
          id: booking.id,
          bookingReference: booking.bookingReference,
          status: booking.status,
          paymentStatus: 'paid',
          totalAmount: request.totalAmount / 100,
          courseSession: courseSession,
          customer: {
            firstName: request.bookingData.firstName,
            lastName: request.bookingData.lastName,
            email: request.bookingData.email,
            phone: request.bookingData.phone,
            companyName: request.bookingData.companyName,
          },
          createdAt: booking.createdAt,
        },
        confirmationCode: booking.bookingReference,
      };
    } catch (error) {
      console.error('Booking confirmation error:', error);
      throw new Error(`Failed to confirm booking: ${error.message}`);
    }
  }

  @get('/api/bookings/{id}')
  @response(200, {
    description: 'Get booking details',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {type: 'boolean'},
            booking: {type: 'object'},
          },
        },
      },
    },
  })
  async getBooking(
    @param.path.string('id') id: string,
  ): Promise<{success: boolean; booking: any}> {
    try {
      const booking = await this.bookingRepository.findById(id);

      return {
        success: true,
        booking,
      };
    } catch (error) {
      console.error('Get booking error:', error);
      throw new Error(`Failed to get booking: ${error.message}`);
    }
  }

  @get('/api/health')
  @response(200, {
    description: 'Health check endpoint',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            status: {type: 'string'},
            timestamp: {type: 'string'},
            database: {type: 'string'},
          },
        },
      },
    },
  })
  async healthCheck(): Promise<{status: string; timestamp: string; database: string}> {
    try {
      // Test database connection
      await this.bookingRepository.count();
      
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  }
}