import { injectable } from '@loopback/core';
import { db } from '../../db';
import { payments, refunds, bookings } from '../../db/schema';
import { eq, and, sql, desc, gte, lte, or } from 'drizzle-orm';
import { PaymentSummary } from './payment.types';

@injectable()
export class PaymentAnalyticsService {
  /**
   * Get payment summary for a date range
   */
  async getPaymentSummary(
    startDate?: Date,
    endDate?: Date,
    userId?: number
  ): Promise<PaymentSummary> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(payments.paymentDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(payments.paymentDate, endDate));
    }
    if (userId) {
      conditions.push(eq(payments.userId, userId));
    }

    // Get payment statistics
    const paymentStats = await db
      .select({
        totalPayments: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`,
        pendingPayments: sql<number>`SUM(CASE WHEN ${payments.status} = 'pending' THEN 1 ELSE 0 END)`,
        failedPayments: sql<number>`SUM(CASE WHEN ${payments.status} = 'failed' THEN 1 ELSE 0 END)`,
      })
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get refund statistics
    const refundConditions = [...conditions];
    const refundStats = await db
      .select({
        totalRefunds: sql<number>`COUNT(*)`,
        refundAmount: sql<number>`SUM(CAST(${refunds.amount} AS DECIMAL))`,
      })
      .from(refunds)
      .where(
        and(
          eq(refunds.status, 'completed'),
          refundConditions.length > 0 ? and(...refundConditions) : undefined
        )
      );

    const stats = paymentStats[0];
    const refundData = refundStats[0];

    return {
      totalPayments: Number(stats.totalPayments) || 0,
      totalAmount: Number(stats.totalAmount) || 0,
      totalRefunds: Number(refundData.totalRefunds) || 0,
      refundAmount: Number(refundData.refundAmount) || 0,
      netAmount: (Number(stats.totalAmount) || 0) - (Number(refundData.refundAmount) || 0),
      pendingPayments: Number(stats.pendingPayments) || 0,
      failedPayments: Number(stats.failedPayments) || 0,
    };
  }

  /**
   * Get revenue by course type
   */
  async getRevenueByCourseType(startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(payments.paymentDate, startDate));
    if (endDate) conditions.push(lte(payments.paymentDate, endDate));
    conditions.push(eq(payments.status, 'completed'));

    const results = await db
      .select({
        courseType: bookings.courseType,
        revenue: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`,
        count: sql<number>`COUNT(${payments.paymentId})`,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(bookings.courseType);

    return results.map(row => ({
      courseType: row.courseType,
      revenue: Number(row.revenue) || 0,
      count: Number(row.count) || 0,
    }));
  }

  /**
   * Get daily revenue trend
   */
  async getDailyRevenueTrend(days = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await db
      .select({
        date: sql<string>`DATE(${payments.paymentDate})`,
        revenue: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`,
        count: sql<number>`COUNT(${payments.paymentId})`,
      })
      .from(payments)
      .where(
        and(
          gte(payments.paymentDate, startDate),
          eq(payments.status, 'completed')
        )
      )
      .groupBy(sql`DATE(${payments.paymentDate})`)
      .orderBy(sql`DATE(${payments.paymentDate})`);

    return results.map(row => ({
      date: row.date,
      revenue: Number(row.revenue) || 0,
      count: Number(row.count) || 0,
    }));
  }

  /**
   * Get payment method distribution
   */
  async getPaymentMethodDistribution(startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(payments.paymentDate, startDate));
    if (endDate) conditions.push(lte(payments.paymentDate, endDate));
    conditions.push(eq(payments.status, 'completed'));

    const results = await db
      .select({
        paymentMethod: payments.paymentMethod,
        count: sql<number>`COUNT(${payments.paymentId})`,
        amount: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`,
      })
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(payments.paymentMethod);

    return results.map(row => ({
      paymentMethod: row.paymentMethod,
      count: Number(row.count) || 0,
      amount: Number(row.amount) || 0,
    }));
  }

  /**
   * Get top customers by revenue
   */
  async getTopCustomers(limit = 10, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(payments.paymentDate, startDate));
    if (endDate) conditions.push(lte(payments.paymentDate, endDate));
    conditions.push(eq(payments.status, 'completed'));

    const results = await db
      .select({
        userId: payments.userId,
        totalSpent: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(${payments.paymentId})`,
      })
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(payments.userId)
      .orderBy(desc(sql`SUM(CAST(${payments.amount} AS DECIMAL))`))
      .limit(limit);

    return results.map(row => ({
      userId: row.userId,
      totalSpent: Number(row.totalSpent) || 0,
      orderCount: Number(row.orderCount) || 0,
    }));
  }

  /**
   * Get refund rate by time period
   */
  async getRefundRate(startDate?: Date, endDate?: Date): Promise<number> {
    const conditions = [];
    if (startDate) conditions.push(gte(payments.paymentDate, startDate));
    if (endDate) conditions.push(lte(payments.paymentDate, endDate));

    const [paymentCount] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'completed'),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      );

    const [refundCount] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${refunds.paymentId})`,
      })
      .from(refunds)
      .innerJoin(payments, eq(refunds.paymentId, payments.paymentId))
      .where(
        and(
          eq(refunds.status, 'completed'),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      );

    const totalPayments = Number(paymentCount.count) || 0;
    const totalRefunds = Number(refundCount.count) || 0;

    return totalPayments > 0 ? (totalRefunds / totalPayments) * 100 : 0;
  }
}