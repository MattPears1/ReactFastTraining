import {
  post,
  get,
  requestBody,
  param,
  HttpErrors,
  RestBindings,
  Request,
  Response,
  oas,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { 
  StripeServiceEnhanced as StripeService, 
  PaymentError 
} from '../services/stripe.service.enhanced';
import { BookingService } from '../services/booking.service';
import { InvoiceService } from '../services/invoice.service';
import { db } from '../config/database.config';
import { payments, bookings, paymentLogs, users } from '../db/schema';
import { eq, and, desc, gte, lte, sql, or } from 'drizzle-orm';
import { rateLimit } from '../decorators/rate-limit.decorator';
import {
  CreatePaymentIntentSchema,
  ConfirmPaymentSchema,
  ListPaymentsSchema,
  PaymentValidationService
} from '../services/payment/payment-validation.service';
import { PaymentStatisticsService } from '../services/payment/payment-statistics.service';
import { PaymentActivityLoggerService } from '../services/payment/payment-activity-logger.service';
import {
  PaymentIntentResponse,
  PaymentConfirmationResponse,
  PaymentDetailsResponse,
  PaymentListResponse
} from '../types/payment.types';

// Enhanced Payment Controller
export class PaymentControllerEnhanced {
  constructor() {}

  @post('/api/payments/create-intent')
  @authenticate('jwt')
  @rateLimit(10, 60000) // 10 requests per minute
  @oas.response(200, {
    description: 'Payment intent created successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['clientSecret', 'paymentIntentId', 'amount', 'currency', 'bookingReference', 'status'],
          properties: {
            clientSecret: { type: 'string' },
            paymentIntentId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            bookingReference: { type: 'string' },
            status: { type: 'string' },
            requiresAction: { type: 'boolean' },
            actionUrl: { type: 'string' },
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
            required: ['bookingId'],
            properties: {
              bookingId: { type: 'string', format: 'uuid' },
              savePaymentMethod: { type: 'boolean' },
              returnUrl: { type: 'string', format: 'uri' },
            },
          },
        },
      },
    }) 
    body: any,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<PaymentIntentResponse> {
    // Validate request body
    const data = CreatePaymentIntentSchema.parse(body);
    
    // Start transaction
    return await db.transaction(async (tx) => {
      try {
        // Verify booking exists and belongs to user with lock
        const [booking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, data.bookingId))
          .for('update'); // Lock the row

        if (!booking) {
          throw new HttpErrors.NotFound('Booking not found');
        }

        if (booking.userId !== request.user?.id) {
          throw new HttpErrors.Forbidden('Access denied');
        }

        // Enhanced status validation
        const allowedStatuses = ['pending', 'payment_failed'];
        if (!allowedStatuses.includes(booking.status)) {
          throw new HttpErrors.BadRequest(
            `Cannot process payment for booking with status: ${booking.status}`
          );
        }

        // Check for existing successful payment
        const [existingPayment] = await tx
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.bookingId, data.bookingId),
              eq(payments.status, 'succeeded')
            )
          );

        if (existingPayment) {
          throw new HttpErrors.Conflict(
            'Payment already completed for this booking'
          );
        }

        // Get user details for enhanced payment data
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, request.user.id));

        // Create payment intent with enhanced data
        const { paymentIntent, paymentRecord, clientSecret } = await StripeService.createPaymentIntent({
          amount: parseFloat(booking.totalAmount),
          bookingId: booking.id,
          customerEmail: user.email,
          customerName: user.name || `${user.firstName} ${user.lastName}`,
          description: `${booking.courseType} - Session ${new Date(booking.sessionDate).toLocaleDateString()}`,
          statementDescriptor: 'REACT FAST TRAIN',
          setupFutureUsage: data.savePaymentMethod ? 'off_session' : undefined,
          metadata: {
            bookingReference: booking.bookingReference,
            userId: request.user.id,
            courseType: booking.courseType,
            sessionDate: booking.sessionDate,
            environment: process.env.NODE_ENV || 'development',
          },
        });

        // Update booking with payment intent ID
        await tx
          .update(bookings)
          .set({
            paymentIntentId: paymentIntent.id,
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));

        // Log payment intent creation
        await PaymentActivityLoggerService.logActivity(
          request,
          'payment_intent_created',
          {
            bookingId: booking.id,
            paymentIntentId: paymentIntent.id,
            amount: booking.totalAmount,
          }
        );

        return {
          clientSecret,
          paymentIntentId: paymentIntent.id,
          amount: parseFloat(booking.totalAmount),
          currency: 'GBP',
          bookingReference: booking.bookingReference,
          status: paymentIntent.status,
          requiresAction: paymentIntent.status === 'requires_action',
          actionUrl: data.returnUrl,
        };
      } catch (error) {
        // Log error
        await PaymentActivityLoggerService.logActivity(
          request,
          'payment_intent_failed',
          {
            bookingId: data.bookingId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );

        if (error instanceof HttpErrors.HttpError) {
          throw error;
        }
        if (error instanceof PaymentError) {
          throw new HttpErrors[error.statusCode === 400 ? 'BadRequest' : 'InternalServerError'](
            error.message
          );
        }
        throw new HttpErrors.InternalServerError('Payment initialization failed');
      }
    });
  }

  @post('/api/payments/confirm')
  @authenticate('jwt')
  @rateLimit(5, 60000) // 5 confirmations per minute
  async confirmPayment(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['paymentIntentId'],
            properties: {
              paymentIntentId: { type: 'string' },
              paymentMethodId: { type: 'string' },
            },
          },
        },
      },
    })
    body: any,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<PaymentConfirmationResponse> {
    // Validate request
    const data = ConfirmPaymentSchema.parse(body);

    try {
      // Verify payment belongs to user
      const [paymentRecord] = await db
        .select({
          payment: payments,
          booking: bookings,
        })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .where(eq(payments.stripePaymentIntentId, data.paymentIntentId));

      if (!paymentRecord) {
        throw new HttpErrors.NotFound('Payment not found');
      }

      if (paymentRecord.booking.userId !== request.user?.id) {
        throw new HttpErrors.Forbidden('Access denied');
      }

      // Confirm payment
      const result = await StripeService.confirmPayment(data.paymentIntentId);

      if (result.success && result.booking) {
        // Generate invoice
        let invoiceId: string | undefined;
        try {
          const invoice = await InvoiceService.createInvoice({
            bookingId: result.booking.id,
            paymentId: result.payment.id,
          });
          invoiceId = invoice.id;
        } catch (error) {
          console.error('Invoice generation failed:', error);
          // Don't fail the payment confirmation if invoice fails
        }

        // Send confirmation email
        try {
          await BookingService.sendConfirmationEmail(result.booking.id);
        } catch (error) {
          console.error('Email sending failed:', error);
          // Don't fail the payment confirmation if email fails
        }

        // Log successful confirmation
        await PaymentActivityLoggerService.logActivity(
          request,
          'payment_confirmed',
          {
            paymentId: result.payment.id,
            bookingId: result.booking.id,
            invoiceId,
          }
        );

        return {
          success: true,
          status: 'succeeded',
          bookingReference: result.booking.bookingReference,
          receiptUrl: result.payment.receiptUrl,
          invoiceId,
        };
      } else if (result.requiresAction) {
        return {
          success: false,
          status: 'requires_action',
          requiresAction: true,
          actionUrl: result.actionUrl,
        };
      } else {
        return {
          success: false,
          status: result.payment?.status || 'failed',
          error: result.error || 'Payment confirmation failed',
        };
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      
      // Log error
      await PaymentActivityLoggerService.logActivity(
        request,
        'payment_confirmation_failed',
        {
          paymentIntentId: data.paymentIntentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.InternalServerError('Payment confirmation failed');
    }
  }

  @post('/api/webhooks/stripe', {
    'x-parser': 'raw',
    security: [], // No authentication for webhooks
    responses: {
      '200': {
        description: 'Webhook processed successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                received: { type: 'boolean' },
                eventId: { type: 'string' },
                eventType: { type: 'string' },
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
  ): Promise<{ received: boolean; eventId?: string; eventType?: string }> {
    const signature = request.headers['stripe-signature'] as string;
    
    if (!signature) {
      throw new HttpErrors.BadRequest('Missing stripe-signature header');
    }

    // Verify webhook source IP (optional security measure)
    const allowedIPs = process.env.STRIPE_WEBHOOK_IPS?.split(',') || [];
    if (allowedIPs.length > 0) {
      const clientIP = PaymentValidationService.getClientIP(request);
      if (!allowedIPs.includes(clientIP)) {
        console.warn(`Webhook request from unauthorized IP: ${clientIP}`);
        throw new HttpErrors.Forbidden('Unauthorized webhook source');
      }
    }

    try {
      // Use raw body if available (from middleware), otherwise convert buffer
      const payload = request.rawBody || body.toString('utf8');
      
      // Handle webhook with enhanced data
      const result = await StripeService.handleWebhook(
        signature, 
        payload,
        {
          'stripe-signature': signature,
          'content-type': request.headers['content-type'] || '',
          'user-agent': request.headers['user-agent'] || '',
          'x-forwarded-for': request.headers['x-forwarded-for'] as string || '',
          'x-real-ip': request.headers['x-real-ip'] as string || '',
        }
      );

      return result;
    } catch (error) {
      console.error('Webhook processing error:', error);
      
      if (error instanceof PaymentError) {
        if (error.code === 'WEBHOOK_SIGNATURE_INVALID') {
          throw new HttpErrors.Unauthorized(error.message);
        }
        throw new HttpErrors.BadRequest(error.message);
      }
      
      // Return 200 to prevent Stripe retries for non-recoverable errors
      if (error instanceof Error && error.message.includes('already processed')) {
        return { received: true };
      }
      
      throw new HttpErrors.BadRequest('Webhook processing failed');
    }
  }

  @get('/api/payments/{paymentId}')
  @authenticate('jwt')
  async getPayment(
    @param.path.string('paymentId') paymentId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<PaymentDetailsResponse> {
    // Validate UUID format
    if (!PaymentValidationService.isValidUUID(paymentId)) {
      throw new HttpErrors.BadRequest('Invalid payment ID format');
    }

    const [result] = await db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(payments.id, paymentId));

    if (!result) {
      throw new HttpErrors.NotFound('Payment not found');
    }

    // Verify user owns this payment
    if (result.booking.userId !== request.user?.id && !request.user?.roles?.includes('admin')) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    // Calculate refunded amount
    const refundedAmount = await PaymentStatisticsService.getRefundedAmount(paymentId);
    const isRefundable = result.payment.status === 'succeeded' && 
                        parseFloat(result.payment.amount) > refundedAmount;

    return {
      id: result.payment.id,
      amount: result.payment.amount,
      currency: result.payment.currency,
      status: result.payment.status,
      paymentMethod: result.payment.paymentMethodType ? {
        type: result.payment.paymentMethodType,
        brand: result.payment.paymentMethodBrand,
        last4: result.payment.paymentMethodLast4,
      } : undefined,
      receiptUrl: result.payment.receiptUrl,
      refundable: isRefundable,
      refundedAmount: refundedAmount > 0 ? refundedAmount.toString() : undefined,
      createdAt: result.payment.createdAt.toISOString(),
      updatedAt: result.payment.updatedAt.toISOString(),
      booking: {
        id: result.booking.id,
        reference: result.booking.bookingReference,
        status: result.booking.status,
        courseType: result.booking.courseType,
        sessionDate: result.booking.sessionDate,
      },
      riskAssessment: (result.payment.riskLevel || result.payment.riskScore) ? {
        level: result.payment.riskLevel,
        score: result.payment.riskScore,
      } : undefined,
    };
  }

  @get('/api/payments/booking/{bookingId}')
  @authenticate('jwt')
  async getBookingPayment(
    @param.path.string('bookingId') bookingId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    // Validate UUID format
    if (!PaymentValidationService.isValidUUID(bookingId)) {
      throw new HttpErrors.BadRequest('Invalid booking ID format');
    }

    // Verify booking belongs to user
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      throw new HttpErrors.NotFound('Booking not found');
    }

    if (booking.userId !== request.user?.id && !request.user?.roles?.includes('admin')) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    // Get all payments for this booking (including failed attempts)
    const bookingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .orderBy(desc(payments.createdAt));

    if (bookingPayments.length === 0) {
      return {
        hasPayment: false,
        bookingReference: booking.bookingReference,
        bookingStatus: booking.status,
      };
    }

    // Find successful payment or latest attempt
    const successfulPayment = bookingPayments.find(p => p.status === 'succeeded');
    const latestPayment = bookingPayments[0];
    const paymentToShow = successfulPayment || latestPayment;

    // Get payment history
    const paymentHistory = bookingPayments.map(p => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      createdAt: p.createdAt.toISOString(),
      failureMessage: p.failureMessage,
    }));

    return {
      hasPayment: true,
      bookingReference: booking.bookingReference,
      bookingStatus: booking.status,
      payment: {
        id: paymentToShow.id,
        amount: paymentToShow.amount,
        status: paymentToShow.status,
        receiptUrl: paymentToShow.receiptUrl,
        createdAt: paymentToShow.createdAt.toISOString(),
        paymentMethod: paymentToShow.paymentMethodType ? {
          type: paymentToShow.paymentMethodType,
          brand: paymentToShow.paymentMethodBrand,
          last4: paymentToShow.paymentMethodLast4,
        } : undefined,
      },
      paymentAttempts: bookingPayments.length,
      paymentHistory: paymentHistory.length > 1 ? paymentHistory : undefined,
    };
  }

  @get('/api/payments')
  @authenticate('jwt')
  async getUserPayments(
    @param.query.number('limit') limit: number = 10,
    @param.query.number('offset') offset: number = 0,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    // Validate pagination
    const { limit: validatedLimit, offset: validatedOffset } = 
      PaymentValidationService.validatePagination(limit, offset);

    // Get user's payments
    const results = await db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.userId, request.user.id))
      .orderBy(desc(payments.createdAt))
      .limit(validatedLimit)
      .offset(validatedOffset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.userId, request.user.id));

    return {
      payments: results.map(r => ({
        id: r.payment.id,
        amount: r.payment.amount,
        currency: r.payment.currency,
        status: r.payment.status,
        bookingReference: r.booking.bookingReference,
        courseType: r.booking.courseType,
        sessionDate: r.booking.sessionDate,
        receiptUrl: r.payment.receiptUrl,
        createdAt: r.payment.createdAt.toISOString(),
      })),
      pagination: {
        total: Number(count),
        limit: validatedLimit,
        offset: validatedOffset,
        hasMore: validatedOffset + results.length < Number(count),
      },
    };
  }

  // Admin endpoints
  @get('/api/admin/payments')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async listPayments(
    @param.query.object('filters') filters: any = {}
  ): Promise<PaymentListResponse> {
    // Validate filters
    const validatedFilters = ListPaymentsSchema.parse(filters);

    // Build query
    let query = db
      .select({
        payment: payments,
        booking: bookings,
        user: users,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .$dynamic();

    // Apply filters
    const conditions = [];

    if (validatedFilters.status) {
      conditions.push(eq(payments.status, validatedFilters.status));
    }

    if (validatedFilters.startDate) {
      conditions.push(gte(payments.createdAt, new Date(validatedFilters.startDate)));
    }

    if (validatedFilters.endDate) {
      conditions.push(lte(payments.createdAt, new Date(validatedFilters.endDate)));
    }

    if (validatedFilters.bookingReference) {
      conditions.push(eq(bookings.bookingReference, validatedFilters.bookingReference));
    }

    if (validatedFilters.customerEmail) {
      conditions.push(eq(payments.customerEmail, validatedFilters.customerEmail));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute query with pagination
    const results = await query
      .orderBy(desc(payments.createdAt))
      .limit(validatedFilters.limit)
      .offset(validatedFilters.offset);

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .$dynamic();

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count }] = await countQuery;

    // Calculate statistics
    const stats = await PaymentStatisticsService.getPaymentStatistics(validatedFilters);

    return {
      payments: results.map(r => ({
        id: r.payment.id,
        amount: r.payment.amount,
        currency: r.payment.currency,
        status: r.payment.status,
        bookingReference: r.booking.bookingReference,
        courseType: r.booking.courseType,
        customerName: r.user.name || `${r.user.firstName} ${r.user.lastName}`,
        customerEmail: r.payment.customerEmail || r.user.email,
        paymentMethod: r.payment.paymentMethodType ? {
          type: r.payment.paymentMethodType,
          brand: r.payment.paymentMethodBrand,
          last4: r.payment.paymentMethodLast4,
        } : undefined,
        riskAssessment: (r.payment.riskLevel || r.payment.riskScore) ? {
          level: r.payment.riskLevel,
          score: r.payment.riskScore,
        } : undefined,
        createdAt: r.payment.createdAt.toISOString(),
        stripePaymentIntentId: r.payment.stripePaymentIntentId,
      })),
      pagination: {
        total: Number(count),
        limit: validatedFilters.limit,
        offset: validatedFilters.offset,
        hasMore: validatedFilters.offset + results.length < Number(count),
      },
      statistics: stats,
    };
  }

  @get('/api/admin/payments/{paymentId}/logs')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getPaymentLogs(
    @param.path.string('paymentId') paymentId: string
  ): Promise<any> {
    if (!PaymentValidationService.isValidUUID(paymentId)) {
      throw new HttpErrors.BadRequest('Invalid payment ID format');
    }

    const logs = await db
      .select()
      .from(paymentLogs)
      .where(eq(paymentLogs.paymentId, paymentId))
      .orderBy(desc(paymentLogs.createdAt));

    return {
      paymentId,
      logs: logs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        eventSource: log.eventSource,
        eventData: log.eventData,
        createdAt: log.createdAt.toISOString(),
        adminUserId: log.adminUserId,
      })),
      total: logs.length,
    };
  }

  @get('/api/admin/payments/metrics')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getPaymentMetrics(): Promise<any> {
    const metrics = StripeService.getMetrics();
    const todayStats = await PaymentStatisticsService.getTodayMetrics();

    return {
      stripe: metrics,
      today: todayStats,
      performance: {
        averageProcessingTime: metrics.averageProcessingTime,
        webhookSuccessRate: metrics.webhooksProcessed > 0
          ? ((metrics.webhooksProcessed / (metrics.webhooksProcessed + metrics.webhooksFailed)) * 100).toFixed(2)
          : 100,
      },
    };
  }
}