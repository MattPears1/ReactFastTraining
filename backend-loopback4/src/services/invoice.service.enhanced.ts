import { db } from '../config/database.config';
import {
  invoices,
  bookings,
  users,
  payments,
  courseSessions,
  bookingAttendees,
  courses,
  Invoice,
  NewInvoice,
} from '../db/schema';
import { eq, desc, sql, and, gte, lte, or, not } from 'drizzle-orm';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';
import { InvoicePDFGenerator } from './pdf/invoice-generator';
import NodeCache from 'node-cache';
import crypto from 'crypto';

interface InvoiceWithDetails extends Invoice {
  booking: any;
  user: any;
  payment?: any;
  courseDetails?: any;
  attendees?: any[];
  company?: CompanyDetails;
}

interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  vatNumber?: string;
  registrationNumber?: string;
}

interface InvoiceGenerationOptions {
  skipEmail?: boolean;
  skipPDF?: boolean;
  regenerate?: boolean;
  customNotes?: string;
  dueDate?: Date;
}

interface InvoiceFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  bookingReference?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

interface InvoiceMetrics {
  total: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  voidCount: number;
  overdueCount: number;
  overdueAmount: number;
  thisMonthCount: number;
  thisMonthAmount: number;
  lastMonthCount: number;
  lastMonthAmount: number;
  averageAmount: number;
  largestInvoice: number;
}

// Enhanced Invoice Service with caching and performance optimizations
export class InvoiceServiceEnhanced {
  // Cache configuration
  private static cache = new NodeCache({ 
    stdTTL: 300, // 5 minutes default TTL
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false, // Don't clone objects for better performance
  });

  // Company details (should come from config/database)
  private static readonly COMPANY_DETAILS: CompanyDetails = {
    name: 'React Fast Training',
    address: 'Yorkshire Business Centre',
    city: 'Leeds',
    postcode: 'LS1 1AA',
    country: 'United Kingdom',
    phone: '07447 485644',
    email: 'info@reactfasttraining.co.uk',
    website: 'https://reactfasttraining.co.uk',
    registrationNumber: '12345678', // Replace with actual
  };

  /**
   * Generate a unique invoice number with better concurrency handling
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      const result = await tx.execute(sql`
        SELECT nextval('invoice_number_seq') as seq
      `);
      const sequence = result.rows[0].seq;
      
      // Verify uniqueness
      const invoiceNumber = `INV-${year}-${sequence.toString().padStart(5, '0')}`;
      const [existing] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber));
      
      if (existing) {
        // Rare case: sequence collision, try again
        return this.generateInvoiceNumber();
      }
      
      return invoiceNumber;
    });
  }

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
      const cached = this.cache.get<Invoice>(cacheKey);
      if (cached) {
        console.log(`Invoice found in cache for booking ${data.bookingId}`);
        return cached;
      }
    }

    // Get booking with all details in one query
    const bookingDetails = await this.getBookingFullDetailsOptimized(data.bookingId);
    
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
        this.cache.set(cacheKey, existingInvoice);
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
      invoiceNumber: await this.generateInvoiceNumber(),
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
      company_details: this.COMPANY_DETAILS,
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
    this.cache.set(cacheKey, invoice);
    this.cache.set(`invoice_${invoice.id}`, invoice);

    return invoice;
  }

  /**
   * Generate and store invoice PDF with better error handling
   */
  private static async generateAndStorePDF(invoiceId: string): Promise<string> {
    try {
      const startTime = Date.now();
      
      // Get full invoice details
      const invoiceData = await this.getInvoiceWithDetailsOptimized(invoiceId);
      
      if (!invoiceData) {
        throw new Error('Invoice not found');
      }

      // Generate PDF
      const pdfBuffer = await InvoicePDFGenerator.generate(invoiceData);
      
      // Store PDF with retry logic
      const pdfPath = await this.retryOperation(
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
      this.clearInvoiceCache(invoiceId);
      
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
    const invoice = await this.getInvoiceWithDetailsOptimized(invoiceId);
    
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
    await this.retryOperation(
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
    this.clearInvoiceCache(invoiceId);
  }

  /**
   * Get invoice with full details - optimized version
   */
  static async getInvoiceWithDetailsOptimized(invoiceId: string): Promise<InvoiceWithDetails | null> {
    const cacheKey = `invoice_details_${invoiceId}`;
    
    // Check cache
    const cached = this.cache.get<InvoiceWithDetails>(cacheKey);
    if (cached) {
      return cached;
    }

    // Single query with all joins
    const [result] = await db
      .select({
        invoice: invoices,
        booking: bookings,
        user: users,
        payment: payments,
        courseSession: courseSessions,
        course: courses,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .leftJoin(payments, eq(invoices.paymentId, payments.id))
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(courses, eq(courseSessions.courseId, courses.id))
      .where(eq(invoices.id, invoiceId));

    if (!result) {
      return null;
    }

    // Get attendees in parallel
    const attendees = await db
      .select()
      .from(bookingAttendees)
      .where(eq(bookingAttendees.bookingId, result.booking.id));

    const invoiceWithDetails: InvoiceWithDetails = {
      ...result.invoice,
      booking: result.booking,
      user: result.user,
      payment: result.payment,
      courseDetails: {
        ...result.course,
        session: result.courseSession,
      },
      attendees,
      company: this.COMPANY_DETAILS,
    };

    // Cache for 5 minutes
    this.cache.set(cacheKey, invoiceWithDetails, 300);

    return invoiceWithDetails;
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
    const cached = this.cache.get<any>(cacheKey);
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
    this.cache.set(cacheKey, response, 120);

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
      this.getInvoiceMetrics(filters),
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
    const cacheKey = `invoice_metrics_${JSON.stringify(filters)}`;
    
    // Check cache
    const cached = this.cache.get<InvoiceMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Build base conditions
    const baseConditions = [];
    if (filters.startDate) {
      baseConditions.push(gte(invoices.issueDate, filters.startDate.toISOString().split('T')[0]));
    }
    if (filters.endDate) {
      baseConditions.push(lte(invoices.issueDate, filters.endDate.toISOString().split('T')[0]));
    }
    if (filters.userId) {
      baseConditions.push(eq(invoices.userId, filters.userId));
    }

    // Get all metrics in one query
    const metricsQuery = db
      .select({
        total: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(cast(total_amount as decimal))`,
        paidCount: sql<number>`count(*) filter (where status = 'paid')`,
        paidAmount: sql<number>`coalesce(sum(cast(total_amount as decimal)) filter (where status = 'paid'), 0)`,
        voidCount: sql<number>`count(*) filter (where status = 'void')`,
        overdueCount: sql<number>`count(*) filter (where status = 'issued' and due_date < current_date)`,
        overdueAmount: sql<number>`coalesce(sum(cast(total_amount as decimal)) filter (where status = 'issued' and due_date < current_date), 0)`,
        thisMonthCount: sql<number>`count(*) filter (where issue_date >= ${startOfMonth.toISOString().split('T')[0]})`,
        thisMonthAmount: sql<number>`coalesce(sum(cast(total_amount as decimal)) filter (where issue_date >= ${startOfMonth.toISOString().split('T')[0]}), 0)`,
        lastMonthCount: sql<number>`count(*) filter (where issue_date >= ${startOfLastMonth.toISOString().split('T')[0]} and issue_date <= ${endOfLastMonth.toISOString().split('T')[0]})`,
        lastMonthAmount: sql<number>`coalesce(sum(cast(total_amount as decimal)) filter (where issue_date >= ${startOfLastMonth.toISOString().split('T')[0]} and issue_date <= ${endOfLastMonth.toISOString().split('T')[0]}), 0)`,
        averageAmount: sql<number>`coalesce(avg(cast(total_amount as decimal)), 0)`,
        largestInvoice: sql<number>`coalesce(max(cast(total_amount as decimal)), 0)`,
      })
      .from(invoices)
      .$dynamic();

    if (baseConditions.length > 0) {
      metricsQuery.where(and(...baseConditions));
    }

    const [metrics] = await metricsQuery;

    const result: InvoiceMetrics = {
      total: Number(metrics.total) || 0,
      totalAmount: Number(metrics.totalAmount) || 0,
      paidCount: Number(metrics.paidCount) || 0,
      paidAmount: Number(metrics.paidAmount) || 0,
      voidCount: Number(metrics.voidCount) || 0,
      overdueCount: Number(metrics.overdueCount) || 0,
      overdueAmount: Number(metrics.overdueAmount) || 0,
      thisMonthCount: Number(metrics.thisMonthCount) || 0,
      thisMonthAmount: Number(metrics.thisMonthAmount) || 0,
      lastMonthCount: Number(metrics.lastMonthCount) || 0,
      lastMonthAmount: Number(metrics.lastMonthAmount) || 0,
      averageAmount: Number(metrics.averageAmount) || 0,
      largestInvoice: Number(metrics.largestInvoice) || 0,
    };

    // Cache for 5 minutes
    this.cache.set(cacheKey, result, 300);

    return result;
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
    this.clearInvoiceCache(invoiceId);
    this.clearAllInvoiceCaches();
  }

  /**
   * Regenerate invoice PDF
   */
  static async regenerateInvoicePDF(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoiceWithDetailsOptimized(invoiceId);
    
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
    const cached = this.cache.get<Invoice>(cacheKey);
    if (cached) {
      return cached;
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));

    if (invoice) {
      // Cache for 10 minutes
      this.cache.set(cacheKey, invoice, 600);
    }

    return invoice || null;
  }

  /**
   * Bulk invoice generation for multiple bookings
   */
  static async bulkCreateInvoices(
    bookingIds: string[],
    options: InvoiceGenerationOptions = {}
  ): Promise<{
    successful: string[];
    failed: Array<{ bookingId: string; error: string }>;
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ bookingId: string; error: string }>,
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
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db
      .update(invoices)
      .set({
        status: 'overdue',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(invoices.status, 'issued'),
          lte(invoices.dueDate, today),
          sql`due_date IS NOT NULL`
        )
      );

    // Clear all caches as status changed
    this.clearAllInvoiceCaches();

    return result.rowCount || 0;
  }

  // Helper methods

  private static async getBookingFullDetailsOptimized(bookingId: string): Promise<any> {
    const [result] = await db
      .select({
        booking: bookings,
        payment: payments,
        user: users,
        courseSession: courseSessions,
        course: courses,
      })
      .from(bookings)
      .leftJoin(payments, and(
        eq(bookings.id, payments.bookingId),
        eq(payments.status, 'succeeded')
      ))
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(courses, eq(courseSessions.courseId, courses.id))
      .where(eq(bookings.id, bookingId));

    if (!result) return null;

    return {
      booking: result.booking,
      payment: result.payment,
      user: result.user,
      courseSession: result.courseSession,
      courseDetails: result.course || {
        name: 'Emergency First Aid at Work',
        type: result.booking.courseType,
        price: 75,
      },
    };
  }

  private static async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    delayMs: number
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
    
    throw lastError;
  }

  private static clearInvoiceCache(invoiceId: string): void {
    this.cache.del([
      `invoice_${invoiceId}`,
      `invoice_details_${invoiceId}`,
    ]);
  }

  private static clearAllInvoiceCaches(): void {
    // Clear all invoice-related caches
    const keys = this.cache.keys();
    const invoiceKeys = keys.filter(key => 
      key.startsWith('invoice_') || 
      key.startsWith('user_invoices_') || 
      key.startsWith('invoice_metrics_')
    );
    
    if (invoiceKeys.length > 0) {
      this.cache.del(invoiceKeys);
    }
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
        this.cache.set(`invoice_${invoice.id}`, invoice, 600); // 10 minutes
        this.cache.set(`invoice_number_${invoice.invoiceNumber}`, invoice, 600);
      }

      console.log(`Warmed up cache with ${recentInvoices.length} invoices`);
    } catch (error) {
      console.error('Cache warm-up failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    keys: number;
    hits: number;
    misses: number;
    hitRate: string;
  } {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
        : '0%',
    };
  }
}