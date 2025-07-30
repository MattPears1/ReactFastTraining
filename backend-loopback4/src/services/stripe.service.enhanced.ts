import Stripe from 'stripe';
import { db } from '../config/database.config';
import { 
  payments, 
  paymentLogs, 
  bookings, 
  webhookEvents,
  PaymentStatus,
  PaymentEventType,
  NewPayment,
  NewPaymentLog
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

interface CreatePaymentIntentData {
  amount: number; // in pounds
  bookingId: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, string>;
  statementDescriptor?: string;
  description?: string;
  setupFutureUsage?: 'on_session' | 'off_session';
  savePaymentMethod?: boolean;
}

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

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

// Enhanced error types for better error handling
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class StripeServiceEnhanced {
  private static stripe: Stripe;
  private static initialized = false;
  private static readonly DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  // Performance monitoring
  private static metrics = {
    paymentIntentsCreated: 0,
    paymentIntentsSucceeded: 0,
    paymentIntentsFailed: 0,
    webhooksProcessed: 0,
    webhooksFailed: 0,
    averageProcessingTime: 0,
  };

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
    this.validatePaymentData(data);

    // Generate idempotency key with booking ID and timestamp
    const idempotencyKey = this.generateIdempotencyKey(data.bookingId);

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
      const amountInPence = this.convertToPence(data.amount);

      // Prepare payment intent data with enhanced options
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInPence,
        currency: 'gbp',
        payment_method_types: ['card'],
        capture_method: 'automatic',
        receipt_email: data.customerEmail,
        description: data.description || `React Fast Training - Course Booking #${data.bookingId}`,
        statement_descriptor: this.sanitizeStatementDescriptor(
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
      const paymentIntent = await this.retryStripeOperation(
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
      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.CREATED, {
        paymentIntentId: paymentIntent.id,
        amount: data.amount,
        bookingId: data.bookingId,
        processingTime: Date.now() - startTime,
      });

      // Update metrics
      this.metrics.paymentIntentsCreated++;
      this.updateAverageProcessingTime(Date.now() - startTime);

      return { 
        paymentIntent, 
        paymentRecord,
        clientSecret: paymentIntent.client_secret!
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      
      // Log the error with detailed context
      await this.logPaymentEvent(null, PaymentEventType.FAILED, {
        error: this.formatError(error),
        bookingId: data.bookingId,
        amount: data.amount,
        processingTime: Date.now() - startTime,
      });

      // Update failure metrics
      this.metrics.paymentIntentsFailed++;

      // Re-throw with appropriate error type
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(
        'Payment processing failed. Please try again.',
        'PAYMENT_CREATION_FAILED',
        500,
        { originalError: this.formatError(error) }
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
      const paymentIntent = await this.retryStripeOperation(
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
      
      await this.logPaymentEvent(null, PaymentEventType.FAILED, {
        error: this.formatError(error),
        paymentIntentId,
        processingTime: Date.now() - startTime,
      });

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
      
      await this.logPaymentEvent(null, PaymentEventType.WEBHOOK_FAILED, {
        error: 'Invalid webhook signature',
        headers: this.sanitizeHeaders(headers),
      });

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
        headers: this.sanitizeHeaders(headers),
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
      await this.logPaymentEvent(null, PaymentEventType.WEBHOOK_PROCESSED, {
        eventId: event.id,
        eventType: event.type,
        processingTime: Date.now() - startTime,
      });

      // Update metrics
      this.metrics.webhooksProcessed++;

    } catch (error) {
      // Enhanced error handling with retry scheduling
      const retryCount = webhookRecord.retryCount + 1;
      const nextRetryAt = this.calculateNextRetryTime(retryCount);

      await db
        .update(webhookEvents)
        .set({
          errorMessage: this.formatError(error),
          retryCount,
          nextRetryAt,
          processingDurationMs: Date.now() - startTime,
        })
        .where(eq(webhookEvents.id, webhookRecord.id));

      // Update failure metrics
      this.metrics.webhooksFailed++;

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
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.processing':
        await this.handlePaymentProcessing(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await this.handlePaymentActionRequired(event.data.object as Stripe.PaymentIntent);
        break;

      // Charge events
      case 'charge.succeeded':
        await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.failed':
        await this.handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await this.handleDispute(event.data.object as Stripe.Dispute);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.refund.updated':
        await this.handleRefundUpdated(event.data.object as Stripe.Refund);
        break;

      // Payment method events
      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await this.handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      // Customer events
      case 'customer.created':
      case 'customer.updated':
        await this.handleCustomerEvent(event.data.object as Stripe.Customer);
        break;

      // Radar events
      case 'radar.early_fraud_warning.created':
        await this.handleFraudWarning(event.data.object as any);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  // Helper methods

  private static validatePaymentData(data: CreatePaymentIntentData): void {
    if (!data.amount || data.amount <= 0) {
      throw new PaymentError('Invalid payment amount', 'INVALID_AMOUNT', 400);
    }

    if (!data.bookingId) {
      throw new PaymentError('Booking ID is required', 'MISSING_BOOKING_ID', 400);
    }

    if (!data.customerEmail || !this.isValidEmail(data.customerEmail)) {
      throw new PaymentError('Valid customer email is required', 'INVALID_EMAIL', 400);
    }

    // Validate amount precision (max 2 decimal places)
    if (Math.round(data.amount * 100) !== data.amount * 100) {
      throw new PaymentError(
        'Amount must have maximum 2 decimal places',
        'INVALID_AMOUNT_PRECISION',
        400
      );
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static generateIdempotencyKey(bookingId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${bookingId}-${timestamp}-${random}`;
  }

  private static convertToPence(pounds: number): number {
    return Math.round(pounds * 100);
  }

  private static sanitizeStatementDescriptor(descriptor: string): string {
    // Stripe statement descriptor requirements:
    // - Max 22 characters
    // - No special characters except spaces and periods
    return descriptor
      .substring(0, 22)
      .replace(/[^a-zA-Z0-9\s.]/g, '')
      .trim();
  }

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

  private static async retryStripeOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;
    let delay = opts.initialDelay;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt === opts.maxAttempts) {
          break;
        }

        console.warn(
          `${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`,
          error.message
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    }

    throw lastError;
  }

  private static isNonRetryableError(error: any): boolean {
    if (!error.type) return false;
    
    const nonRetryableTypes = [
      'StripeCardError',
      'StripeInvalidRequestError',
      'StripeAuthenticationError',
    ];
    
    return nonRetryableTypes.includes(error.type);
  }

  private static formatError(error: any): any {
    if (error instanceof Error) {
      return {
        message: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: (error as any).code,
        statusCode: (error as any).statusCode,
      };
    }
    return error;
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
    await this.logPaymentEvent(paymentRecord.id, PaymentEventType.SUCCEEDED, {
      chargeId: (paymentIntent.latest_charge as Stripe.Charge)?.id,
      receiptUrl: (paymentIntent.latest_charge as Stripe.Charge)?.receipt_url,
      processingTime: Date.now() - startTime,
      paymentMethodType: (paymentIntent.payment_method as Stripe.PaymentMethod)?.type,
    });

    // Get updated booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, paymentRecord.bookingId));

    // Update success metrics
    this.metrics.paymentIntentsSucceeded++;
    this.updateAverageProcessingTime(Date.now() - startTime);

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
    await this.logPaymentEvent(paymentRecord.id, PaymentEventType.REQUIRES_ACTION, {
      actionType: paymentIntent.next_action?.type,
    });

    return {
      success: false,
      payment: paymentRecord,
      requiresAction: true,
      actionUrl: paymentIntent.next_action?.redirect_to_url?.url,
    };
  }

  private static async handleProcessingPayment(paymentRecord: any): Promise<any> {
    await this.logPaymentEvent(paymentRecord.id, PaymentEventType.PROCESSING, {
      status: 'processing',
    });

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
    await this.logPaymentEvent(paymentRecord.id, PaymentEventType.INCOMPLETE, {
      status: paymentIntent.status,
      reason: paymentIntent.last_payment_error?.message,
    });

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
    await this.logPaymentEvent(paymentRecord.id, PaymentEventType.FAILED, {
      status: paymentIntent.status,
      error: paymentIntent.last_payment_error,
    });

    // Update failure metrics
    this.metrics.paymentIntentsFailed++;

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

  private static sanitizeHeaders(headers?: Record<string, string>): any {
    if (!headers) return {};
    
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      'stripe-signature',
      'content-type',
      'user-agent',
      'x-forwarded-for',
      'x-real-ip',
    ];
    
    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private static calculateNextRetryTime(retryCount: number): Date {
    // Exponential backoff: 5min, 30min, 2hr, 6hr, 24hr
    const delays = [5, 30, 120, 360, 1440];
    const delayMinutes = delays[Math.min(retryCount - 1, delays.length - 1)];
    
    return new Date(Date.now() + delayMinutes * 60 * 1000);
  }

  private static updateAverageProcessingTime(newTime: number): void {
    const totalProcessed = this.metrics.paymentIntentsSucceeded + this.metrics.paymentIntentsFailed;
    if (totalProcessed === 0) {
      this.metrics.averageProcessingTime = newTime;
    } else {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (totalProcessed - 1) + newTime) / totalProcessed;
    }
  }

  // Enhanced webhook handlers

  private static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await this.confirmPayment(paymentIntent.id);
  }

  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    if (paymentRecord) {
      await db
        .update(payments)
        .set({
          status: 'failed',
          failureCode: paymentIntent.last_payment_error?.code || undefined,
          failureMessage: paymentIntent.last_payment_error?.message || undefined,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentRecord.id));

      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.FAILED, {
        error: paymentIntent.last_payment_error,
        declineCode: paymentIntent.last_payment_error?.decline_code,
      });

      // Update booking status
      await db
        .update(bookings)
        .set({
          status: 'payment_failed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, paymentRecord.bookingId));
    }
  }

  private static async handlePaymentProcessing(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    if (paymentRecord) {
      await db
        .update(payments)
        .set({
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentRecord.id));

      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.PROCESSING, {
        paymentIntentId: paymentIntent.id,
      });
    }
  }

  private static async handlePaymentActionRequired(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    if (paymentRecord) {
      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.REQUIRES_ACTION, {
        actionType: paymentIntent.next_action?.type,
        paymentIntentId: paymentIntent.id,
      });
    }
  }

  private static async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
    if (!charge.payment_intent) return;

    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, charge.payment_intent as string));

    if (paymentRecord) {
      const updateData: any = {
        stripeChargeId: charge.id,
        receiptUrl: charge.receipt_url || undefined,
        updatedAt: new Date(),
      };

      // Add risk assessment data
      if (charge.outcome) {
        updateData.riskLevel = charge.outcome.risk_level || undefined;
        updateData.riskScore = charge.outcome.risk_score || undefined;
      }

      await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, paymentRecord.id));

      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.CHARGE_SUCCEEDED, {
        chargeId: charge.id,
        amount: charge.amount / 100,
        riskLevel: charge.outcome?.risk_level,
      });
    }
  }

  private static async handleChargeFailed(charge: Stripe.Charge): Promise<void> {
    if (!charge.payment_intent) return;

    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, charge.payment_intent as string));

    if (paymentRecord) {
      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.CHARGE_FAILED, {
        chargeId: charge.id,
        failureCode: charge.failure_code,
        failureMessage: charge.failure_message,
      });
    }
  }

  private static async handleDispute(dispute: Stripe.Dispute): Promise<void> {
    console.error('Payment dispute created:', dispute.id);
    
    // Find the payment record
    const chargeId = dispute.charge as string;
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeChargeId, chargeId));

    if (paymentRecord) {
      // Log dispute event
      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.DISPUTE_CREATED, {
        disputeId: dispute.id,
        amount: dispute.amount / 100,
        reason: dispute.reason,
        status: dispute.status,
      });

      // Update booking status
      await db
        .update(bookings)
        .set({
          status: 'disputed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, paymentRecord.bookingId));

      // TODO: Send admin notification
    }
  }

  private static async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    if (!charge.payment_intent) return;

    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, charge.payment_intent as string));

    if (paymentRecord) {
      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.REFUND_PROCESSED, {
        chargeId: charge.id,
        refundAmount: charge.amount_refunded / 100,
        refunded: charge.refunded,
      });

      // Update payment status if fully refunded
      if (charge.refunded) {
        await db
          .update(payments)
          .set({
            status: 'refunded',
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentRecord.id));
      }
    }
  }

  private static async handleRefundUpdated(refund: Stripe.Refund): Promise<void> {
    await this.logPaymentEvent(null, PaymentEventType.REFUND_UPDATED, {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
      reason: refund.reason,
    });
  }

  private static async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    console.log('Payment method attached:', paymentMethod.id);
    // TODO: Store payment method for future use if needed
  }

  private static async handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    console.log('Payment method detached:', paymentMethod.id);
    // TODO: Remove stored payment method if needed
  }

  private static async handleCustomerEvent(customer: Stripe.Customer): Promise<void> {
    console.log('Customer event:', customer.id);
    // TODO: Sync customer data if needed
  }

  private static async handleFraudWarning(warning: any): Promise<void> {
    console.error('Early fraud warning received:', warning);
    
    // Log the warning
    await this.logPaymentEvent(null, PaymentEventType.FRAUD_WARNING, {
      warningId: warning.id,
      chargeId: warning.charge,
      actionableDate: warning.actionable_date,
      fraudType: warning.fraud_type,
    });

    // TODO: Take appropriate action (notify admin, pause booking, etc.)
  }

  // Enhanced logging with structured data
  private static async logPaymentEvent(
    paymentId: string | null,
    eventType: PaymentEventType,
    eventData: any,
    eventSource: string = 'system'
  ): Promise<void> {
    try {
      const logData: NewPaymentLog = {
        paymentId,
        eventType,
        eventSource,
        eventData: {
          ...eventData,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
      };

      await db.insert(paymentLogs).values(logData);
    } catch (error) {
      console.error('Failed to log payment event:', error);
      // Don't throw - logging failures shouldn't break payment processing
    }
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
        
        const amountInPence = this.convertToPence(data.amount);
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
      const refund = await this.retryStripeOperation(
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
        { originalError: this.formatError(error) }
      );
    }
  }

  // Retrieve payment intent with caching
  static async retrievePaymentIntent(
    paymentIntentId: string,
    options?: { expand?: string[] }
  ): Promise<Stripe.PaymentIntent> {
    this.initialize();
    
    return await this.retryStripeOperation(
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
    
    return await this.retryStripeOperation(
      () => this.stripe.charges.retrieve(chargeId, options),
      'retrieveCharge'
    );
  }

  // Get service metrics
  static getMetrics(): typeof StripeServiceEnhanced.metrics {
    return { ...this.metrics };
  }

  // Reset metrics (for testing)
  static resetMetrics(): void {
    this.metrics = {
      paymentIntentsCreated: 0,
      paymentIntentsSucceeded: 0,
      paymentIntentsFailed: 0,
      webhooksProcessed: 0,
      webhooksFailed: 0,
      averageProcessingTime: 0,
    };
  }
}