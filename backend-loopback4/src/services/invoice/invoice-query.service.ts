import { db } from '../../config/database.config';
import {
  invoices,
  bookings,
  users,
  payments,
  courseSessions,
  bookingAttendees,
  courses,
} from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { InvoiceWithDetails, COMPANY_DETAILS } from './invoice.types';
import { InvoiceCacheService } from './invoice-cache.service';

export class InvoiceQueryService {
  /**
   * Get invoice with full details - optimized version
   */
  static async getInvoiceWithDetailsOptimized(invoiceId: string): Promise<InvoiceWithDetails | null> {
    const cacheKey = `invoice_details_${invoiceId}`;
    
    // Check cache
    const cached = InvoiceCacheService.get<InvoiceWithDetails>(cacheKey);
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
      company: COMPANY_DETAILS,
    };

    // Cache for 5 minutes
    InvoiceCacheService.set(cacheKey, invoiceWithDetails, 300);

    return invoiceWithDetails;
  }

  static async getBookingFullDetailsOptimized(bookingId: string): Promise<any> {
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
}