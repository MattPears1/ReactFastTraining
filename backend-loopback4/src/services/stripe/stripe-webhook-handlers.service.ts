import Stripe from 'stripe';
import { db } from '../../config/database.config';
import { payments, bookings, PaymentEventType } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { StripePaymentLoggerService } from './stripe-payment-logger.service';

export class StripeWebhookHandlersService {
  static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    if (paymentRecord) {
      await db
        .update(payments)
        .set({
          status: 'succeeded',
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentRecord.id));

      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          paymentIntentId: paymentIntent.id,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, paymentRecord.bookingId));

      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id,
        PaymentEventType.SUCCEEDED,
        {
          paymentIntentId: paymentIntent.id,
          chargeId: (paymentIntent.latest_charge as Stripe.Charge)?.id,
        }
      );
    }
  }

  static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
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

      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id,
        PaymentEventType.FAILED,
        {
          error: paymentIntent.last_payment_error,
          declineCode: paymentIntent.last_payment_error?.decline_code,
        }
      );

      await db
        .update(bookings)
        .set({
          status: 'payment_failed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, paymentRecord.bookingId));
    }
  }

  static async handlePaymentProcessing(paymentIntent: Stripe.PaymentIntent): Promise<void> {
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

      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id,
        PaymentEventType.PROCESSING,
        { paymentIntentId: paymentIntent.id }
      );
    }
  }

  static async handlePaymentActionRequired(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    if (paymentRecord) {
      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id,
        PaymentEventType.REQUIRES_ACTION,
        {
          actionType: paymentIntent.next_action?.type,
          paymentIntentId: paymentIntent.id,
        }
      );
    }
  }

  static async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
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

      if (charge.outcome) {
        updateData.riskLevel = charge.outcome.risk_level || undefined;
        updateData.riskScore = charge.outcome.risk_score || undefined;
      }

      await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, paymentRecord.id));

      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id,
        PaymentEventType.CHARGE_SUCCEEDED,
        {
          chargeId: charge.id,
          amount: charge.amount / 100,
          riskLevel: charge.outcome?.risk_level,
        }
      );
    }
  }

  static async handleChargeFailed(charge: Stripe.Charge): Promise<void> {
    if (!charge.payment_intent) return;

    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, charge.payment_intent as string));

    if (paymentRecord) {
      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id,
        PaymentEventType.CHARGE_FAILED,
        {
          chargeId: charge.id,
          failureCode: charge.failure_code,
          failureMessage: charge.failure_message,
        }
      );
    }
  }

  static async handleDispute(dispute: Stripe.Dispute): Promise<void> {
    console.error('Payment dispute created:', dispute.id);
    
    const chargeId = dispute.charge as string;
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeChargeId, chargeId));

    if (paymentRecord) {
      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id,
        PaymentEventType.DISPUTE_CREATED,
        {
          disputeId: dispute.id,
          amount: dispute.amount / 100,
          reason: dispute.reason,
          status: dispute.status,
        }
      );

      await db
        .update(bookings)
        .set({
          status: 'disputed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, paymentRecord.bookingId));
    }
  }

  static async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    if (!charge.payment_intent) return;

    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, charge.payment_intent as string));

    if (paymentRecord) {
      await StripePaymentLoggerService.logPaymentEvent(
        paymentRecord.id,
        PaymentEventType.REFUND_PROCESSED,
        {
          chargeId: charge.id,
          refundAmount: charge.amount_refunded / 100,
          refunded: charge.refunded,
        }
      );

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

  static async handleRefundUpdated(refund: Stripe.Refund): Promise<void> {
    await StripePaymentLoggerService.logPaymentEvent(
      null,
      PaymentEventType.REFUND_UPDATED,
      {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        reason: refund.reason,
      }
    );
  }

  static async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    console.log('Payment method attached:', paymentMethod.id);
    // TODO: Store payment method for future use if needed
  }

  static async handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    console.log('Payment method detached:', paymentMethod.id);
    // TODO: Remove stored payment method if needed
  }

  static async handleCustomerEvent(customer: Stripe.Customer): Promise<void> {
    console.log('Customer event:', customer.id);
    // TODO: Sync customer data if needed
  }

  static async handleFraudWarning(warning: any): Promise<void> {
    console.error('Early fraud warning received:', warning);
    
    await StripePaymentLoggerService.logPaymentEvent(
      null,
      PaymentEventType.FRAUD_WARNING,
      {
        warningId: warning.id,
        chargeId: warning.charge,
        actionableDate: warning.actionable_date,
        fraudType: warning.fraud_type,
      }
    );

    // TODO: Take appropriate action (notify admin, pause booking, etc.)
  }
}