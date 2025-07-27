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

interface CreatePaymentIntentData {
  amount: number; // in pounds
  bookingId: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

interface PaymentUpdateData {
  status: string;
  stripeChargeId?: string;
  receiptUrl?: string;
  paymentMethodType?: string;
  paymentMethodLast4?: string;
  paymentMethodBrand?: string;
}

export class StripeService {
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
    });

    this.initialized = true;
  }

  static async createPaymentIntent(data: CreatePaymentIntentData): Promise<{
    paymentIntent: Stripe.PaymentIntent;
    paymentRecord: any;
  }> {
    this.initialize();

    // Generate idempotency key to prevent duplicate charges
    const idempotencyKey = `${data.bookingId}-${Date.now()}`;

    try {
      // Convert pounds to pence
      const amountInPence = Math.round(data.amount * 100);

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInPence,
        currency: 'gbp',
        payment_method_types: ['card'],
        receipt_email: data.customerEmail,
        description: `React Fast Training - Course Booking`,
        statement_descriptor: 'REACT FAST TRAIN',
        metadata: {
          bookingId: data.bookingId,
          customerEmail: data.customerEmail,
          ...data.metadata,
        },
        // Enable automatic payment methods
        automatic_payment_methods: {
          enabled: true,
        },
      }, {
        idempotencyKey,
      });

      // Store payment record in database
      const [paymentRecord] = await db.insert(payments).values({
        bookingId: data.bookingId,
        stripePaymentIntentId: paymentIntent.id,
        amount: data.amount.toString(),
        currency: 'GBP',
        status: paymentIntent.status,
        idempotencyKey,
        metadata: {
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          ...data.metadata,
        },
      }).returning();

      // Log payment creation
      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.CREATED, {
        paymentIntentId: paymentIntent.id,
        amount: data.amount,
        bookingId: data.bookingId,
      });

      return { paymentIntent, paymentRecord };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      
      // Log the error
      await this.logPaymentEvent(null, PaymentEventType.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error',
        bookingId: data.bookingId,
        amount: data.amount,
      });

      throw new Error('Payment processing failed. Please try again.');
    }
  }

  static async confirmPayment(paymentIntentId: string): Promise<{
    success: boolean;
    payment?: any;
    booking?: any;
  }> {
    this.initialize();

    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
        { expand: ['payment_method', 'latest_charge'] }
      );

      // Find payment record
      const [paymentRecord] = await db
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, paymentIntentId));

      if (!paymentRecord) {
        throw new Error('Payment record not found');
      }

      // Update payment record based on Stripe status
      const updateData: PaymentUpdateData = {
        status: paymentIntent.status,
      };

      if (paymentIntent.status === 'succeeded') {
        const charge = paymentIntent.latest_charge as Stripe.Charge;
        const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;

        updateData.stripeChargeId = charge?.id;
        updateData.receiptUrl = charge?.receipt_url || undefined;
        
        if (paymentMethod?.card) {
          updateData.paymentMethodType = 'card';
          updateData.paymentMethodLast4 = paymentMethod.card.last4;
          updateData.paymentMethodBrand = paymentMethod.card.brand;
        }

        // Update payment record
        await db
          .update(payments)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentRecord.id));

        // Update booking status to confirmed
        await db
          .update(bookings)
          .set({
            status: 'confirmed',
            paymentIntentId: paymentIntentId,
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, paymentRecord.bookingId));

        // Log success
        await this.logPaymentEvent(paymentRecord.id, PaymentEventType.SUCCEEDED, {
          chargeId: charge?.id,
          receiptUrl: charge?.receipt_url,
        });

        // Get updated booking
        const [booking] = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, paymentRecord.bookingId));

        return { success: true, payment: paymentRecord, booking };
      } else {
        // Update payment status
        await db
          .update(payments)
          .set({
            status: paymentIntent.status,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentRecord.id));

        // Log status update
        await this.logPaymentEvent(paymentRecord.id, PaymentEventType.UPDATED, {
          status: paymentIntent.status,
        });

        return { success: false, payment: paymentRecord };
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  static async handleWebhook(
    signature: string, 
    payload: string
  ): Promise<{ received: boolean }> {
    this.initialize();

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new Error('Invalid webhook signature');
    }

    // Check if we've already processed this event
    const [existingEvent] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.stripeEventId, event.id));

    if (existingEvent && existingEvent.processed) {
      console.log(`Webhook event ${event.id} already processed`);
      return { received: true };
    }

    // Store webhook event
    const [webhookRecord] = await db
      .insert(webhookEvents)
      .values({
        stripeEventId: event.id,
        eventType: event.type,
        eventData: event.data.object as any,
      })
      .onConflictDoNothing()
      .returning();

    if (!webhookRecord) {
      // Event already exists
      return { received: true };
    }

    try {
      // Process the event
      await this.processWebhookEvent(event);

      // Mark as processed
      await db
        .update(webhookEvents)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.id, webhookRecord.id));

      // Log webhook processing
      await this.logPaymentEvent(null, PaymentEventType.WEBHOOK_PROCESSED, {
        eventId: event.id,
        eventType: event.type,
      });

    } catch (error) {
      // Log error and update webhook record
      await db
        .update(webhookEvents)
        .set({
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: webhookRecord.retryCount + 1,
        })
        .where(eq(webhookEvents.id, webhookRecord.id));

      throw error;
    }

    return { received: true };
  }

  private static async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.succeeded':
        await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await this.handleDispute(event.data.object as Stripe.Dispute);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

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
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentRecord.id));

      await this.logPaymentEvent(paymentRecord.id, PaymentEventType.FAILED, {
        error: paymentIntent.last_payment_error?.message,
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
      await db
        .update(payments)
        .set({
          stripeChargeId: charge.id,
          receiptUrl: charge.receipt_url || undefined,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentRecord.id));
    }
  }

  private static async handleDispute(dispute: Stripe.Dispute): Promise<void> {
    console.error('Payment dispute created:', dispute.id);
    // TODO: Implement dispute handling - notify admin, pause booking, etc.
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
      });
    }
  }

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
        eventData,
      };

      await db.insert(paymentLogs).values(logData);
    } catch (error) {
      console.error('Failed to log payment event:', error);
    }
  }

  // Refund methods (to be expanded in refund implementation)
  static async createRefund(data: {
    paymentIntentId: string;
    amount?: number; // In pounds, if not provided, full refund
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }): Promise<Stripe.Refund> {
    this.initialize();

    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: data.paymentIntentId,
        reason: data.reason || 'requested_by_customer',
        metadata: data.metadata,
      };

      // If amount specified, convert to pence
      if (data.amount !== undefined) {
        refundData.amount = Math.round(data.amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);
      return refund;
    } catch (error) {
      console.error('Stripe refund creation failed:', error);
      throw new Error('Refund processing failed');
    }
  }

  static async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    this.initialize();
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  static async retrieveCharge(chargeId: string): Promise<Stripe.Charge> {
    this.initialize();
    return await this.stripe.charges.retrieve(chargeId);
  }
}