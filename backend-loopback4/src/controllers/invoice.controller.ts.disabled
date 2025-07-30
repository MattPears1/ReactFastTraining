import {
  post,
  get,
  patch,
  requestBody,
  param,
  HttpErrors,
  RestBindings,
  Request,
  Response,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { InvoiceService } from '../services/invoice.service';
import { db } from '../config/database.config';
import { bookings } from '../db/schema';
import { eq } from 'drizzle-orm';

interface GenerateInvoiceRequest {
  bookingId: string;
}

interface VoidInvoiceRequest {
  reason: string;
}

export class InvoiceController {
  constructor() {}

  // Customer endpoints

  @post('/api/invoices/generate/{bookingId}')
  @authenticate('jwt')
  async generateInvoice(
    @param.path.string('bookingId') bookingId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      // Verify user owns booking
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));

      if (!booking) {
        throw new HttpErrors.NotFound('Booking not found');
      }

      if (booking.userId !== request.user.id) {
        throw new HttpErrors.Forbidden('Access denied');
      }

      if (booking.status !== 'confirmed') {
        throw new HttpErrors.BadRequest('Invoice can only be generated for confirmed bookings');
      }

      const invoice = await InvoiceService.createInvoice(bookingId);

      return {
        success: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount,
          status: invoice.status,
          issueDate: invoice.issueDate,
          pdfUrl: invoice.pdfUrl,
        },
      };
    } catch (error) {
      console.error('Invoice generation error:', error);
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.InternalServerError('Failed to generate invoice');
    }
  }

  @get('/api/invoices')
  @authenticate('jwt')
  async getUserInvoices(
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any },
    @param.query.number('limit') limit = 10,
    @param.query.number('offset') offset = 0
  ): Promise<any> {
    try {
      const invoices = await InvoiceService.getUserInvoices(
        request.user.id,
        limit,
        offset
      );

      return {
        invoices: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          bookingReference: inv.booking.bookingReference,
          amount: inv.totalAmount,
          status: inv.status,
          issueDate: inv.issueDate,
          pdfUrl: inv.pdfUrl,
          sentAt: inv.sentAt,
        })),
        total: invoices.length,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Get invoices error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve invoices');
    }
  }

  @get('/api/invoices/{invoiceId}')
  @authenticate('jwt')
  async getInvoice(
    @param.path.string('invoiceId') invoiceId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      const invoice = await InvoiceService.getInvoiceWithDetails(invoiceId);

      if (!invoice) {
        throw new HttpErrors.NotFound('Invoice not found');
      }

      // Verify user owns this invoice
      if (invoice.userId !== request.user.id && request.user.role !== 'admin') {
        throw new HttpErrors.Forbidden('Access denied');
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        pdfUrl: invoice.pdfUrl,
        booking: {
          reference: invoice.booking.bookingReference,
          courseType: invoice.courseDetails?.courseType,
          sessionDate: invoice.courseDetails?.sessionDate,
          numberOfAttendees: invoice.booking.numberOfAttendees,
        },
        customer: {
          name: invoice.user.name,
          email: invoice.user.email,
        },
        attendees: invoice.attendees,
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      console.error('Get invoice error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve invoice');
    }
  }

  @get('/api/invoices/{invoiceId}/download')
  @authenticate('jwt')
  async downloadInvoice(
    @param.path.string('invoiceId') invoiceId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any },
    @inject(RestBindings.Http.RESPONSE) response: Response
  ): Promise<void> {
    try {
      const invoice = await InvoiceService.getInvoiceWithDetails(invoiceId);

      if (!invoice) {
        throw new HttpErrors.NotFound('Invoice not found');
      }

      // Verify user owns this invoice
      if (invoice.userId !== request.user.id && request.user.role !== 'admin') {
        throw new HttpErrors.Forbidden('Access denied');
      }

      const pdfBuffer = await InvoiceService.generateInvoicePDF(invoiceId);

      response.contentType('application/pdf');
      response.header(
        'Content-Disposition',
        `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      );
      response.send(pdfBuffer);
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      console.error('Download invoice error:', error);
      throw new HttpErrors.InternalServerError('Failed to download invoice');
    }
  }

  @post('/api/invoices/{invoiceId}/resend')
  @authenticate('jwt')
  async resendInvoice(
    @param.path.string('invoiceId') invoiceId: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      const invoice = await InvoiceService.getInvoiceWithDetails(invoiceId);

      if (!invoice) {
        throw new HttpErrors.NotFound('Invoice not found');
      }

      // Verify user owns this invoice
      if (invoice.userId !== request.user.id && request.user.role !== 'admin') {
        throw new HttpErrors.Forbidden('Access denied');
      }

      await InvoiceService.resendInvoice(invoiceId);

      return {
        success: true,
        message: 'Invoice has been sent to your email',
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      console.error('Resend invoice error:', error);
      throw new HttpErrors.InternalServerError('Failed to resend invoice');
    }
  }

  // Admin endpoints

  @get('/api/admin/invoices')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async listAllInvoices(
    @param.query.string('status') status?: string,
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
    @param.query.number('limit') limit = 50,
    @param.query.number('offset') offset = 0
  ): Promise<any> {
    try {
      const filters: any = {};
      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const invoices = await InvoiceService.getAllInvoices(filters, limit, offset);

      return {
        invoices: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.user.name,
          customerEmail: inv.user.email,
          bookingReference: inv.booking.bookingReference,
          amount: inv.totalAmount,
          status: inv.status,
          issueDate: inv.issueDate,
          pdfUrl: inv.pdfUrl,
          sentAt: inv.sentAt,
        })),
        total: invoices.length,
        limit,
        offset,
      };
    } catch (error) {
      console.error('List invoices error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve invoices');
    }
  }

  @get('/api/admin/invoices/stats')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getInvoiceStats(): Promise<any> {
    try {
      const stats = await InvoiceService.getInvoiceStats();
      return stats;
    } catch (error) {
      console.error('Get invoice stats error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve invoice statistics');
    }
  }

  @patch('/api/admin/invoices/{invoiceId}/void')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async voidInvoice(
    @param.path.string('invoiceId') invoiceId: string,
    @requestBody() data: VoidInvoiceRequest
  ): Promise<any> {
    try {
      if (!data.reason) {
        throw new HttpErrors.BadRequest('Reason is required to void an invoice');
      }

      await InvoiceService.voidInvoice(invoiceId, data.reason);

      return {
        success: true,
        message: 'Invoice has been voided',
      };
    } catch (error) {
      console.error('Void invoice error:', error);
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.InternalServerError('Failed to void invoice');
    }
  }

  @post('/api/admin/invoices/{bookingId}/regenerate')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async regenerateInvoice(
    @param.path.string('bookingId') bookingId: string
  ): Promise<any> {
    try {
      const invoice = await InvoiceService.createInvoice(bookingId);

      return {
        success: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount,
          status: invoice.status,
          pdfUrl: invoice.pdfUrl,
        },
      };
    } catch (error) {
      console.error('Regenerate invoice error:', error);
      throw new HttpErrors.InternalServerError('Failed to regenerate invoice');
    }
  }

  @get('/api/invoices/number/{invoiceNumber}')
  @authenticate('jwt')
  async getInvoiceByNumber(
    @param.path.string('invoiceNumber') invoiceNumber: string,
    @inject(RestBindings.Http.REQUEST) request: Request & { user?: any }
  ): Promise<any> {
    try {
      const invoice = await InvoiceService.getInvoiceByNumber(invoiceNumber);

      if (!invoice) {
        throw new HttpErrors.NotFound('Invoice not found');
      }

      // Get full details
      const invoiceDetails = await InvoiceService.getInvoiceWithDetails(invoice.id);

      if (!invoiceDetails) {
        throw new HttpErrors.NotFound('Invoice details not found');
      }

      // Verify user owns this invoice
      if (invoiceDetails.userId !== request.user.id && request.user.role !== 'admin') {
        throw new HttpErrors.Forbidden('Access denied');
      }

      return {
        id: invoiceDetails.id,
        invoiceNumber: invoiceDetails.invoiceNumber,
        amount: invoiceDetails.totalAmount,
        status: invoiceDetails.status,
        issueDate: invoiceDetails.issueDate,
        pdfUrl: invoiceDetails.pdfUrl,
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      console.error('Get invoice by number error:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve invoice');
    }
  }
}