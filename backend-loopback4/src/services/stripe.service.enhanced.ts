import Stripe from 'stripe';
import { db } from '../config/database.config';
import { 
  payments, 
  bookings, 
  webhookEvents,
  PaymentEventType,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { PaymentError, StripeErrorService } from './stripe/stripe-error.service';
import { StripeValidationService, CreatePaymentIntentData } from './stripe/stripe-validation.service';
import { StripeRetryService } from './stripe/stripe-retry.service';
import { StripeMetricsService } from './stripe/stripe-metrics.service';
import { StripePaymentLoggerService } from './stripe/stripe-payment-logger.service';
import { StripeWebhookHandlersService } from './stripe/stripe-webhook-handlers.service';

interface PaymentUpdateData {
  status: string;
  stripeChargeId?: string;
  receiptUrl?: string;
  paymentMethodType?: string;
  paymentMethodLast4?: string;
  paymentMethodBrand?: string;
  failureCode?: string;
  failureMessage?: string;
  riskLevel?: string;
  riskScore?: number;
}

export class StripeServiceEnhanced {
  private static stripe: Stripe;
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      typescript: true,
      maxNetworkRetries: 2,
      timeout: 30000, // 30 seconds
      telemetry: false, // Disable telemetry for privacy
    });

    this.initialized = true;
    console.log('Stripe service initialized successfully');
  }

  // Enhanced payment intent creation with better validation and error handling
  static async createPaymentIntent(data: CreatePaymentIntentData): Promise<{
    paymentIntent: Stripe.PaymentIntent;
    paymentRecord: any;
    clientSecret: string;
  }> {
    this.initialize();
    const startTime = Date.now();

    // Validate input data
    StripeValidationService.validatePaymentData(data);

    // Generate idempotency key with booking ID and timestamp
    const idempotencyKey = StripeValidationService.generateIdempotencyKey(data.bookingId);

    try {
      // Check for existing payment for this booking
      const existingPayment = await this.checkExistingPayment(data.bookingId);
      if (existingPayment) {
        throw new PaymentError(
          'A payment already exists for this booking',
          'DUPLICATE_PAYMENT',
          409,
          { bookingId: data.bookingId, paymentId: existingPayment.id }
        );
      }

      // Convert pounds to pence with proper rounding
      const amountInPence = StripeValidationService.convertToPence(data.amount);

      // Prepare payment intent data with enhanced options
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInPence,
        currency: 'gbp',
        payment_method_types: ['card'],
        capture_method: 'automatic',
        receipt_email: data.customerEmail,
        description: data.description || `React Fast Training - Course Booking #${data.bookingId}`,
        statement_descriptor: StripeValidationService.sanitizeStatementDescriptor(
          data.statementDescriptor || 'REACT FAST TRAIN'
        ),
        metadata: {
          bookingId: data.bookingId,
          customerEmail: data.customerEmail,
          customerName: data.customerName || '',
          environment: process.env.NODE_ENV || 'development',
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: false, // Disable to show only card payments
        },
      };

      // Add setup for future usage if requested
      if (data.setupFutureUsage) {
        paymentIntentData.setup_future_usage = data.setupFutureUsage;
      }

      // Create payment intent with retry logic
      const paymentIntent = await StripeRetryService.retryOperation(
        () => this.stripe.paymentIntents.create(paymentIntentData, { idempotencyKey }),
        'createPaymentIntent'
      );

      // Store payment record in database with enhanced data
      const [paymentRecord] = await db.insert(payments).values({
        bookingId: data.bookingId,
        stripePaymentIntentId: paymentIntent.id,
        amount: data.amount.toString(),
        currency: 'GBP',
        status: paymentIntent.status,
        idempotencyKey,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        description: paymentIntentData.description,
        metadata: {
          ...paymentIntent.metadata,
          createdAt: new Date().toISOString(),
        },
      }).returning();

      // Log payment creation with performance metrics
      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id, 
        PaymentEventType.CREATED, 
        {
          paymentIntentId: paymentIntent.id,
          amount: data.amount,
          bookingId: data.bookingId,
          processingTime: Date.now() - startTime,
        }
      );

      // Update metrics
      StripeMetricsService.incrementPaymentIntentsCreated();
      StripeMetricsService.updateAverageProcessingTime(Date.now() - startTime);

      return { 
        paymentIntent, 
        paymentRecord,
        clientSecret: paymentIntent.client_secret!
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      
      // Log the error with detailed context
      await StripePaymentLoggerService.logPaymentEvent(
        null, 
        PaymentEventType.FAILED, 
        {
          error: StripeErrorService.formatError(error),
          bookingId: data.bookingId,
          amount: data.amount,
          processingTime: Date.now() - startTime,
        }
      );

      // Update failure metrics
      StripeMetricsService.incrementPaymentIntentsFailed();

      // Re-throw with appropriate error type
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(
        'Payment processing failed. Please try again.',
        'PAYMENT_CREATION_FAILED',
        500,
        { originalError: StripeErrorService.formatError(error) }
      );
    }
  }

  // Enhanced payment confirmation with better status handling
  static async confirmPayment(paymentIntentId: string): Promise<{
    success: boolean;
    payment?: any;
    booking?: any;
    requiresAction?: boolean;
    actionUrl?: string;
  }> {
    this.initialize();
    const startTime = Date.now();

    try {
      // Retrieve payment intent with expanded data
      const paymentIntent = await StripeRetryService.retryOperation(
        () => this.stripe.paymentIntents.retrieve(
          paymentIntentId,
          { 
            expand: ['payment_method', 'latest_charge', 'latest_charge.outcome'] 
          }
        ),
        'retrievePaymentIntent'
      );

      // Find payment record
      const [paymentRecord] = await db
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, paymentIntentId));

      if (!paymentRecord) {
        throw new PaymentError(
          'Payment record not found',
          'PAYMENT_NOT_FOUND',
          404
        );
      }

      // Prepare update data based on payment intent status
      const updateData = await this.preparePaymentUpdateData(paymentIntent);

      // Update payment record
      await db
        .update(payments)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentRecord.id));

      // Handle different payment statuses
      switch (paymentIntent.status) {
        case 'succeeded':
          return await this.handleSuccessfulPayment(paymentRecord, paymentIntent, startTime);
        
        case 'requires_action':
        case 'requires_source_action':
          return await this.handlePaymentRequiresAction(paymentRecord, paymentIntent);
        
        case 'processing':
          return await this.handleProcessingPayment(paymentRecord);
        
        case 'requires_payment_method':
        case 'requires_confirmation':
          return await this.handleIncompletePayment(paymentRecord, paymentIntent);
        
        default:
          return await this.handleFailedPayment(paymentRecord, paymentIntent);
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      
      await StripePaymentLoggerService.logPaymentEvent(
        null, 
        PaymentEventType.FAILED, 
        {
          error: StripeErrorService.formatError(error),
          paymentIntentId,
          processingTime: Date.now() - startTime,
        }
      );

      throw error instanceof PaymentError ? error : new PaymentError(
        'Failed to confirm payment',
        'CONFIRMATION_FAILED',
        500
      );
    }
  }

  // Enhanced webhook handling with better security and retry logic
  static async handleWebhook(
    signature: string, 
    payload: string,
    headers?: Record<string, string>
  ): Promise<{ 
    received: boolean;
    eventId?: string;
    eventType?: string;
  }> {
    this.initialize();
    const startTime = Date.now();

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new PaymentError(
        'Webhook secret not configured',
        'WEBHOOK_CONFIG_ERROR',
        500
      );
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature with enhanced security
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      
      await StripePaymentLoggerService.logPaymentEvent(
        null, 
        PaymentEventType.WEBHOOK_FAILED, 
        {
          error: 'Invalid webhook signature',
          headers: StripeValidationService.sanitizeHeaders(headers),
        }
      );

      throw new PaymentError(
        'Invalid webhook signature',
        'WEBHOOK_SIGNATURE_INVALID',
        401
      );
    }

    // Implement deduplication
    const isDuplicate = await this.checkDuplicateWebhook(event.id);
    if (isDuplicate) {
      console.log(`Webhook event ${event.id} already processed`);
      return { 
        received: true, 
        eventId: event.id,
        eventType: event.type 
      };
    }

    // Store webhook event with enhanced tracking
    const [webhookRecord] = await db
      .insert(webhookEvents)
      .values({
        stripeEventId: event.id,
        eventType: event.type,
        eventData: event.data.object as any,
        headers: StripeValidationService.sanitizeHeaders(headers),
        signatureVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!webhookRecord) {
      // Event already exists (race condition)
      return { 
        received: true,
        eventId: event.id,
        eventType: event.type
      };
    }

    try {
      // Process the event with timeout
      await this.processWebhookEventWithTimeout(event, 25000); // 25 second timeout

      // Mark as processed with metrics
      await db
        .update(webhookEvents)
        .set({
          processed: true,
          processedAt: new Date(),
          processingDurationMs: Date.now() - startTime,
        })
        .where(eq(webhookEvents.id, webhookRecord.id));

      // Log successful processing
      await StripePaymentLoggerService.logPaymentEvent(
        null, 
        PaymentEventType.WEBHOOK_PROCESSED, 
        {
          eventId: event.id,
          eventType: event.type,
          processingTime: Date.now() - startTime,
        }
      );

      // Update metrics
      StripeMetricsService.incrementWebhooksProcessed();

    } catch (error) {
      // Enhanced error handling with retry scheduling
      const retryCount = webhookRecord.retryCount + 1;
      const nextRetryAt = StripeRetryService.calculateNextRetryTime(retryCount);

      await db
        .update(webhookEvents)
        .set({
          errorMessage: StripeErrorService.formatError(error),
          retryCount,
          nextRetryAt,
          processingDurationMs: Date.now() - startTime,
        })
        .where(eq(webhookEvents.id, webhookRecord.id));

      // Update failure metrics
      StripeMetricsService.incrementWebhooksFailed();

      // Re-throw for Stripe retry
      throw error;
    }

    return { 
      received: true,
      eventId: event.id,
      eventType: event.type
    };
  }

  // Process webhook event with timeout protection
  private static async processWebhookEventWithTimeout(
    event: Stripe.Event, 
    timeoutMs: number
  ): Promise<void> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Webhook processing timeout')), timeoutMs);
    });

    const processingPromise = this.processWebhookEvent(event);

    await Promise.race([processingPromise, timeoutPromise]);
  }

  // Enhanced webhook event processing with more event types
  private static async processWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      // Payment intent events
      case 'payment_intent.succeeded':
        await StripeWebhookHandlersService.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await StripeWebhookHandlersService.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.processing':
        await StripeWebhookHandlersService.handlePaymentProcessing(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await StripeWebhookHandlersService.handlePaymentActionRequired(event.data.object as Stripe.PaymentIntent);
        break;

      // Charge events
      case 'charge.succeeded':
        await StripeWebhookHandlersService.handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.failed':
        await StripeWebhookHandlersService.handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await StripeWebhookHandlersService.handleDispute(event.data.object as Stripe.Dispute);
        break;

      case 'charge.refunded':
        await StripeWebhookHandlersService.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.refund.updated':
        await StripeWebhookHandlersService.handleRefundUpdated(event.data.object as Stripe.Refund);
        break;

      // Payment method events
      case 'payment_method.attached':
        await StripeWebhookHandlersService.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await StripeWebhookHandlersService.handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      // Customer events
      case 'customer.created':
      case 'customer.updated':
        await StripeWebhookHandlersService.handleCustomerEvent(event.data.object as Stripe.Customer);
        break;

      // Radar events
      case 'radar.early_fraud_warning.created':
        await StripeWebhookHandlersService.handleFraudWarning(event.data.object as any);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  // Helper methods

  private static async checkExistingPayment(bookingId: string): Promise<any> {
    const [existing] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.bookingId, bookingId),
          eq(payments.status, 'succeeded')
        )
      );
    
    return existing;
  }

  private static async preparePaymentUpdateData(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<PaymentUpdateData> {
    const updateData: PaymentUpdateData = {
      status: paymentIntent.status,
    };

    const charge = paymentIntent.latest_charge as Stripe.Charge;
    const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;

    if (charge) {
      updateData.stripeChargeId = charge.id;
      updateData.receiptUrl = charge.receipt_url || undefined;
      
      // Extract risk assessment data
      if (charge.outcome) {
        updateData.riskLevel = charge.outcome.risk_level || undefined;
        updateData.riskScore = charge.outcome.risk_score || undefined;
      }
    }

    if (paymentMethod?.card) {
      updateData.paymentMethodType = 'card';
      updateData.paymentMethodLast4 = paymentMethod.card.last4;
      updateData.paymentMethodBrand = paymentMethod.card.brand;
    }

    if (paymentIntent.last_payment_error) {
      updateData.failureCode = paymentIntent.last_payment_error.code || undefined;
      updateData.failureMessage = paymentIntent.last_payment_error.message || undefined;
    }

    return updateData;
  }

  private static async handleSuccessfulPayment(
    paymentRecord: any,
    paymentIntent: Stripe.PaymentIntent,
    startTime: number
  ): Promise<any> {
    // Update booking status to confirmed
    await db
      .update(bookings)
      .set({
        status: 'confirmed',
        paymentIntentId: paymentIntent.id,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, paymentRecord.bookingId));

    // Log success with detailed metrics
    await StripePaymentLoggerService.logPaymentEvent(
      paymentRecord.id, 
      PaymentEventType.SUCCEEDED, 
      {
        chargeId: (paymentIntent.latest_charge as Stripe.Charge)?.id,
        receiptUrl: (paymentIntent.latest_charge as Stripe.Charge)?.receipt_url,
        processingTime: Date.now() - startTime,
        paymentMethodType: (paymentIntent.payment_method as Stripe.PaymentMethod)?.type,
      }
    );

    // Get updated booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, paymentRecord.bookingId));

    // Update success metrics
    StripeMetricsService.incrementPaymentIntentsSucceeded();
    StripeMetricsService.updateAverageProcessingTime(Date.now() - startTime);

    return { 
      success: true, 
      payment: paymentRecord, 
      booking 
    };
  }

  private static async handlePaymentRequiresAction(
    paymentRecord: any,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<any> {
    await StripePaymentLoggerService.logPaymentEvent(
      paymentRecord.id, 
      PaymentEventType.REQUIRES_ACTION, 
      {
        actionType: paymentIntent.next_action?.type,
      }
    );

    return {
      success: false,
      payment: paymentRecord,
      requiresAction: true,
      actionUrl: paymentIntent.next_action?.redirect_to_url?.url,
    };
  }

  private static async handleProcessingPayment(paymentRecord: any): Promise<any> {
    await StripePaymentLoggerService.logPaymentEvent(
      paymentRecord.id, 
      PaymentEventType.PROCESSING, 
      {
        status: 'processing',
      }
    );

    return {
      success: false,
      payment: paymentRecord,
      processing: true,
    };
  }

  private static async handleIncompletePayment(
    paymentRecord: any,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<any> {
    await StripePaymentLoggerService.logPaymentEvent(
      paymentRecord.id, 
      PaymentEventType.INCOMPLETE, 
      {
        status: paymentIntent.status,
        reason: paymentIntent.last_payment_error?.message,
      }
    );

    return {
      success: false,
      payment: paymentRecord,
      incomplete: true,
    };
  }

  private static async handleFailedPayment(
    paymentRecord: any,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<any> {
    await StripePaymentLoggerService.logPaymentEvent(
      paymentRecord.id, 
      PaymentEventType.FAILED, 
      {
        status: paymentIntent.status,
        error: paymentIntent.last_payment_error,
      }
    );

    // Update failure metrics
    StripeMetricsService.incrementPaymentIntentsFailed();

    return {
      success: false,
      payment: paymentRecord,
      error: paymentIntent.last_payment_error?.message,
    };
  }

  private static async checkDuplicateWebhook(eventId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.stripeEventId, eventId),
          eq(webhookEvents.processed, true)
        )
      );
    
    return !!existing;
  }

  // Enhanced refund creation with better validation
  static async createRefund(data: {
    paymentIntentId: string;
    amount?: number; // In pounds, if not provided, full refund
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
    refundApplicationFee?: boolean;
    reverseTransfer?: boolean;
  }): Promise<Stripe.Refund> {
    this.initialize();

    try {
      // Validate the payment intent exists and is refundable
      const paymentIntent = await this.stripe.paymentIntents.retrieve(data.paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new PaymentError(
          'Payment must be successful to refund',
          'PAYMENT_NOT_REFUNDABLE',
          400
        );
      }

      const refundData: Stripe.RefundCreateParams = {
        payment_intent: data.paymentIntentId,
        reason: data.reason || 'requested_by_customer',
        metadata: {
          ...data.metadata,
          refundedAt: new Date().toISOString(),
        },
      };

      // If amount specified, validate and convert to pence
      if (data.amount !== undefined) {
        if (data.amount <= 0) {
          throw new PaymentError('Refund amount must be positive', 'INVALID_REFUND_AMOUNT', 400);
        }
        
        const amountInPence = StripeValidationService.convertToPence(data.amount);
        if (amountInPence > paymentIntent.amount) {
          throw new PaymentError(
            'Refund amount exceeds payment amount',
            'REFUND_EXCEEDS_PAYMENT',
            400
          );
        }
        
        refundData.amount = amountInPence;
      }

      if (data.refundApplicationFee !== undefined) {
        refundData.refund_application_fee = data.refundApplicationFee;
      }

      if (data.reverseTransfer !== undefined) {
        refundData.reverse_transfer = data.reverseTransfer;
      }

      // Create refund with retry logic
      const refund = await StripeRetryService.retryOperation(
        () => this.stripe.refunds.create(refundData),
        'createRefund'
      );

      return refund;
    } catch (error) {
      console.error('Stripe refund creation failed:', error);
      
      if (error instanceof PaymentError) {
        throw error;
      }
      
      throw new PaymentError(
        'Refund processing failed',
        'REFUND_FAILED',
        500,
        { originalError: StripeErrorService.formatError(error) }
      );
    }
  }

  // Retrieve payment intent with caching
  static async retrievePaymentIntent(
    paymentIntentId: string,
    options?: { expand?: string[] }
  ): Promise<Stripe.PaymentIntent> {
    this.initialize();
    
    return await StripeRetryService.retryOperation(
      () => this.stripe.paymentIntents.retrieve(paymentIntentId, options),
      'retrievePaymentIntent'
    );
  }

  // Retrieve charge with caching
  static async retrieveCharge(
    chargeId: string,
    options?: { expand?: string[] }
  ): Promise<Stripe.Charge> {
    this.initialize();
    
    return await StripeRetryService.retryOperation(
      () => this.stripe.charges.retrieve(chargeId, options),
      'retrieveCharge'
    );
  }

  // Get service metrics
  static getMetrics() {
    return StripeMetricsService.getMetrics();
  }

  // Reset metrics (for testing)
  static resetMetrics(): void {
    StripeMetricsService.resetMetrics();
  }
}