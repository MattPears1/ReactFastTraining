import { injectable, inject } from '@loopback/core';
import { db } from '../db';
import { 
  payments, 
  paymentTransactions,
  refunds,
  bookings,
  users,
  paymentEvents,
  paymentMethods,
  paymentReconciliations
} from '../db/schema';
import { eq, and, sql, desc, gte, lte, or, like } from 'drizzle-orm';
import Stripe from 'stripe';
import { UserManagementService } from './user-management.service';
import { EmailService } from './email.service';
import { ActivityLogService } from './activity-log.service';

export interface CreatePaymentData {
  bookingId: number;
  userId: number;
  amount: number;
  currency?: string;
  paymentMethod: string;
  description?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
}

export interface CreateRefundData {
  paymentId?: string;
  bookingId: number;
  userId: number;
  amount: number;
  reason: string;
  reasonDetails?: string;
  requestedBy: number;
}

export interface PaymentSearchParams {
  reference?: string;
  customerEmail?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  totalRefunds: number;
  refundAmount: number;
  netAmount: number;
  pendingPayments: number;
  failedPayments: number;
}

@injectable()
export class PaymentManagementService {
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
   * Create a new payment record
   */
  async createPayment(data: CreatePaymentData): Promise<any> {
    try {
      // Generate payment reference
      const paymentReference = await this.generatePaymentReference();

      // Create payment record
      const [payment] = await db.insert(payments).values({
        bookingId: data.bookingId,
        userId: data.userId,
        paymentReference,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeCustomerId: data.stripeCustomerId,
        amount: data.amount.toFixed(2),
        currency: data.currency || 'GBP',
        paymentMethod: data.paymentMethod,
        status: 'pending',
        description: data.description,
        paymentDate: new Date(),
      }).returning();

      // Log payment creation
      await this.logPaymentEvent({
        paymentId: payment.id,
        eventType: 'payment.created',
        eventSource: 'system',
        eventData: {
          amount: data.amount,
          bookingId: data.bookingId,
          userId: data.userId,
        },
      });

      // Update booking payment status
      await db
        .update(bookings)
        .set({
          paymentStatus: 'pending',
          paymentAmount: data.amount,
          stripePaymentIntentId: data.stripePaymentIntentId,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, data.bookingId));

      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string, 
    status: string, 
    additionalData?: any
  ): Promise<any> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      const [updatedPayment] = await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, paymentId))
        .returning();

      // Log status update
      await this.logPaymentEvent({
        paymentId,
        eventType: `payment.${status}`,
        eventSource: 'system',
        eventData: {
          previousStatus: 'unknown', // TODO: Get previous status
          newStatus: status,
          ...additionalData,
        },
      });

      // Update booking status if payment succeeded
      if (status === 'succeeded' && updatedPayment) {
        await db
          .update(bookings)
          .set({
            paymentStatus: 'paid',
            status: 'confirmed',
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, updatedPayment.bookingId));

        // Update user statistics
        await this.userManagementService.updateCustomerStatistics(updatedPayment.userId);
      }

      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Create a refund
   */
  async createRefund(data: CreateRefundData): Promise<any> {
    try {
      // Generate refund reference
      const refundReference = await this.generateRefundReference();

      // Find the payment if payment ID provided
      let payment;
      if (data.paymentId) {
        [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, data.paymentId))
          .limit(1);
      }

      // Create refund record
      const [refund] = await db.insert(refunds).values({
        bookingId: data.bookingId,
        userId: data.userId,
        paymentId: data.paymentId,
        refundReference,
        amount: data.amount.toFixed(2),
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        status: 'pending',
        createdById: data.requestedBy,
      }).returning();

      // Log refund creation
      await this.logPaymentEvent({
        refundId: refund.id,
        paymentId: data.paymentId,
        eventType: 'refund.created',
        eventSource: 'system',
        eventData: {
          amount: data.amount,
          reason: data.reason,
          bookingId: data.bookingId,
        },
      });

      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Process a refund through Stripe
   */
  async processRefund(refundId: number, approvedBy: number): Promise<any> {
    try {
      // Get refund details
      const [refund] = await db
        .select()
        .from(refunds)
        .where(eq(refunds.id, refundId))
        .limit(1);

      if (!refund) {
        throw new Error('Refund not found');
      }

      if (refund.status !== 'pending') {
        throw new Error('Refund is not in pending status');
      }

      // Get payment details
      let payment;
      if (refund.paymentId) {
        [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, refund.paymentId))
          .limit(1);
      }

      if (!payment || !payment.stripeChargeId) {
        throw new Error('Payment not found or no Stripe charge to refund');
      }

      // Update refund to approved
      await db
        .update(refunds)
        .set({
          status: 'approved',
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundId));

      // Create Stripe refund
      const stripeRefund = await this.stripe.refunds.create({
        charge: payment.stripeChargeId,
        amount: Math.round(parseFloat(refund.amount) * 100), // Convert to cents
        reason: this.mapRefundReason(refund.reason),
        metadata: {
          refundId: refund.id.toString(),
          bookingId: refund.bookingId.toString(),
        },
      });

      // Update refund with Stripe ID
      await db
        .update(refunds)
        .set({
          stripeRefundId: stripeRefund.id,
          status: 'processing',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundId));

      // Log refund processing
      await this.logPaymentEvent({
        refundId: refund.id,
        paymentId: payment.id,
        eventType: 'refund.processing',
        eventSource: 'system',
        eventData: {
          stripeRefundId: stripeRefund.id,
          amount: refund.amount,
          approvedBy,
        },
      });

      return { refund, stripeRefund };
    } catch (error) {
      console.error('Error processing refund:', error);
      
      // Update refund status to failed
      if (error instanceof Error) {
        await db
          .update(refunds)
          .set({
            status: 'failed',
            adminNotes: error.message,
            updatedAt: new Date(),
          })
          .where(eq(refunds.id, refundId));
      }
      
      throw error;
    }
  }

  /**
   * Search payments
   */
  async searchPayments(params: PaymentSearchParams): Promise<{
    payments: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];

      if (params.reference) {
        conditions.push(like(payments.paymentReference, `%${params.reference}%`));
      }

      if (params.status) {
        conditions.push(eq(payments.status, params.status));
      }

      if (params.paymentMethod) {
        conditions.push(eq(payments.paymentMethod, params.paymentMethod));
      }

      if (params.fromDate) {
        conditions.push(gte(payments.paymentDate, params.fromDate));
      }

      if (params.toDate) {
        conditions.push(lte(payments.paymentDate, params.toDate));
      }

      if (params.minAmount) {
        conditions.push(gte(payments.amount, params.minAmount.toString()));
      }

      if (params.maxAmount) {
        conditions.push(lte(payments.amount, params.maxAmount.toString()));
      }

      // Build query
      const query = db
        .select({
          payment: payments,
          booking: bookings,
          user: users,
        })
        .from(payments)
        .leftJoin(bookings, eq(payments.bookingId, bookings.id))
        .leftJoin(users, eq(payments.userId, users.id));

      if (params.customerEmail) {
        conditions.push(like(users.email, `%${params.customerEmail}%`));
      }

      // Apply conditions
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      // Get total count
      const countResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(payments)
        .leftJoin(bookings, eq(payments.bookingId, bookings.id))
        .leftJoin(users, eq(payments.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = Number(countResult[0].count);

      // Get paginated results
      const results = await query
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        payments: results.map(r => ({
          ...r.payment,
          booking: r.booking,
          customer: r.user ? {
            id: r.user.id,
            email: r.user.email,
            name: `${r.user.firstName} ${r.user.lastName}`.trim(),
            phone: r.user.phone,
          } : null,
        })),
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error searching payments:', error);
      throw error;
    }
  }

  /**
   * Get payment summary for a date range
   */
  async getPaymentSummary(
    startDate: Date, 
    endDate: Date
  ): Promise<PaymentSummary> {
    try {
      // Get payment statistics
      const paymentStats = await db
        .select({
          totalPayments: sql`COUNT(*)`,
          totalAmount: sql`COALESCE(SUM(amount), 0)`,
          pendingCount: sql`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
          failedCount: sql`COUNT(CASE WHEN status = 'failed' THEN 1 END)`,
        })
        .from(payments)
        .where(and(
          gte(payments.paymentDate, startDate),
          lte(payments.paymentDate, endDate)
        ));

      // Get refund statistics
      const refundStats = await db
        .select({
          totalRefunds: sql`COUNT(*)`,
          refundAmount: sql`COALESCE(SUM(amount), 0)`,
        })
        .from(refunds)
        .where(and(
          gte(refunds.createdAt, startDate),
          lte(refunds.createdAt, endDate),
          eq(refunds.status, 'completed')
        ));

      const stats = paymentStats[0];
      const refunds = refundStats[0];

      return {
        totalPayments: Number(stats.totalPayments),
        totalAmount: Number(stats.totalAmount),
        totalRefunds: Number(refunds.totalRefunds),
        refundAmount: Number(refunds.refundAmount),
        netAmount: Number(stats.totalAmount) - Number(refunds.refundAmount),
        pendingPayments: Number(stats.pendingCount),
        failedPayments: Number(stats.failedCount),
      };
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const result = await db
        .select({
          payment: payments,
          booking: bookings,
          user: users,
        })
        .from(payments)
        .leftJoin(bookings, eq(payments.bookingId, bookings.id))
        .leftJoin(users, eq(payments.userId, users.id))
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const paymentData = result[0];

      // Get refunds for this payment
      const paymentRefunds = await db
        .select()
        .from(refunds)
        .where(eq(refunds.paymentId, paymentId))
        .orderBy(desc(refunds.createdAt));

      // Get payment events
      const events = await db
        .select()
        .from(paymentEvents)
        .where(eq(paymentEvents.paymentId, paymentId))
        .orderBy(desc(paymentEvents.createdAt));

      return {
        ...paymentData.payment,
        booking: paymentData.booking,
        customer: paymentData.user ? {
          id: paymentData.user.id,
          email: paymentData.user.email,
          name: `${paymentData.user.firstName} ${paymentData.user.lastName}`.trim(),
          phone: paymentData.user.phone,
          company: paymentData.user.companyName,
        } : null,
        refunds: paymentRefunds,
        events,
      };
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(
    userId: number,
    stripePaymentMethodId: string
  ): Promise<any> {
    try {
      // Get payment method details from Stripe
      const paymentMethod = await this.stripe.paymentMethods.retrieve(
        stripePaymentMethodId
      );

      // Check if it already exists
      const existing = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.stripePaymentMethodId, stripePaymentMethodId))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Save payment method
      const [savedMethod] = await db.insert(paymentMethods).values({
        userId,
        stripePaymentMethodId,
        cardBrand: paymentMethod.card?.brand,
        cardLastFour: paymentMethod.card?.last4,
        cardExpMonth: paymentMethod.card?.exp_month,
        cardExpYear: paymentMethod.card?.exp_year,
        isDefault: false,
        isActive: true,
      }).returning();

      return savedMethod;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  }

  /**
   * Get user payment methods
   */
  async getUserPaymentMethods(userId: number): Promise<any[]> {
    try {
      const methods = await db
        .select()
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isActive, true)
        ))
        .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));

      return methods;
    } catch (error) {
      console.error('Error getting user payment methods:', error);
      throw error;
    }
  }

  /**
   * Generate invoice number
   */
  async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const yearMonth = date.toISOString().slice(0, 7).replace('-', '');
    
    // Get the last invoice number for this month
    const lastInvoice = await db
      .select({ invoiceNumber: payments.invoiceNumber })
      .from(payments)
      .where(like(payments.invoiceNumber, `INV-${yearMonth}-%`))
      .orderBy(desc(payments.invoiceNumber))
      .limit(1);

    let sequence = 1;
    if (lastInvoice.length > 0 && lastInvoice[0].invoiceNumber) {
      const lastSequence = parseInt(lastInvoice[0].invoiceNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `INV-${yearMonth}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create reconciliation report
   */
  async createReconciliation(
    startDate: Date,
    endDate: Date,
    reconciledBy: number
  ): Promise<any> {
    try {
      // Get payment and refund totals
      const summary = await this.getPaymentSummary(startDate, endDate);

      // Create reconciliation record
      const [reconciliation] = await db.insert(paymentReconciliations).values({
        reconciliationDate: new Date(),
        startDate,
        endDate,
        totalPaymentsCount: summary.totalPayments,
        totalPaymentsAmount: summary.totalAmount.toFixed(2),
        totalRefundsCount: summary.totalRefunds,
        totalRefundsAmount: summary.refundAmount.toFixed(2),
        totalFees: '0.00', // TODO: Calculate actual fees
        netAmount: summary.netAmount.toFixed(2),
        status: 'pending',
        reconciledBy,
      }).returning();

      return reconciliation;
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      throw error;
    }
  }

  /**
   * Generate payment reference
   */
  private async generatePaymentReference(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${dateStr}-${random}`;
  }

  /**
   * Generate refund reference
   */
  private async generateRefundReference(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REF-${dateStr}-${random}`;
  }

  /**
   * Map refund reason to Stripe format
   */
  private mapRefundReason(reason: string): 'duplicate' | 'fraudulent' | 'requested_by_customer' {
    switch (reason) {
      case 'duplicate_booking':
        return 'duplicate';
      case 'fraudulent':
        return 'fraudulent';
      default:
        return 'requested_by_customer';
    }
  }

  /**
   * Log payment event
   */
  private async logPaymentEvent(data: {
    paymentId?: string;
    paymentTransactionId?: number;
    refundId?: number;
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
   * Migrate payment transactions to payments table
   */
  async migratePaymentTransactions(): Promise<{
    migrated: number;
    failed: number;
  }> {
    try {
      let migrated = 0;
      let failed = 0;

      // Get all payment transactions not yet migrated
      const transactions = await db
        .select({
          transaction: paymentTransactions,
          booking: bookings,
        })
        .from(paymentTransactions)
        .leftJoin(bookings, eq(paymentTransactions.bookingId, bookings.id))
        .where(sql`NOT EXISTS (
          SELECT 1 FROM payments p 
          WHERE p.payment_transaction_id = payment_transactions.id
        )`);

      for (const { transaction, booking } of transactions) {
        try {
          const paymentReference = await this.generatePaymentReference();
          
          await db.insert(payments).values({
            paymentTransactionId: transaction.id,
            bookingId: transaction.bookingId,
            userId: booking?.userId,
            paymentReference,
            stripePaymentIntentId: transaction.stripePaymentIntentId,
            stripeChargeId: transaction.stripeChargeId,
            amount: transaction.amount,
            currency: transaction.currency || 'GBP',
            paymentMethod: transaction.paymentMethod,
            status: transaction.status,
            failureReason: transaction.failureReason,
            paymentDate: transaction.createdAt,
            description: `Migrated from payment transaction ${transaction.id}`,
          });
          
          migrated++;
        } catch (error) {
          console.error(`Failed to migrate transaction ${transaction.id}:`, error);
          failed++;
        }
      }

      return { migrated, failed };
    } catch (error) {
      console.error('Error migrating payment transactions:', error);
      throw error;
    }
  }
}