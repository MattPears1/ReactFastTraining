import { db } from '../config/database.config';
import {
  invoices,
  bookings,
  users,
  payments,
  Invoice,
  NewInvoice,
} from '../db/schema';
import { eq, desc, sql, and, gte, lte, or, not } from 'drizzle-orm';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';
import { InvoicePDFGenerator } from './pdf/invoice-generator';
import { retryOperation } from '../utils/retry.util';
import {
  InvoiceWithDetails,
  InvoiceGenerationOptions,
  InvoiceFilters,
  InvoiceMetrics,
  BulkInvoiceResult,
  COMPANY_DETAILS,
} from './invoice/invoice.types';
import { InvoiceCacheService } from './invoice/invoice-cache.service';
import { InvoiceNumberService } from './invoice/invoice-number.service';
import { InvoiceMetricsService } from './invoice/invoice-metrics.service';
import { InvoiceQueryService } from './invoice/invoice-query.service';

// Enhanced Invoice Service with caching and performance optimizations
export class InvoiceServiceEnhanced {
  /**
   * Create an invoice for a booking with enhanced options
   */
  static async createInvoice(
    data: {
      bookingId: string;
      paymentId?: string;
    },
    options: InvoiceGenerationOptions = {}
  ): Promise<Invoice> {
    const cacheKey = `invoice_booking_${data.bookingId}`;
    
    // Check cache first (unless regenerating)
    if (!options.regenerate) {
      const cached = InvoiceCacheService.get<Invoice>(cacheKey);
      if (cached) {
        console.log(`Invoice found in cache for booking ${data.bookingId}`);
        return cached;
      }
    }

    // Get booking with all details in one query
    const bookingDetails = await InvoiceQueryService.getBookingFullDetailsOptimized(data.bookingId);
    
    if (!bookingDetails) {
      throw new Error('Booking not found');
    }

    if (bookingDetails.booking.status !== 'confirmed' && !options.regenerate) {
      throw new Error('Cannot create invoice for unconfirmed booking');
    }

    // Check if invoice already exists (unless regenerating)
    if (!options.regenerate) {
      const [existingInvoice] = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.bookingId, data.bookingId),
            not(eq(invoices.status, 'void'))
          )
        );

      if (existingInvoice) {
        // Cache and return existing invoice
        InvoiceCacheService.set(cacheKey, existingInvoice);
        return existingInvoice;
      }
    }

    // Calculate invoice details
    const subtotal = parseFloat(bookingDetails.booking.totalAmount);
    const taxRate = 0; // No VAT for training courses initially
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Prepare invoice data
    const invoiceData: NewInvoice = {
      invoiceNumber: await InvoiceNumberService.generateInvoiceNumber(),
      bookingId: data.bookingId,
      userId: bookingDetails.booking.userId,
      paymentId: data.paymentId || bookingDetails.payment?.id,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      status: bookingDetails.payment?.status === 'succeeded' ? 'paid' : 'issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: options.dueDate?.toISOString().split('T')[0] || null,
      notes: options.customNotes || null,
      company_details: COMPANY_DETAILS,
      customer_details: {
        name: bookingDetails.user.name || `${bookingDetails.user.firstName} ${bookingDetails.user.lastName}`,
        email: bookingDetails.user.email,
        phone: bookingDetails.user.phone,
        company: bookingDetails.user.company,
      },
      line_items: [
        {
          description: `${bookingDetails.courseDetails.name} - ${bookingDetails.courseDetails.type}`,
          quantity: bookingDetails.booking.numberOfAttendees,
          unitPrice: bookingDetails.courseDetails.price,
          total: subtotal,
          sessionDate: bookingDetails.courseSession.sessionDate,
          location: bookingDetails.courseSession.location,
        }
      ],
      metadata: {
        bookingReference: bookingDetails.booking.bookingReference,
        courseType: bookingDetails.booking.courseType,
        sessionDate: bookingDetails.courseSession.sessionDate,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      },
    };

    // Create invoice record
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();

    // Generate PDF asynchronously (unless skipped)
    if (!options.skipPDF) {
      this.generateAndStorePDF(invoice.id)
        .catch(error => {
          console.error(`Failed to generate PDF for invoice ${invoice.id}:`, error);
        });
    }

    // Send email asynchronously (unless skipped)
    if (!options.skipEmail) {
      this.sendInvoiceEmailAsync(invoice.id)
        .catch(error => {
          console.error(`Failed to send email for invoice ${invoice.id}:`, error);
        });
    }

    // Cache the invoice
    InvoiceCacheService.set(cacheKey, invoice);
    InvoiceCacheService.set(`invoice_${invoice.id}`, invoice);

    return invoice;
  }

  /**
   * Generate and store invoice PDF with better error handling
   */
  private static async generateAndStorePDF(invoiceId: string): Promise<string> {
    try {
      const startTime = Date.now();
      
      // Get full invoice details
      const invoiceData = await InvoiceQueryService.getInvoiceWithDetailsOptimized(invoiceId);
      
      if (!invoiceData) {
        throw new Error('Invoice not found');
      }

      // Generate PDF
      const pdfBuffer = await InvoicePDFGenerator.generate(invoiceData);
      
      // Store PDF with retry logic
      const pdfPath = await retryOperation(
        () => StorageService.saveInvoicePDF(invoiceData.invoiceNumber, pdfBuffer),
        3,
        1000
      );

      // Update invoice with PDF URL
      await db
        .update(invoices)
        .set({
          pdfUrl: pdfPath,
          pdfGeneratedAt: new Date(),
          metadata: sql`
            invoices.metadata || 
            jsonb_build_object(
              'pdfGenerationTime', ${Date.now() - startTime},
              'pdfSize', ${pdfBuffer.length}
            )
          `,
        })
        .where(eq(invoices.id, invoiceId));

      console.log(`PDF generated for invoice ${invoiceId} in ${Date.now() - startTime}ms`);
      
      // Clear cache for this invoice
      InvoiceCacheService.clearInvoiceCache(invoiceId);
      
      return pdfPath;
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  }

  /**
   * Send invoice email asynchronously
   */
  private static async sendInvoiceEmailAsync(invoiceId: string): Promise<void> {
    try {
      await this.sendInvoice(invoiceId);
    } catch (error) {
      console.error(`Failed to send invoice email for ${invoiceId}:`, error);
      // Don't throw - email failure shouldn't break the flow
    }
  }

  /**
   * Send invoice via email with retry logic
   */
  static async sendInvoice(invoiceId: string): Promise<void> {
    const invoice = await InvoiceQueryService.getInvoiceWithDetailsOptimized(invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get or generate PDF
    let pdfBuffer: Buffer;
    if (invoice.pdfUrl) {
      try {
        pdfBuffer = await StorageService.getInvoicePDF(invoice.invoiceNumber);
      } catch (error) {
        console.warn('Failed to retrieve PDF, regenerating:', error);
        pdfBuffer = await InvoicePDFGenerator.generate(invoice);
      }
    } else {
      // Generate PDF if not exists
      pdfBuffer = await InvoicePDFGenerator.generate(invoice);
      await this.generateAndStorePDF(invoiceId);
    }

    // Send email with retry
    await retryOperation(
      () => EmailService.sendInvoiceEmail(
        invoice.user.email,
        invoice,
        pdfBuffer
      ),
      3,
      2000
    );

    // Update sent timestamp
    await db
      .update(invoices)
      .set({ 
        sentAt: new Date(),
        metadata: sql`
          invoices.metadata || 
          jsonb_build_object(
            'lastSentAt', ${new Date().toISOString()},
            'sentCount', COALESCE((invoices.metadata->>'sentCount')::int, 0) + 1
          )
        `,
      })
      .where(eq(invoices.id, invoiceId));
    
    // Clear cache
    InvoiceCacheService.clearInvoiceCache(invoiceId);
  }

  /**
   * Get invoice with full details - optimized version
   */
  static async getInvoiceWithDetailsOptimized(invoiceId: string): Promise<InvoiceWithDetails | null> {
    return InvoiceQueryService.getInvoiceWithDetailsOptimized(invoiceId);
  }

  /**
   * Get invoices for a user with pagination and caching
   */
  static async getUserInvoices(
    userId: string,
    limit = 10,
    offset = 0
  ): Promise<{
    invoices: InvoiceWithDetails[];
    total: number;
    hasMore: boolean;
  }> {
    const cacheKey = `user_invoices_${userId}_${limit}_${offset}`;
    
    // Check cache
    const cached = InvoiceCacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.userId, userId));

    // Get invoices with details
    const results = await db
      .select({
        invoice: invoices,
        booking: bookings,
        payment: payments,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(payments, eq(invoices.paymentId, payments.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.issueDate), desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const invoicesWithDetails = results.map(r => ({
      ...r.invoice,
      booking: r.booking,
      payment: r.payment,
      user: { id: userId }, // Minimal user data
    }));

    const response = {
      invoices: invoicesWithDetails,
      total: Number(count),
      hasMore: offset + results.length < Number(count),
    };

    // Cache for 2 minutes
    InvoiceCacheService.set(cacheKey, response, 120);

    return response;
  }

  /**
   * Get all invoices with advanced filtering (admin)
   */
  static async getAllInvoices(
    filters: InvoiceFilters = {},
    limit = 50,
    offset = 0
  ): Promise<{
    invoices: InvoiceWithDetails[];
    total: number;
    metrics: InvoiceMetrics;
  }> {
    // Build conditions
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(invoices.status, filters.status));
    }

    if (filters.startDate) {
      conditions.push(gte(invoices.issueDate, filters.startDate.toISOString().split('T')[0]));
    }

    if (filters.endDate) {
      conditions.push(lte(invoices.issueDate, filters.endDate.toISOString().split('T')[0]));
    }

    if (filters.userId) {
      conditions.push(eq(invoices.userId, filters.userId));
    }

    if (filters.minAmount !== undefined) {
      conditions.push(gte(invoices.totalAmount, filters.minAmount.toString()));
    }

    if (filters.maxAmount !== undefined) {
      conditions.push(lte(invoices.totalAmount, filters.maxAmount.toString()));
    }

    if (filters.bookingReference) {
      conditions.push(eq(bookings.bookingReference, filters.bookingReference));
    }

    // Build query
    let query = db
      .select({
        invoice: invoices,
        booking: bookings,
        user: users,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add search if provided
    if (filters.search) {
      query = query.where(
        or(
          sql`${invoices.invoiceNumber} ILIKE ${'%' + filters.search + '%'}`,
          sql`${users.email} ILIKE ${'%' + filters.search + '%'}`,
          sql`${users.name} ILIKE ${'%' + filters.search + '%'}`,
          sql`${bookings.bookingReference} ILIKE ${'%' + filters.search + '%'}`
        )
      );
    }

    // Execute query with pagination
    const [results, metrics] = await Promise.all([
      query
        .orderBy(desc(invoices.issueDate), desc(invoices.createdAt))
        .limit(limit)
        .offset(offset),
      InvoiceMetricsService.getInvoiceMetrics(filters),
    ]);

    const invoicesWithDetails = results.map(r => ({
      ...r.invoice,
      booking: r.booking,
      user: r.user,
    }));

    return {
      invoices: invoicesWithDetails,
      total: metrics.total,
      metrics,
    };
  }

  /**
   * Get comprehensive invoice metrics
   */
  static async getInvoiceMetrics(filters: InvoiceFilters = {}): Promise<InvoiceMetrics> {
    return InvoiceMetricsService.getInvoiceMetrics(filters);
  }

  /**
   * Void an invoice with validation
   */
  static async voidInvoice(
    invoiceId: string, 
    reason: string,
    voidedBy: string
  ): Promise<void> {
    // Validate invoice exists and is not already void
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'void') {
      throw new Error('Invoice is already void');
    }

    // Update invoice
    await db
      .update(invoices)
      .set({
        status: 'void',
        voidedAt: new Date(),
        voidedBy,
        voidReason: reason,
        metadata: sql`
          invoices.metadata || 
          jsonb_build_object(
            'previousStatus', ${invoice.status},
            'voidedAt', ${new Date().toISOString()},
            'voidedBy', ${voidedBy},
            'voidReason', ${reason}
          )
        `,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    // Clear cache
    InvoiceCacheService.clearInvoiceCache(invoiceId);
    InvoiceCacheService.clearAllInvoiceCaches();
  }

  /**
   * Regenerate invoice PDF
   */
  static async regenerateInvoicePDF(invoiceId: string): Promise<string> {
    const invoice = await InvoiceQueryService.getInvoiceWithDetailsOptimized(invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'void') {
      throw new Error('Cannot regenerate PDF for void invoice');
    }

    // Generate new PDF
    const pdfPath = await this.generateAndStorePDF(invoiceId);
    
    return pdfPath;
  }

  /**
   * Get invoice by number with caching
   */
  static async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const cacheKey = `invoice_number_${invoiceNumber}`;
    
    // Check cache
    const cached = InvoiceCacheService.get<Invoice>(cacheKey);
    if (cached) {
      return cached;
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));

    if (invoice) {
      // Cache for 10 minutes
      InvoiceCacheService.set(cacheKey, invoice, 600);
    }

    return invoice || null;
  }

  /**
   * Bulk invoice generation for multiple bookings
   */
  static async bulkCreateInvoices(
    bookingIds: string[],
    options: InvoiceGenerationOptions = {}
  ): Promise<BulkInvoiceResult> {
    const results: BulkInvoiceResult = {
      successful: [],
      failed: [],
    };

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < bookingIds.length; i += batchSize) {
      const batch = bookingIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (bookingId) => {
          try {
            const invoice = await this.createInvoice({ bookingId }, options);
            results.successful.push(invoice.id);
          } catch (error) {
            results.failed.push({
              bookingId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })
      );
    }

    return results;
  }

  /**
   * Mark invoices as overdue
   */
  static async markOverdueInvoices(): Promise<number> {
    return InvoiceMetricsService.markOverdueInvoices();
  }

  /**
   * Warm up cache with frequently accessed invoices
   */
  static async warmUpCache(): Promise<void> {
    try {
      // Get recent invoices
      const recentInvoices = await db
        .select()
        .from(invoices)
        .orderBy(desc(invoices.createdAt))
        .limit(20);

      // Cache them
      for (const invoice of recentInvoices) {
        InvoiceCacheService.set(`invoice_${invoice.id}`, invoice, 600); // 10 minutes
        InvoiceCacheService.set(`invoice_number_${invoice.invoiceNumber}`, invoice, 600);
      }

      console.log(`Warmed up cache with ${recentInvoices.length} invoices`);
    } catch (error) {
      console.error('Cache warm-up failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return InvoiceCacheService.getCacheStats();
  }
}