import { db } from '../../config/database.config';
import { invoices } from '../../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { InvoiceFilters, InvoiceMetrics } from './invoice.types';
import { InvoiceCacheService } from './invoice-cache.service';

export class InvoiceMetricsService {
  /**
   * Get comprehensive invoice metrics
   */
  static async getInvoiceMetrics(filters: InvoiceFilters = {}): Promise<InvoiceMetrics> {
    const cacheKey = `invoice_metrics_${JSON.stringify(filters)}`;
    
    // Check cache
    const cached = InvoiceCacheService.get<InvoiceMetrics>(cacheKey);
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
    InvoiceCacheService.set(cacheKey, result, 300);

    return result;
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
    InvoiceCacheService.clearAllInvoiceCaches();

    return result.rowCount || 0;
  }
}