import { injectable } from '@loopback/core';
import { db } from '../../db';
import { payments, users, bookings } from '../../db/schema';
import { eq, and, or, like, gte, lte, desc } from 'drizzle-orm';
import { PaymentSearchParams } from './payment.types';

@injectable()
export class PaymentSearchService {
  /**
   * Search payments with filters
   */
  async searchPayments(params: PaymentSearchParams): Promise<{
    payments: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      reference,
      customerEmail,
      status,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      paymentMethod,
      page = 1,
      limit = 20,
    } = params;

    // Build search conditions
    const conditions = [];

    if (reference) {
      conditions.push(
        or(
          like(payments.paymentReference, `%${reference}%`),
          like(payments.stripePaymentIntentId, `%${reference}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(payments.status, status));
    }

    if (fromDate) {
      conditions.push(gte(payments.paymentDate, fromDate));
    }

    if (toDate) {
      conditions.push(lte(payments.paymentDate, toDate));
    }

    if (minAmount) {
      conditions.push(gte(payments.amount, minAmount.toFixed(2)));
    }

    if (maxAmount) {
      conditions.push(lte(payments.amount, maxAmount.toFixed(2)));
    }

    if (paymentMethod) {
      conditions.push(eq(payments.paymentMethod, paymentMethod));
    }

    // Execute search query with joins
    const query = db
      .select({
        payment: payments,
        user: users,
        booking: bookings,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(bookings, eq(payments.bookingId, bookings.id));

    if (customerEmail) {
      query.where(
        and(
          like(users.email, `%${customerEmail}%`),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      );
    } else if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Get total count
    const countResult = await query;
    const total = countResult.length;

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedResults = await query
      .orderBy(desc(payments.paymentDate))
      .limit(limit)
      .offset(offset);

    // Format results
    const formattedPayments = paginatedResults.map(row => ({
      ...row.payment,
      user: row.user ? {
        id: row.user.id,
        email: row.user.email,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
      } : null,
      booking: row.booking ? {
        id: row.booking.id,
        courseType: row.booking.courseType,
        sessionDate: row.booking.sessionDate,
        status: row.booking.status,
      } : null,
    }));

    return {
      payments: formattedPayments,
      total,
      page,
      limit,
    };
  }

  /**
   * Get payment by reference
   */
  async getPaymentByReference(reference: string): Promise<any> {
    const result = await db
      .select({
        payment: payments,
        user: users,
        booking: bookings,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(payments.paymentReference, reference))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      ...row.payment,
      user: row.user ? {
        id: row.user.id,
        email: row.user.email,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
      } : null,
      booking: row.booking ? {
        id: row.booking.id,
        courseType: row.booking.courseType,
        sessionDate: row.booking.sessionDate,
        status: row.booking.status,
      } : null,
    };
  }

  /**
   * Search payments by customer
   */
  async getPaymentsByCustomer(
    userId: number,
    status?: string,
    limit = 20
  ): Promise<any[]> {
    const conditions = [eq(payments.userId, userId)];
    
    if (status) {
      conditions.push(eq(payments.status, status));
    }

    const results = await db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(and(...conditions))
      .orderBy(desc(payments.paymentDate))
      .limit(limit);

    return results.map(row => ({
      ...row.payment,
      booking: row.booking ? {
        id: row.booking.id,
        courseType: row.booking.courseType,
        sessionDate: row.booking.sessionDate,
        status: row.booking.status,
      } : null,
    }));
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(limit = 10): Promise<any[]> {
    const results = await db
      .select({
        payment: payments,
        user: users,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(eq(payments.status, 'completed'))
      .orderBy(desc(payments.paymentDate))
      .limit(limit);

    return results.map(row => ({
      ...row.payment,
      user: row.user ? {
        id: row.user.id,
        email: row.user.email,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
      } : null,
    }));
  }

  /**
   * Get payments requiring attention
   */
  async getPaymentsRequiringAttention(): Promise<any[]> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const results = await db
      .select({
        payment: payments,
        user: users,
        booking: bookings,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        or(
          eq(payments.status, 'pending'),
          eq(payments.status, 'failed'),
          and(
            eq(payments.status, 'processing'),
            lte(payments.paymentDate, oneDayAgo)
          )
        )
      )
      .orderBy(payments.paymentDate);

    return results.map(row => ({
      ...row.payment,
      user: row.user ? {
        id: row.user.id,
        email: row.user.email,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
      } : null,
      booking: row.booking ? {
        id: row.booking.id,
        courseType: row.booking.courseType,
        sessionDate: row.booking.sessionDate,
        status: row.booking.status,
      } : null,
    }));
  }
}