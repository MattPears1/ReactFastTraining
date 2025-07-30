import { db } from '../config/database.config';
import {
  invoices,
  bookings,
  users,
  payments,
  courseSessions,
  bookingAttendees,
  Invoice,
  NewInvoice,
} from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';
import { InvoicePDFGenerator } from './pdf/invoice-generator';

interface InvoiceWithDetails extends Invoice {
  booking: any;
  user: any;
  payment?: any;
  courseDetails?: any;
  attendees?: any[];
}

export class InvoiceService {
  /**
   * Generate a unique invoice number
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Get the next sequence number from the database
    const result = await db.execute(sql`SELECT nextval('invoice_number_seq') as seq`);
    const sequence = result.rows[0].seq;
    
    return `INV-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  /**
   * Create an invoice for a booking
   */
  static async createInvoice(bookingId: string): Promise<Invoice> {
    // Get booking with all details
    const bookingDetails = await this.getBookingFullDetails(bookingId);
    
    if (!bookingDetails) {
      throw new Error('Booking not found');
    }

    // Check if invoice already exists
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.bookingId, bookingId));

    if (existingInvoice) {
      return existingInvoice;
    }

    // Create invoice record
    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber: await this.generateInvoiceNumber(),
        bookingId,
        userId: bookingDetails.booking.userId,
        paymentId: bookingDetails.payment?.id,
        subtotal: bookingDetails.booking.totalAmount,
        taxAmount: '0', // No VAT initially
        totalAmount: bookingDetails.booking.totalAmount,
        status: 'paid',
        issueDate: new Date().toISOString().split('T')[0], // Date only
      })
      .returning();

    // Generate PDF
    try {
      const pdfBuffer = await this.generateInvoicePDF(invoice.id);
      
      // Store PDF
      const pdfPath = await StorageService.saveInvoicePDF(
        invoice.invoiceNumber,
        pdfBuffer
      );

      // Update invoice with PDF URL
      await db
        .update(invoices)
        .set({
          pdfUrl: pdfPath,
          pdfGeneratedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      // Send invoice email
      await this.sendInvoice(invoice.id);

    } catch (error) {
      console.error('PDF generation or email failed:', error);
      // Don't fail invoice creation if PDF/email fails
    }

    return invoice;
  }

  /**
   * Generate invoice PDF
   */
  static async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    const invoiceData = await this.getInvoiceWithDetails(invoiceId);
    
    if (!invoiceData) {
      throw new Error('Invoice not found');
    }

    return InvoicePDFGenerator.generate(invoiceData);
  }

  /**
   * Send invoice via email
   */
  static async sendInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.getInvoiceWithDetails(invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get or generate PDF
    let pdfBuffer: Buffer;
    if (invoice.pdfUrl) {
      pdfBuffer = await StorageService.getInvoicePDF(invoice.invoiceNumber);
    } else {
      pdfBuffer = await this.generateInvoicePDF(invoiceId);
    }

    // Send email with attachment
    await EmailService.sendInvoiceEmail(
      invoice.user.email,
      invoice,
      pdfBuffer
    );

    // Update sent timestamp
    await db
      .update(invoices)
      .set({ sentAt: new Date() })
      .where(eq(invoices.id, invoiceId));
  }

  /**
   * Get invoice with full details
   */
  static async getInvoiceWithDetails(invoiceId: string): Promise<InvoiceWithDetails | null> {
    const [result] = await db
      .select({
        invoice: invoices,
        booking: bookings,
        user: users,
        payment: payments,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .leftJoin(payments, eq(invoices.paymentId, payments.id))
      .where(eq(invoices.id, invoiceId));

    if (!result) {
      return null;
    }

    // Get course details and attendees
    const courseDetails = await this.getCourseDetails(result.booking.sessionId);
    const attendees = await this.getBookingAttendees(result.booking.id);

    return {
      ...result.invoice,
      booking: result.booking,
      user: result.user,
      payment: result.payment,
      courseDetails,
      attendees,
    };
  }

  /**
   * Get invoices for a user
   */
  static async getUserInvoices(
    userId: string,
    limit = 10,
    offset = 0
  ): Promise<InvoiceWithDetails[]> {
    const results = await db
      .select({
        invoice: invoices,
        booking: bookings,
        user: users,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.issueDate))
      .limit(limit)
      .offset(offset);

    return results.map(r => ({
      ...r.invoice,
      booking: r.booking,
      user: r.user,
    }));
  }

  /**
   * Get all invoices (admin)
   */
  static async getAllInvoices(
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit = 50,
    offset = 0
  ): Promise<InvoiceWithDetails[]> {
    let query = db
      .select({
        invoice: invoices,
        booking: bookings,
        user: users,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .orderBy(desc(invoices.issueDate))
      .limit(limit)
      .offset(offset);

    if (filters?.status) {
      query = query.where(eq(invoices.status, filters.status));
    }

    const results = await query;

    return results.map(r => ({
      ...r.invoice,
      booking: r.booking,
      user: r.user,
    }));
  }

  /**
   * Void an invoice (admin only)
   */
  static async voidInvoice(invoiceId: string, reason: string): Promise<void> {
    await db
      .update(invoices)
      .set({
        status: 'void',
        metadata: sql`metadata || jsonb_build_object('voidReason', ${reason}, 'voidedAt', ${new Date().toISOString()})`,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));
  }

  /**
   * Get invoice by number
   */
  static async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));

    return invoice || null;
  }

  /**
   * Helper: Get booking full details
   */
  private static async getBookingFullDetails(bookingId: string): Promise<any> {
    const [result] = await db
      .select({
        booking: bookings,
        payment: payments,
      })
      .from(bookings)
      .leftJoin(payments, eq(bookings.id, payments.bookingId))
      .where(eq(bookings.id, bookingId));

    return result;
  }

  /**
   * Helper: Get course details
   */
  private static async getCourseDetails(sessionId: string): Promise<any> {
    const [session] = await db
      .select()
      .from(courseSessions)
      .where(eq(courseSessions.id, sessionId));

    if (!session) return null;

    // TODO: Join with courses table when available
    return {
      courseType: 'Emergency First Aid at Work', // Placeholder
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location || 'TBD',
      price: 75, // Default price
    };
  }

  /**
   * Helper: Get booking attendees
   */
  private static async getBookingAttendees(bookingId: string): Promise<any[]> {
    return await db
      .select()
      .from(bookingAttendees)
      .where(eq(bookingAttendees.bookingId, bookingId));
  }

  /**
   * Resend invoice email
   */
  static async resendInvoice(invoiceId: string): Promise<void> {
    await this.sendInvoice(invoiceId);
  }

  /**
   * Get invoice statistics (admin)
   */
  static async getInvoiceStats(): Promise<{
    total: number;
    totalAmount: number;
    thisMonth: number;
    thisMonthAmount: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all invoices
    const allInvoices = await db
      .select({
        totalAmount: invoices.totalAmount,
        issueDate: invoices.issueDate,
      })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    const stats = {
      total: allInvoices.length,
      totalAmount: allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0),
      thisMonth: 0,
      thisMonthAmount: 0,
    };

    // Calculate this month's stats
    allInvoices.forEach(inv => {
      const invoiceDate = new Date(inv.issueDate);
      if (invoiceDate >= startOfMonth) {
        stats.thisMonth++;
        stats.thisMonthAmount += parseFloat(inv.totalAmount);
      }
    });

    return stats;
  }
}