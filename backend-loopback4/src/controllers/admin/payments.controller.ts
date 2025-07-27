import {
  get,
  post,
  put,
  del,
  param,
  requestBody,
  response,
  RestBindings,
  Request,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { PaymentManagementService } from '../../services/payment-management.service';
import { ActivityLogService } from '../../services/activity-log.service';

interface PaymentSearchRequest {
  reference?: string;
  customerEmail?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

interface CreateRefundRequest {
  paymentId?: string;
  bookingId: number;
  amount: number;
  reason: string;
  reasonDetails?: string;
}

interface RecordManualPaymentRequest {
  bookingId: number;
  userId: number;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

@authenticate('jwt')
@authorize({ allowedRoles: ['admin'] })
export class AdminPaymentsController {
  constructor(
    @inject('services.PaymentManagementService')
    private paymentService: PaymentManagementService,
    @inject('services.ActivityLogService')
    private activityLogService: ActivityLogService,
    @inject(RestBindings.Http.REQUEST)
    private request: Request,
  ) {}

  /**
   * List payments with search and filters
   */
  @get('/api/admin/payments', {
    responses: {
      '200': {
        description: 'Array of payments with pagination',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                payments: { type: 'array' },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  async listPayments(
    @param.query.string('reference') reference?: string,
    @param.query.string('customerEmail') customerEmail?: string,
    @param.query.string('status') status?: string,
    @param.query.string('fromDate') fromDate?: string,
    @param.query.string('toDate') toDate?: string,
    @param.query.number('minAmount') minAmount?: number,
    @param.query.number('maxAmount') maxAmount?: number,
    @param.query.string('paymentMethod') paymentMethod?: string,
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 20,
  ): Promise<any> {
    try {
      const searchParams = {
        reference,
        customerEmail,
        status,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        minAmount,
        maxAmount,
        paymentMethod,
        page,
        limit,
      };

      const result = await this.paymentService.searchPayments(searchParams);

      // Log activity
      await this.activityLogService.log({
        adminId: (this.request as any).user?.id,
        action: 'list_payments',
        entityType: 'payment',
        newValues: { searchParams },
      });

      return result;
    } catch (error) {
      console.error('Error listing payments:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  @get('/api/admin/payments/{id}', {
    responses: {
      '200': {
        description: 'Payment details',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
      '404': {
        description: 'Payment not found',
      },
    },
  })
  async getPaymentDetails(
    @param.path.string('id') id: string,
  ): Promise<any> {
    try {
      const payment = await this.paymentService.getPaymentDetails(id);
      
      if (!payment) {
        throw { statusCode: 404, message: 'Payment not found' };
      }

      // Log activity
      await this.activityLogService.log({
        adminId: (this.request as any).user?.id,
        action: 'view_payment',
        entityType: 'payment',
        entityId: id,
      });

      return payment;
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  }

  /**
   * Record a manual payment (cash, bank transfer, etc.)
   */
  @post('/api/admin/payments/manual', {
    responses: {
      '200': {
        description: 'Manual payment recorded',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
  })
  async recordManualPayment(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['bookingId', 'userId', 'amount', 'paymentMethod'],
            properties: {
              bookingId: { type: 'number' },
              userId: { type: 'number' },
              amount: { type: 'number' },
              paymentMethod: { type: 'string' },
              reference: { type: 'string' },
              notes: { type: 'string' },
            },
          },
        },
      },
    })
    paymentData: RecordManualPaymentRequest,
  ): Promise<any> {
    try {
      const payment = await this.paymentService.createPayment({
        ...paymentData,
        description: paymentData.notes || `Manual payment - ${paymentData.paymentMethod}`,
      });

      // Update payment status to succeeded for manual payments
      await this.paymentService.updatePaymentStatus(
        payment.id,
        'succeeded',
        {
          processedBy: (this.request as any).user?.id,
        }
      );

      // Log activity
      await this.activityLogService.log({
        adminId: (this.request as any).user?.id,
        action: 'record_manual_payment',
        entityType: 'payment',
        entityId: payment.id,
        newValues: paymentData,
      });

      return payment;
    } catch (error) {
      console.error('Error recording manual payment:', error);
      throw error;
    }
  }

  /**
   * Create a refund request
   */
  @post('/api/admin/refunds', {
    responses: {
      '200': {
        description: 'Refund created',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
  })
  async createRefund(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['bookingId', 'amount', 'reason'],
            properties: {
              paymentId: { type: 'string' },
              bookingId: { type: 'number' },
              amount: { type: 'number' },
              reason: { type: 'string' },
              reasonDetails: { type: 'string' },
            },
          },
        },
      },
    })
    refundData: CreateRefundRequest,
  ): Promise<any> {
    try {
      // Get booking details to find user ID
      const { db } = require('../../db');
      const { bookings } = require('../../db/schema');
      const { eq } = require('drizzle-orm');
      
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, refundData.bookingId))
        .limit(1);

      if (!booking) {
        throw { statusCode: 404, message: 'Booking not found' };
      }

      const refund = await this.paymentService.createRefund({
        ...refundData,
        userId: booking.userId,
        requestedBy: (this.request as any).user?.id,
      });

      // Log activity
      await this.activityLogService.log({
        adminId: (this.request as any).user?.id,
        action: 'create_refund',
        entityType: 'refund',
        entityId: refund.id,
        newValues: refundData,
      });

      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * List refunds
   */
  @get('/api/admin/refunds', {
    responses: {
      '200': {
        description: 'Array of refunds',
        content: {
          'application/json': {
            schema: { type: 'array' },
          },
        },
      },
    },
  })
  async listRefunds(
    @param.query.string('status') status?: string,
    @param.query.number('bookingId') bookingId?: number,
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 20,
  ): Promise<any> {
    try {
      const { db } = require('../../db');
      const { refunds, payments, bookings, users } = require('../../db/schema');
      const { eq, and, desc } = require('drizzle-orm');

      const conditions = [];
      if (status) {
        conditions.push(eq(refunds.status, status));
      }
      if (bookingId) {
        conditions.push(eq(refunds.bookingId, bookingId));
      }

      const offset = (page - 1) * limit;
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select({
          refund: refunds,
          payment: payments,
          booking: bookings,
          user: users,
        })
        .from(refunds)
        .leftJoin(payments, eq(refunds.paymentId, payments.id))
        .leftJoin(bookings, eq(refunds.bookingId, bookings.id))
        .leftJoin(users, eq(refunds.userId, users.id))
        .where(whereClause)
        .orderBy(desc(refunds.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map(r => ({
        ...r.refund,
        payment: r.payment,
        booking: r.booking,
        customer: r.user ? {
          id: r.user.id,
          email: r.user.email,
          name: `${r.user.firstName} ${r.user.lastName}`.trim(),
        } : null,
      }));
    } catch (error) {
      console.error('Error listing refunds:', error);
      throw error;
    }
  }

  /**
   * Approve and process a refund
   */
  @put('/api/admin/refunds/{id}/approve', {
    responses: {
      '200': {
        description: 'Refund approved and processing',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
  })
  async approveRefund(
    @param.path.number('id') id: number,
  ): Promise<any> {
    try {
      const result = await this.paymentService.processRefund(
        id,
        (this.request as any).user?.id
      );

      // Log activity
      await this.activityLogService.log({
        adminId: (this.request as any).user?.id,
        action: 'approve_refund',
        entityType: 'refund',
        entityId: id.toString(),
      });

      return result;
    } catch (error) {
      console.error('Error approving refund:', error);
      throw error;
    }
  }

  /**
   * Get payment summary for dashboard
   */
  @get('/api/admin/payments/summary', {
    responses: {
      '200': {
        description: 'Payment summary statistics',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
  })
  async getPaymentSummary(
    @param.query.string('fromDate') fromDate?: string,
    @param.query.string('toDate') toDate?: string,
  ): Promise<any> {
    try {
      const startDate = fromDate ? new Date(fromDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = toDate ? new Date(toDate) : new Date();

      const summary = await this.paymentService.getPaymentSummary(startDate, endDate);

      return summary;
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw error;
    }
  }

  /**
   * Export payments to CSV
   */
  @get('/api/admin/payments/export', {
    responses: {
      '200': {
        description: 'CSV file download',
        content: {
          'text/csv': {
            schema: { type: 'string' },
          },
        },
      },
    },
  })
  async exportPayments(
    @param.query.string('fromDate') fromDate?: string,
    @param.query.string('toDate') toDate?: string,
  ): Promise<any> {
    try {
      const searchParams = {
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        page: 1,
        limit: 10000, // Get all records for export
      };

      const result = await this.paymentService.searchPayments(searchParams);

      // Convert to CSV
      const headers = [
        'Payment Reference',
        'Date',
        'Customer Name',
        'Customer Email',
        'Booking Reference',
        'Amount',
        'Method',
        'Status',
        'Invoice Number',
      ];

      const rows = result.payments.map(p => [
        p.paymentReference,
        new Date(p.paymentDate).toLocaleDateString(),
        p.customer?.name || '',
        p.customer?.email || '',
        p.booking?.bookingReference || '',
        p.amount,
        p.paymentMethod,
        p.status,
        p.invoiceNumber || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Log activity
      await this.activityLogService.log({
        adminId: (this.request as any).user?.id,
        action: 'export_payments',
        entityType: 'payment',
        newValues: { fromDate, toDate, count: rows.length },
      });

      return csv;
    } catch (error) {
      console.error('Error exporting payments:', error);
      throw error;
    }
  }

  /**
   * Create payment reconciliation report
   */
  @post('/api/admin/payments/reconcile', {
    responses: {
      '200': {
        description: 'Reconciliation report created',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
  })
  async createReconciliation(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['startDate', 'endDate'],
            properties: {
              startDate: { type: 'string' },
              endDate: { type: 'string' },
            },
          },
        },
      },
    })
    reconciliationData: {
      startDate: string;
      endDate: string;
    },
  ): Promise<any> {
    try {
      const reconciliation = await this.paymentService.createReconciliation(
        new Date(reconciliationData.startDate),
        new Date(reconciliationData.endDate),
        (this.request as any).user?.id
      );

      // Log activity
      await this.activityLogService.log({
        adminId: (this.request as any).user?.id,
        action: 'create_reconciliation',
        entityType: 'reconciliation',
        entityId: reconciliation.id,
        newValues: reconciliationData,
      });

      return reconciliation;
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      throw error;
    }
  }

  /**
   * Migrate payment transactions
   */
  @post('/api/admin/payments/migrate', {
    responses: {
      '200': {
        description: 'Migration completed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                migrated: { type: 'number' },
                failed: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  async migratePaymentTransactions(): Promise<any> {
    try {
      const result = await this.paymentService.migratePaymentTransactions();

      // Log activity
      await this.activityLogService.log({
        adminId: (this.request as any).user?.id,
        action: 'migrate_payments',
        entityType: 'payment',
        newValues: result,
      });

      return result;
    } catch (error) {
      console.error('Error migrating payments:', error);
      throw error;
    }
  }
}