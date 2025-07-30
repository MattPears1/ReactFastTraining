import { injectable, inject } from '@loopback/core';
import { db } from '../../db';
import { refunds, payments, bookings, paymentTransactions } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import Stripe from 'stripe';
import { EmailService } from '../email.service';
import { ActivityLogService } from '../activity-log.service';
import { PaymentReferenceService } from './payment-reference.service';
import { CreateRefundData } from './payment.types';

@injectable()
export class RefundService {
  private stripe: Stripe;

  constructor(
    @inject('services.EmailService')
    private emailService: EmailService,
    @inject('services.ActivityLogService')
    private activityLogService: ActivityLogService,
    @inject('services.PaymentReferenceService')
    private paymentReferenceService: PaymentReferenceService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Process a refund
   */
  async processRefund(data: CreateRefundData): Promise<any> {
    try {
      // Get payment details
      let payment;
      if (data.paymentId) {
        [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.paymentId, data.paymentId));
      } else {
        // Find payment by booking
        [payment] = await db
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.bookingId, data.bookingId),
              eq(payments.status, 'completed')
            )
          );
      }

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Validate refund amount
      const existingRefunds = await db
        .select()
        .from(refunds)
        .where(
          and(
            eq(refunds.paymentId, payment.paymentId),
            eq(refunds.status, 'completed')
          )
        );

      const totalRefunded = existingRefunds.reduce(
        (sum, r) => sum + parseFloat(r.amount),
        0
      );

      if (totalRefunded + data.amount > parseFloat(payment.amount)) {
        throw new Error('Refund amount exceeds payment amount');
      }

      // Generate refund reference
      const refundReference = await this.paymentReferenceService.generateRefundReference();

      // Create refund record
      const [refund] = await db.insert(refunds).values({
        paymentId: payment.paymentId,
        bookingId: data.bookingId,
        userId: data.userId,
        refundReference,
        amount: data.amount.toFixed(2),
        currency: payment.currency,
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        status: 'pending',
        requestedBy: data.requestedBy,
        requestedAt: new Date(),
        processedAt: null,
        stripeRefundId: null,
        metadata: null,
      }).returning();

      // Process Stripe refund if payment was made via Stripe
      if (payment.stripePaymentIntentId) {
        try {
          const stripeRefund = await this.stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: Math.round(data.amount * 100), // Convert to pence
            reason: this.mapRefundReason(data.reason),
            metadata: {
              refundId: refund.refundId,
              bookingId: data.bookingId.toString(),
              userId: data.userId.toString(),
            },
          });

          // Update refund with Stripe details
          await db
            .update(refunds)
            .set({
              stripeRefundId: stripeRefund.id,
              status: stripeRefund.status === 'succeeded' ? 'completed' : 'processing',
              processedAt: new Date(),
            })
            .where(eq(refunds.refundId, refund.refundId));

          // Update payment status
          await db
            .update(payments)
            .set({
              status: totalRefunded + data.amount >= parseFloat(payment.amount) 
                ? 'refunded' 
                : 'partially_refunded',
              updatedAt: new Date(),
            })
            .where(eq(payments.paymentId, payment.paymentId));

        } catch (stripeError: any) {
          // Update refund as failed
          await db
            .update(refunds)
            .set({
              status: 'failed',
              metadata: { error: stripeError.message },
            })
            .where(eq(refunds.refundId, refund.refundId));

          throw stripeError;
        }
      }

      // Create transaction record
      await db.insert(paymentTransactions).values({
        paymentId: payment.paymentId,
        type: 'refund',
        amount: `-${data.amount.toFixed(2)}`,
        currency: payment.currency,
        status: 'completed',
        reference: refundReference,
        description: `Refund: ${data.reason}`,
        stripeReference: refund.stripeRefundId,
        processedAt: new Date(),
      });

      // Update booking status
      await db
        .update(bookings)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, data.bookingId));

      // Log activity
      await this.activityLogService.logActivity({
        userId: data.requestedBy,
        action: 'refund_processed',
        details: {
          refundId: refund.refundId,
          paymentId: payment.paymentId,
          amount: data.amount,
          reason: data.reason,
        },
      });

      // Send refund confirmation email
      await this.emailService.sendRefundConfirmation({
        refund,
        payment,
        booking: data.bookingId,
      });

      return refund;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Map refund reason to Stripe reason
   */
  private mapRefundReason(reason: string): 'duplicate' | 'fraudulent' | 'requested_by_customer' {
    switch (reason.toLowerCase()) {
      case 'duplicate':
        return 'duplicate';
      case 'fraudulent':
      case 'fraud':
        return 'fraudulent';
      default:
        return 'requested_by_customer';
    }
  }

  /**
   * Get refund by ID
   */
  async getRefundById(refundId: string): Promise<any> {
    const [refund] = await db
      .select()
      .from(refunds)
      .where(eq(refunds.refundId, refundId));

    return refund;
  }

  /**
   * Get refunds for a payment
   */
  async getRefundsByPayment(paymentId: string): Promise<any[]> {
    return await db
      .select()
      .from(refunds)
      .where(eq(refunds.paymentId, paymentId));
  }
}