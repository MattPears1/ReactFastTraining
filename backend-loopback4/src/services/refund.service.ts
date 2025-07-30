import { db } from '../config/database.config';
import {
  refunds,
  bookings,
  payments,
  users,
  paymentLogs,
  RefundStatus,
  PaymentEventType,
  NewRefund,
  Refund,
} from '../db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { StripeService } from './stripe.service';
import { EmailService } from './email.service';
import { BookingService } from './booking/booking.service';

interface RefundRequest {
  bookingId: string;
  reason: string;
  requestedBy: string;
}

interface RefundApproval {
  refundId: string;
  approvedBy: string;
  notes?: string;
}

interface RefundWithDetails extends Refund {
  booking: any;
  payment: any;
  requestedByUser: any;
  approvedByUser?: any;
}

export class RefundService {
  /**
   * Request a refund for a booking
   * This creates a refund request that must be approved by an admin
   */
  static async requestRefund(data: RefundRequest): Promise<Refund> {
    // Verify booking exists and belongs to user
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, data.bookingId));

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.userId !== data.requestedBy) {
      throw new Error('Unauthorized: You can only request refunds for your own bookings');
    }

    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      throw new Error(`This booking is already ${booking.status}`);
    }

    // Check if refund already exists
    const [existingRefund] = await db
      .select()
      .from(refunds)
      .where(
        and(
          eq(refunds.bookingId, data.bookingId),
          inArray(refunds.status, ['pending', 'approved', 'processing', 'processed'])
        )
      );

    if (existingRefund) {
      throw new Error('A refund request already exists for this booking');
    }

    // Get payment details
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.bookingId, data.bookingId),
          eq(payments.status, 'succeeded')
        )
      );

    if (!payment) {
      throw new Error('No successful payment found for this booking');
    }

    // Create refund request
    const [refund] = await db
      .insert(refunds)
      .values({
        bookingId: data.bookingId,
        paymentId: payment.id,
        amount: payment.amount,
        reason: data.reason,
        status: RefundStatus.PENDING,
        requestedBy: data.requestedBy,
        requestedAt: new Date(),
      })
      .returning();

    // Cancel the booking
    await BookingService.cancelBooking(data.bookingId);

    // Get full details for email
    const refundWithDetails = await this.getRefundWithDetails(refund.id);

    // Notify admin of refund request
    await this.notifyAdminOfRefundRequest(refundWithDetails);

    // Notify customer
    await EmailService.sendRefundRequestConfirmation(
      refundWithDetails.requestedByUser.email,
      refundWithDetails
    );

    return refund;
  }

  /**
   * Approve a refund request (admin only)
   */
  static async approveRefund(data: RefundApproval): Promise<void> {
    const refund = await this.getRefundWithDetails(data.refundId);

    if (!refund) {
      throw new Error('Refund not found');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new Error(`Refund is not in pending status (current: ${refund.status})`);
    }

    // Update refund status to approved
    await db
      .update(refunds)
      .set({
        status: RefundStatus.APPROVED,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(refunds.id, data.refundId));

    // Process refund immediately
    await this.processRefund(data.refundId);
  }

  /**
   * Reject a refund request (admin only)
   */
  static async rejectRefund(
    refundId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    const refund = await this.getRefundWithDetails(refundId);

    if (!refund) {
      throw new Error('Refund not found');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new Error(`Refund is not in pending status (current: ${refund.status})`);
    }

    // Update refund status
    await db
      .update(refunds)
      .set({
        status: RefundStatus.REJECTED,
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        notes: reason,
        updatedAt: new Date(),
      })
      .where(eq(refunds.id, refundId));

    // Restore booking to confirmed status
    await db
      .update(bookings)
      .set({
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, refund.bookingId));

    // Notify customer
    await EmailService.sendRefundRejectedEmail(
      refund.requestedByUser.email,
      refund,
      reason
    );
  }

  /**
   * Process an approved refund with Stripe
   */
  private static async processRefund(refundId: string): Promise<void> {
    const refund = await this.getRefundWithDetails(refundId);

    if (!refund) {
      throw new Error('Refund not found');
    }

    if (refund.status !== RefundStatus.APPROVED) {
      throw new Error('Refund is not approved');
    }

    try {
      // Update status to processing
      await db
        .update(refunds)
        .set({
          status: RefundStatus.PROCESSING,
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundId));

      // Create Stripe refund
      const stripeRefund = await StripeService.createRefund({
        paymentIntentId: refund.payment.stripePaymentIntentId,
        amount: parseFloat(refund.amount),
        reason: 'requested_by_customer',
        metadata: {
          bookingId: refund.bookingId,
          refundId: refund.id,
          originalReason: refund.reason,
        },
      });

      // Update refund record with Stripe details
      await db
        .update(refunds)
        .set({
          stripeRefundId: stripeRefund.id,
          status: RefundStatus.PROCESSED,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundId));

      // Update booking status
      await db
        .update(bookings)
        .set({
          status: 'refunded',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, refund.bookingId));

      // Send confirmation emails
      await this.sendRefundConfirmations(refund);

      // Log the event
      await db.insert(paymentLogs).values({
        paymentId: refund.paymentId,
        eventType: PaymentEventType.REFUND_PROCESSED,
        eventSource: 'system',
        eventData: {
          refundId: refund.id,
          stripeRefundId: stripeRefund.id,
          amount: refund.amount,
        },
      });

    } catch (error) {
      // Update status to failed
      await db
        .update(refunds)
        .set({
          status: RefundStatus.FAILED,
          notes: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundId));

      // Log the failure
      await db.insert(paymentLogs).values({
        paymentId: refund.paymentId,
        eventType: PaymentEventType.REFUND_FAILED,
        eventSource: 'system',
        eventData: {
          refundId: refund.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get refunds by status (for admin dashboard)
   */
  static async getRefundsByStatus(
    status?: RefundStatus,
    limit = 50,
    offset = 0
  ): Promise<RefundWithDetails[]> {
    const query = db
      .select({
        refund: refunds,
        booking: bookings,
        payment: payments,
        requestedByUser: users,
      })
      .from(refunds)
      .innerJoin(bookings, eq(refunds.bookingId, bookings.id))
      .innerJoin(payments, eq(refunds.paymentId, payments.id))
      .innerJoin(users, eq(refunds.requestedBy, users.id))
      .orderBy(desc(refunds.requestedAt))
      .limit(limit)
      .offset(offset);

    if (status) {
      query.where(eq(refunds.status, status));
    }

    const results = await query;

    // Get approved by user details if exists
    const refundsWithApprover = await Promise.all(
      results.map(async (r) => {
        let approvedByUser = null;
        if (r.refund.approvedBy) {
          const [approver] = await db
            .select()
            .from(users)
            .where(eq(users.id, r.refund.approvedBy));
          approvedByUser = approver;
        }

        return {
          ...r.refund,
          booking: r.booking,
          payment: r.payment,
          requestedByUser: r.requestedByUser,
          approvedByUser,
        };
      })
    );

    return refundsWithApprover;
  }

  /**
   * Get refund by ID with full details
   */
  static async getRefundWithDetails(refundId: string): Promise<RefundWithDetails | null> {
    const [result] = await db
      .select({
        refund: refunds,
        booking: bookings,
        payment: payments,
        requestedByUser: users,
      })
      .from(refunds)
      .innerJoin(bookings, eq(refunds.bookingId, bookings.id))
      .innerJoin(payments, eq(refunds.paymentId, payments.id))
      .innerJoin(users, eq(refunds.requestedBy, users.id))
      .where(eq(refunds.id, refundId));

    if (!result) {
      return null;
    }

    // Get approved by user if exists
    let approvedByUser = null;
    if (result.refund.approvedBy) {
      const [approver] = await db
        .select()
        .from(users)
        .where(eq(users.id, result.refund.approvedBy));
      approvedByUser = approver;
    }

    return {
      ...result.refund,
      booking: result.booking,
      payment: result.payment,
      requestedByUser: result.requestedByUser,
      approvedByUser,
    };
  }

  /**
   * Get refunds for a specific user
   */
  static async getUserRefunds(userId: string): Promise<RefundWithDetails[]> {
    const results = await db
      .select({
        refund: refunds,
        booking: bookings,
        payment: payments,
        requestedByUser: users,
      })
      .from(refunds)
      .innerJoin(bookings, eq(refunds.bookingId, bookings.id))
      .innerJoin(payments, eq(refunds.paymentId, payments.id))
      .innerJoin(users, eq(refunds.requestedBy, users.id))
      .where(eq(refunds.requestedBy, userId))
      .orderBy(desc(refunds.requestedAt));

    return results.map(r => ({
      ...r.refund,
      booking: r.booking,
      payment: r.payment,
      requestedByUser: r.requestedByUser,
    }));
  }

  /**
   * Send refund confirmation emails
   */
  private static async sendRefundConfirmations(refund: RefundWithDetails): Promise<void> {
    // Email to customer
    await EmailService.sendRefundProcessedEmail(
      refund.requestedByUser.email,
      refund
    );

    // Email to admin
    await EmailService.sendRefundProcessedAdminEmail(refund);
  }

  /**
   * Notify admin of new refund request
   */
  private static async notifyAdminOfRefundRequest(refund: RefundWithDetails): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@reactfasttraining.co.uk';
    await EmailService.sendRefundRequestAdminNotification(adminEmail, refund);
  }

}