import {
  post,
  get,
  requestBody,
  param,
  HttpErrors,
  RestBindings,
  Request,
  Response,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { StripeService } from '../services/stripe.service';
import { BookingService } from '../services/booking.service';
import { db } from '../config/database.config';
import { payments, bookings } from '../db/schema';
import { eq } from 'drizzle-orm';

interface CreatePaymentIntentRequest {
  bookingId: string;
}

interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export class PaymentController {
  constructor() {}

  @post('/api/payments/create-intent')
  @authenticate('jwt')
  async createPaymentIntent(
    @requestBody() data: CreatePaymentIntentRequest,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<{
    clientSecret: string;
    amount: number;
    bookingReference: string;
  }> {
    try {
      // Verify booking exists and belongs to user
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, data.bookingId));

      if (!booking) {
        throw new HttpErrors.NotFound('Booking not found');
      }

      if (booking.userId !== request.user?.id) {
        throw new HttpErrors.Forbidden('Access denied');
      }

      if (booking.status !== 'pending') {
        throw new HttpErrors.BadRequest('Booking is not in pending status');
      }

      // Check if payment already exists
      const [existingPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.bookingId, data.bookingId));

      if (existingPayment && existingPayment.status === 'succeeded') {
        throw new HttpErrors.BadRequest('Payment already completed for this booking');
      }

      // Create payment intent
      const { paymentIntent } = await StripeService.createPaymentIntent({
        amount: parseFloat(booking.totalAmount),
        bookingId: booking.id,
        customerEmail: request.user.email,
        customerName: request.user.name,
        metadata: {
          bookingReference: booking.bookingReference,
          userId: request.user.id,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        amount: parseFloat(booking.totalAmount),
        bookingReference: booking.bookingReference,
      };
    } catch (error) {
      console.error('Payment intent creation error:', error);
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.InternalServerError('Payment initialization failed');
    }
  }

  @post('/api/payments/confirm')
  @authenticate('jwt')
  async confirmPayment(
    @requestBody() data: ConfirmPaymentRequest,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<{
    success: boolean;
    bookingReference?: string;
    receiptUrl?: string;
  }> {
    try {
      const result = await StripeService.confirmPayment(data.paymentIntentId);

      if (result.success && result.booking) {
        // Send confirmation email
        await BookingService.sendConfirmationEmail(result.booking.id);

        return {
          success: true,
          bookingReference: result.booking.bookingReference,
          receiptUrl: result.payment.receiptUrl,
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Payment confirmation error:', error);
      throw new HttpErrors.InternalServerError('Payment confirmation failed');
    }
  }

  @post('/api/webhooks/stripe', {
    'x-parser': 'raw', // Tell LoopBack to use raw body parser
    responses: {
      '200': {
        description: 'Webhook processed successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                received: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  async handleStripeWebhook(
    @requestBody() body: Buffer,
    @inject(RestBindings.Http.REQUEST) request: Request & { rawBody?: string }
  ): Promise<{ received: boolean }> {
    const signature = request.headers['stripe-signature'] as string;
    
    if (!signature) {
      throw new HttpErrors.BadRequest('Missing stripe-signature header');
    }

    try {
      // Use raw body if available (from middleware), otherwise convert buffer
      const payload = request.rawBody || body.toString('utf8');
      
      // Handle webhook
      return await StripeService.handleWebhook(signature, payload);
    } catch (error) {
      console.error('Webhook processing error:', error);
      if (error instanceof Error && error.message === 'Invalid webhook signature') {
        throw new HttpErrors.Unauthorized('Invalid webhook signature');
      }
      throw new HttpErrors.BadRequest('Webhook processing failed');
    }
  }

  @get('/api/payments/{paymentId}')
  @authenticate('jwt')
  async getPayment(
    @param.path.string('paymentId') paymentId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    const [payment] = await db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(payments.id, paymentId));

    if (!payment) {
      throw new HttpErrors.NotFound('Payment not found');
    }

    // Verify user owns this payment
    if (payment.booking.userId !== request.user?.id) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    return {
      id: payment.payment.id,
      amount: payment.payment.amount,
      currency: payment.payment.currency,
      status: payment.payment.status,
      receiptUrl: payment.payment.receiptUrl,
      createdAt: payment.payment.createdAt,
      booking: {
        reference: payment.booking.bookingReference,
        status: payment.booking.status,
      },
    };
  }

  @get('/api/payments/booking/{bookingId}')
  @authenticate('jwt')
  async getBookingPayment(
    @param.path.string('bookingId') bookingId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    // Verify booking belongs to user
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking || booking.userId !== request.user?.id) {
      throw new HttpErrors.NotFound('Booking not found');
    }

    // Get payment
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId));

    if (!payment) {
      return { hasPayment: false };
    }

    return {
      hasPayment: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        receiptUrl: payment.receiptUrl,
        createdAt: payment.createdAt,
      },
    };
  }

  // Admin endpoints
  @get('/api/admin/payments')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async listPayments(
    @param.query.number('limit') limit = 50,
    @param.query.number('offset') offset = 0,
    @param.query.string('status') status?: string
  ): Promise<any> {
    const query = db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .orderBy(payments.createdAt)
      .limit(limit)
      .offset(offset);

    if (status) {
      query.where(eq(payments.status, status));
    }

    const results = await query;

    return {
      payments: results.map(r => ({
        id: r.payment.id,
        amount: r.payment.amount,
        status: r.payment.status,
        bookingReference: r.booking.bookingReference,
        createdAt: r.payment.createdAt,
        stripePaymentIntentId: r.payment.stripePaymentIntentId,
      })),
      total: results.length,
      limit,
      offset,
    };
  }
}