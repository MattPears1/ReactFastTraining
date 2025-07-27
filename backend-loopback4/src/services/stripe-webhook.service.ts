import { injectable, inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import Stripe from 'stripe';
import { db } from '../db';
import { 
  stripeWebhookEvents, 
  paymentEvents, 
  payments, 
  paymentTransactions,
  refunds,
  bookings,
  users
} from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { UserManagementService } from './user-management.service';
import { EmailService } from './email.service';
import { ActivityLogService } from './activity-log.service';

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

@injectable()
export class StripeWebhookService {
  private stripe: Stripe;

  constructor(
    @inject('services.UserManagementService')
    private userManagementService: UserManagementService,
    @inject('services.EmailService')
    private emailService: EmailService,
    @inject('services.ActivityLogService')
    private activityLogService: ActivityLogService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Main webhook handler entry point
   */
  async handleWebhook(body: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    console.log(`Processing webhook event: ${event.type} (${event.id})`);

    // Check if we've already processed this event (idempotency)
    const existingEvent = await db
      .select()
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.stripeEventId, event.id))
      .limit(1);

    if (existingEvent.length > 0) {
      console.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    // Store the webhook event
    await db.insert(stripeWebhookEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      eventData: event as any,
      processed: false,
    });

    try {
      // Process the event based on type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event);
          break;
        
        case 'charge.succeeded':
          await this.handleChargeSucceeded(event);
          break;
        
        case 'charge.failed':
          await this.handleChargeFailed(event);
          break;
        
        case 'charge.refunded':
          await this.handleChargeRefunded(event);
          break;
        
        case 'refund.created':
          await this.handleRefundCreated(event);
          break;
        
        case 'refund.updated':
          await this.handleRefundUpdated(event);
          break;
        
        case 'customer.created':
          await this.handleCustomerCreated(event);
          break;
        
        case 'customer.updated':
          await this.handleCustomerUpdated(event);
          break;
        
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await db
        .update(stripeWebhookEvents)
        .set({ 
          processed: true, 
          processedAt: new Date() 
        })
        .where(eq(stripeWebhookEvents.stripeEventId, event.id));

    } catch (error: any) {
      console.error(`Error processing webhook event ${event.id}:`, error);
      
      // Update event with error
      await db
        .update(stripeWebhookEvents)
        .set({ 
          errorMessage: error.message,
          retryCount: sql`retry_count + 1`
        })
        .where(eq(stripeWebhookEvents.stripeEventId, event.id));
      
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`Payment intent succeeded: ${paymentIntent.id}`);

    // Find the booking by stripe payment intent ID
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (!booking) {
      console.error(`Booking not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Create or update payment record
    const paymentReference = await this.generatePaymentReference();
    
    await db.insert(payments).values({
      bookingId: booking.id,
      userId: booking.userId,
      paymentReference,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string,
      amount: (paymentIntent.amount / 100).toFixed(2),
      currency: paymentIntent.currency.toUpperCase(),
      paymentMethod: paymentIntent.payment_method_types[0] || 'card',
      status: 'succeeded',
      paymentDate: new Date(),
      description: `Payment for booking ${booking.bookingReference}`,
    }).onConflictDoUpdate({
      target: payments.stripePaymentIntentId,
      set: {
        status: 'succeeded',
        paymentDate: new Date(),
        updatedAt: new Date(),
      }
    });

    // Update booking status
    await db
      .update(bookings)
      .set({
        paymentStatus: 'paid',
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    // Update user statistics
    if (booking.userId) {
      await this.userManagementService.updateCustomerStatistics(booking.userId);
    }

    // Log payment event
    await this.logPaymentEvent({
      bookingId: booking.id,
      eventType: 'payment.succeeded',
      eventSource: 'stripe_webhook',
      eventData: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      },
      stripeEventId: event.id,
    });

    // Send confirmation email
    if (booking.contactDetails && booking.contactDetails.email) {
      await this.emailService.sendBookingConfirmation({
        booking,
        paymentAmount: paymentIntent.amount / 100,
      });
    }

    // Log activity
    await this.activityLogService.log({
      action: 'payment_succeeded',
      entityType: 'payment',
      entityId: paymentIntent.id,
      newValues: {
        bookingId: booking.id,
        amount: paymentIntent.amount / 100,
      },
    });
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`Payment intent failed: ${paymentIntent.id}`);

    // Find the booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (!booking) {
      console.error(`Booking not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Create or update payment record
    const paymentReference = await this.generatePaymentReference();
    
    await db.insert(payments).values({
      bookingId: booking.id,
      userId: booking.userId,
      paymentReference,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string,
      amount: (paymentIntent.amount / 100).toFixed(2),
      currency: paymentIntent.currency.toUpperCase(),
      paymentMethod: paymentIntent.payment_method_types[0] || 'card',
      status: 'failed',
      failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
      paymentDate: new Date(),
      description: `Failed payment for booking ${booking.bookingReference}`,
    }).onConflictDoUpdate({
      target: payments.stripePaymentIntentId,
      set: {
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
        updatedAt: new Date(),
      }
    });

    // Update booking status
    await db
      .update(bookings)
      .set({
        paymentStatus: 'failed',
        status: 'payment_failed',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    // Log payment event
    await this.logPaymentEvent({
      bookingId: booking.id,
      eventType: 'payment.failed',
      eventSource: 'stripe_webhook',
      eventData: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        error: paymentIntent.last_payment_error,
      },
      stripeEventId: event.id,
    });

    // Send failure notification email
    if (booking.contactDetails && booking.contactDetails.email) {
      await this.emailService.sendPaymentFailedNotification({
        booking,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      });
    }
  }

  /**
   * Handle successful charge
   */
  private async handleChargeSucceeded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    console.log(`Charge succeeded: ${charge.id}`);

    // Update payment record with charge details
    if (charge.payment_intent) {
      await db
        .update(payments)
        .set({
          stripeChargeId: charge.id,
          cardLastFour: charge.payment_method_details?.card?.last4,
          cardBrand: charge.payment_method_details?.card?.brand,
          stripeFee: charge.balance_transaction ? 
            ((charge.balance_transaction as any).fee / 100).toFixed(2) : null,
          netAmount: charge.balance_transaction ? 
            ((charge.balance_transaction as any).net / 100).toFixed(2) : null,
          updatedAt: new Date(),
        })
        .where(eq(payments.stripePaymentIntentId, charge.payment_intent as string));
    }

    // Log charge event
    await this.logPaymentEvent({
      eventType: 'charge.succeeded',
      eventSource: 'stripe_webhook',
      eventData: {
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent,
        amount: charge.amount / 100,
        currency: charge.currency,
      },
      stripeEventId: event.id,
    });
  }

  /**
   * Handle failed charge
   */
  private async handleChargeFailed(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    console.log(`Charge failed: ${charge.id}`);

    // Log charge failure event
    await this.logPaymentEvent({
      eventType: 'charge.failed',
      eventSource: 'stripe_webhook',
      eventData: {
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent,
        amount: charge.amount / 100,
        currency: charge.currency,
        failureMessage: charge.failure_message,
        failureCode: charge.failure_code,
      },
      stripeEventId: event.id,
    });
  }

  /**
   * Handle charge refunded
   */
  private async handleChargeRefunded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    console.log(`Charge refunded: ${charge.id}`);

    // Find the payment by charge ID
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeChargeId, charge.id))
      .limit(1);

    if (!payment) {
      console.error(`Payment not found for charge: ${charge.id}`);
      return;
    }

    // Update payment status
    const refundAmount = charge.amount_refunded / 100;
    const totalAmount = charge.amount / 100;
    const isFullRefund = refundAmount >= totalAmount;

    await db
      .update(payments)
      .set({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Log refund event
    await this.logPaymentEvent({
      paymentId: payment.id,
      eventType: 'charge.refunded',
      eventSource: 'stripe_webhook',
      eventData: {
        chargeId: charge.id,
        refundAmount,
        totalAmount,
        isFullRefund,
      },
      stripeEventId: event.id,
    });
  }

  /**
   * Handle refund created
   */
  private async handleRefundCreated(event: Stripe.Event) {
    const refund = event.data.object as Stripe.Refund;
    console.log(`Refund created: ${refund.id}`);

    // Find the payment by charge ID
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeChargeId, refund.charge as string))
      .limit(1);

    if (!payment) {
      console.error(`Payment not found for charge: ${refund.charge}`);
      return;
    }

    // Update refund record if exists
    await db
      .update(refunds)
      .set({
        stripeRefundId: refund.id,
        status: 'processing',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(refunds.paymentId, payment.id),
        eq(refunds.status, 'approved')
      ));

    // Log refund event
    await this.logPaymentEvent({
      paymentId: payment.id,
      eventType: 'refund.created',
      eventSource: 'stripe_webhook',
      eventData: {
        refundId: refund.id,
        amount: refund.amount / 100,
        reason: refund.reason,
        status: refund.status,
      },
      stripeEventId: event.id,
    });
  }

  /**
   * Handle refund updated
   */
  private async handleRefundUpdated(event: Stripe.Event) {
    const refund = event.data.object as Stripe.Refund;
    console.log(`Refund updated: ${refund.id} - Status: ${refund.status}`);

    // Find the refund record
    const [refundRecord] = await db
      .select()
      .from(refunds)
      .where(eq(refunds.stripeRefundId, refund.id))
      .limit(1);

    if (!refundRecord) {
      console.error(`Refund record not found for Stripe refund: ${refund.id}`);
      return;
    }

    // Update refund status
    const newStatus = refund.status === 'succeeded' ? 'completed' : 
                     refund.status === 'failed' ? 'failed' : 
                     'processing';

    await db
      .update(refunds)
      .set({
        status: newStatus,
        completedAt: refund.status === 'succeeded' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(refunds.id, refundRecord.id));

    // If refund succeeded, update booking status
    if (refund.status === 'succeeded') {
      await db
        .update(bookings)
        .set({
          status: 'refunded',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, refundRecord.bookingId));

      // Update user statistics
      if (refundRecord.userId) {
        await this.userManagementService.updateCustomerStatistics(refundRecord.userId);
      }

      // Send refund confirmation email
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, refundRecord.bookingId))
        .limit(1);

      if (booking && booking.contactDetails && booking.contactDetails.email) {
        await this.emailService.sendRefundConfirmation({
          booking,
          refundAmount: refund.amount / 100,
        });
      }
    }

    // Log refund event
    await this.logPaymentEvent({
      refundId: refundRecord.id,
      eventType: 'refund.updated',
      eventSource: 'stripe_webhook',
      eventData: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        failureReason: refund.failure_reason,
      },
      stripeEventId: event.id,
    });
  }

  /**
   * Handle customer created
   */
  private async handleCustomerCreated(event: Stripe.Event) {
    const customer = event.data.object as Stripe.Customer;
    console.log(`Customer created: ${customer.id}`);

    // Update user with Stripe customer ID if email matches
    if (customer.email) {
      await db
        .update(users)
        .set({
          stripeCustomerId: customer.id,
          updatedAt: new Date(),
        })
        .where(eq(sql`LOWER(${users.email})`, customer.email.toLowerCase()));
    }

    // Log customer event
    await this.logPaymentEvent({
      eventType: 'customer.created',
      eventSource: 'stripe_webhook',
      eventData: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      },
      stripeEventId: event.id,
    });
  }

  /**
   * Handle customer updated
   */
  private async handleCustomerUpdated(event: Stripe.Event) {
    const customer = event.data.object as Stripe.Customer;
    console.log(`Customer updated: ${customer.id}`);

    // Log customer update event
    await this.logPaymentEvent({
      eventType: 'customer.updated',
      eventSource: 'stripe_webhook',
      eventData: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      },
      stripeEventId: event.id,
    });
  }

  /**
   * Handle dispute created
   */
  private async handleDisputeCreated(event: Stripe.Event) {
    const dispute = event.data.object as Stripe.Dispute;
    console.log(`Dispute created: ${dispute.id}`);

    // Find the payment by charge ID
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeChargeId, dispute.charge as string))
      .limit(1);

    if (payment) {
      // Log dispute event
      await this.logPaymentEvent({
        paymentId: payment.id,
        eventType: 'dispute.created',
        eventSource: 'stripe_webhook',
        eventData: {
          disputeId: dispute.id,
          amount: dispute.amount / 100,
          reason: dispute.reason,
          status: dispute.status,
        },
        stripeEventId: event.id,
      });

      // Send alert to admin
      await this.emailService.sendDisputeAlert({
        payment,
        dispute,
      });
    }
  }

  /**
   * Generate unique payment reference
   */
  private async generatePaymentReference(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${dateStr}-${random}`;
  }

  /**
   * Log payment event
   */
  private async logPaymentEvent(data: {
    paymentId?: string;
    paymentTransactionId?: number;
    refundId?: number;
    bookingId?: number;
    eventType: string;
    eventSource: string;
    eventData: any;
    stripeEventId?: string;
  }) {
    await db.insert(paymentEvents).values({
      paymentId: data.paymentId,
      paymentTransactionId: data.paymentTransactionId,
      refundId: data.refundId,
      eventType: data.eventType,
      eventSource: data.eventSource,
      eventData: data.eventData,
      stripeEventId: data.stripeEventId,
    });
  }

  /**
   * Retry failed webhook events
   */
  async retryFailedWebhooks(): Promise<void> {
    const failedEvents = await db
      .select()
      .from(stripeWebhookEvents)
      .where(and(
        eq(stripeWebhookEvents.processed, false),
        sql`retry_count < 3`
      ))
      .orderBy(stripeWebhookEvents.createdAt)
      .limit(10);

    for (const event of failedEvents) {
      try {
        console.log(`Retrying webhook event: ${event.stripeEventId}`);
        
        // Reconstruct the event and process it
        const stripeEvent = event.eventData as StripeWebhookEvent;
        await this.handleWebhook(
          JSON.stringify(stripeEvent),
          'retry' // Use dummy signature for retry
        );
      } catch (error) {
        console.error(`Failed to retry webhook event ${event.stripeEventId}:`, error);
      }
    }
  }
}