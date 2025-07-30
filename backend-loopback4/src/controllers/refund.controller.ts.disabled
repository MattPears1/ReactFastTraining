import {
  post,
  get,
  patch,
  requestBody,
  param,
  HttpErrors,
  RestBindings,
  Request,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { RefundService } from '../services/refund.service';
import { RefundStatus } from '../db/schema';

interface RefundRequestBody {
  bookingId: string;
  reason: string;
}

interface RefundApprovalBody {
  notes?: string;
}

interface RefundRejectionBody {
  reason: string;
}

export class RefundController {
  constructor() {}

  // Customer endpoints

  @post('/api/refunds/request')
  @authenticate('jwt')
  async requestRefund(
    @requestBody() data: RefundRequestBody,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      if (!data.bookingId || !data.reason) {
        throw new HttpErrors.BadRequest('Booking ID and reason are required');
      }

      const refund = await RefundService.requestRefund({
        bookingId: data.bookingId,
        reason: data.reason,
        requestedBy: request.user.id,
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        message: 'Refund request submitted successfully. You will be notified once it is processed.',
      };
    } catch (error) {
      console.error('Refund request error:', error);
      if (error instanceof Error) {
        throw new HttpErrors.BadRequest(error.message);
      }
      throw new HttpErrors.InternalServerError('Failed to process refund request');
    }
  }

  @get('/api/refunds/my-refunds')
  @authenticate('jwt')
  async getMyRefunds(
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      const refunds = await RefundService.getUserRefunds(request.user.id);

      return {
        refunds: refunds.map(r => ({
          id: r.id,
          bookingReference: r.booking.bookingReference,
          amount: r.amount,
          reason: r.reason,
          status: r.status,
          requestedAt: r.requestedAt,
          processedAt: r.processedAt,
          notes: r.notes,
        })),
        total: refunds.length,
      };
    } catch (error) {
      console.error('Get refunds error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve refunds');
    }
  }

  @get('/api/refunds/{refundId}')
  @authenticate('jwt')
  async getRefund(
    @param.path.string('refundId') refundId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      const refund = await RefundService.getRefundWithDetails(refundId);

      if (!refund) {
        throw new HttpErrors.NotFound('Refund not found');
      }

      // Verify user owns this refund
      if (refund.requestedBy !== request.user.id && request.user.role !== 'admin') {
        throw new HttpErrors.Forbidden('Access denied');
      }

      return {
        id: refund.id,
        bookingReference: refund.booking.bookingReference,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        requestedAt: refund.requestedAt,
        approvedAt: refund.approvedAt,
        processedAt: refund.processedAt,
        notes: refund.notes,
        courseDetails: {
          courseType: refund.booking.courseDetails?.courseType,
          sessionDate: refund.booking.courseDetails?.sessionDate,
        },
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      console.error('Get refund error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve refund details');
    }
  }

  // Admin endpoints

  @get('/api/admin/refunds')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async listRefunds(
    @param.query.string('status') status?: RefundStatus,
    @param.query.number('limit') limit = 50,
    @param.query.number('offset') offset = 0
  ): Promise<any> {
    try {
      const refunds = await RefundService.getRefundsByStatus(status, limit, offset);

      return {
        refunds: refunds.map(r => ({
          id: r.id,
          bookingReference: r.booking.bookingReference,
          customerName: r.requestedByUser.name,
          customerEmail: r.requestedByUser.email,
          amount: r.amount,
          reason: r.reason,
          status: r.status,
          requestedAt: r.requestedAt,
          approvedAt: r.approvedAt,
          processedAt: r.processedAt,
          approvedBy: r.approvedByUser?.name,
          notes: r.notes,
          stripeRefundId: r.stripeRefundId,
        })),
        total: refunds.length,
        limit,
        offset,
      };
    } catch (error) {
      console.error('List refunds error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve refunds');
    }
  }

  @get('/api/admin/refunds/stats')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getRefundStats(): Promise<any> {
    try {
      // Get all refunds for statistics
      const allRefunds = await RefundService.getRefundsByStatus();

      const stats = {
        total: allRefunds.length,
        pending: allRefunds.filter(r => r.status === RefundStatus.PENDING).length,
        approved: allRefunds.filter(r => r.status === RefundStatus.APPROVED).length,
        processed: allRefunds.filter(r => r.status === RefundStatus.PROCESSED).length,
        rejected: allRefunds.filter(r => r.status === RefundStatus.REJECTED).length,
        failed: allRefunds.filter(r => r.status === RefundStatus.FAILED).length,
        totalAmount: allRefunds
          .filter(r => r.status === RefundStatus.PROCESSED)
          .reduce((sum, r) => sum + parseFloat(r.amount), 0),
        pendingAmount: allRefunds
          .filter(r => r.status === RefundStatus.PENDING)
          .reduce((sum, r) => sum + parseFloat(r.amount), 0),
      };

      return stats;
    } catch (error) {
      console.error('Get refund stats error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve refund statistics');
    }
  }

  @patch('/api/admin/refunds/{refundId}/approve')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async approveRefund(
    @param.path.string('refundId') refundId: string,
    @requestBody() data: RefundApprovalBody,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      await RefundService.approveRefund({
        refundId,
        approvedBy: request.user.id,
        notes: data.notes,
      });

      return {
        success: true,
        message: 'Refund approved and processing initiated',
      };
    } catch (error) {
      console.error('Approve refund error:', error);
      if (error instanceof Error) {
        throw new HttpErrors.BadRequest(error.message);
      }
      throw new HttpErrors.InternalServerError('Failed to approve refund');
    }
  }

  @patch('/api/admin/refunds/{refundId}/reject')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async rejectRefund(
    @param.path.string('refundId') refundId: string,
    @requestBody() data: RefundRejectionBody,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      if (!data.reason) {
        throw new HttpErrors.BadRequest('Rejection reason is required');
      }

      await RefundService.rejectRefund(
        refundId,
        request.user.id,
        data.reason
      );

      return {
        success: true,
        message: 'Refund request rejected',
      };
    } catch (error) {
      console.error('Reject refund error:', error);
      if (error instanceof Error) {
        throw new HttpErrors.BadRequest(error.message);
      }
      throw new HttpErrors.InternalServerError('Failed to reject refund');
    }
  }

  @get('/api/admin/refunds/{refundId}')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getRefundDetails(
    @param.path.string('refundId') refundId: string
  ): Promise<any> {
    try {
      const refund = await RefundService.getRefundWithDetails(refundId);

      if (!refund) {
        throw new HttpErrors.NotFound('Refund not found');
      }

      return {
        id: refund.id,
        booking: {
          id: refund.booking.id,
          reference: refund.booking.bookingReference,
          courseType: refund.booking.courseDetails?.courseType,
          sessionDate: refund.booking.courseDetails?.sessionDate,
          totalAmount: refund.booking.totalAmount,
        },
        payment: {
          id: refund.payment.id,
          stripePaymentIntentId: refund.payment.stripePaymentIntentId,
          amount: refund.payment.amount,
          status: refund.payment.status,
          createdAt: refund.payment.createdAt,
        },
        customer: {
          id: refund.requestedByUser.id,
          name: refund.requestedByUser.name,
          email: refund.requestedByUser.email,
        },
        refundDetails: {
          amount: refund.amount,
          reason: refund.reason,
          status: refund.status,
          requestedAt: refund.requestedAt,
          approvedAt: refund.approvedAt,
          processedAt: refund.processedAt,
          stripeRefundId: refund.stripeRefundId,
          notes: refund.notes,
        },
        approvedBy: refund.approvedByUser ? {
          id: refund.approvedByUser.id,
          name: refund.approvedByUser.name,
          email: refund.approvedByUser.email,
        } : null,
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      console.error('Get refund details error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve refund details');
    }
  }
}