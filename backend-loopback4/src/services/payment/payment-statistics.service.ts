import { db } from '../../config/database.config';
import { payments, bookings } from '../../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export class PaymentStatisticsService {
  static async getRefundedAmount(paymentId: string): Promise<number> {
    const result = await db
      .select({
        totalRefunded: sql<number>`coalesce(sum(amount), 0)`,
      })
      .from('refunds')
      .where(
        and(
          eq('refunds.paymentId', paymentId),
          sql`refunds.status IN ('processed', 'processing')`
        )
      );

    return Number(result[0]?.totalRefunded) || 0;
  }

  static async getPaymentStatistics(filters: any): Promise<any> {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(payments.createdAt, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      conditions.push(lte(payments.createdAt, new Date(filters.endDate)));
    }

    const query = db
      .select({
        totalAmount: sql<number>`sum(case when status = 'succeeded' then amount else 0 end)`,
        totalCount: sql<number>`count(*)`,
        successCount: sql<number>`count(*) filter (where status = 'succeeded')`,
        failedCount: sql<number>`count(*) filter (where status = 'failed')`,
        pendingCount: sql<number>`count(*) filter (where status in ('pending', 'processing'))`,
        avgAmount: sql<number>`avg(case when status = 'succeeded' then amount else null end)`,
      })
      .from(payments)
      .$dynamic();

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const [stats] = await query;

    return {
      totalRevenue: Number(stats.totalAmount) || 0,
      totalPayments: Number(stats.totalCount),
      successfulPayments: Number(stats.successCount),
      failedPayments: Number(stats.failedCount),
      pendingPayments: Number(stats.pendingCount),
      averagePaymentAmount: Number(stats.avgAmount) || 0,
      successRate: stats.totalCount > 0
        ? (Number(stats.successCount) / Number(stats.totalCount) * 100).toFixed(2)
        : 0,
    };
  }

  static async getTodayMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todayStats] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(amount)`,
        successCount: sql<number>`count(*) filter (where status = 'succeeded')`,
        failedCount: sql<number>`count(*) filter (where status = 'failed')`,
      })
      .from(payments)
      .where(gte(payments.createdAt, today));

    return {
      totalPayments: Number(todayStats.count),
      totalAmount: Number(todayStats.totalAmount) || 0,
      successCount: Number(todayStats.successCount),
      failedCount: Number(todayStats.failedCount),
      successRate: todayStats.count > 0 
        ? (Number(todayStats.successCount) / Number(todayStats.count) * 100).toFixed(2)
        : 0,
    };
  }
}