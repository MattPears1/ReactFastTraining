import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { get, param, response } from '@loopback/rest';
import { db } from '../services/database-pool.service';
import { cache } from '../services/cache-manager.service';
import { MonitoringService } from '../services/monitoring.service';

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  successRate: number;
  refundRate: number;
  topCourses: Array<{
    courseName: string;
    revenue: number;
    bookings: number;
  }>;
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  transactions: number;
  refunds: number;
}

@authenticate('jwt')
@authorize({ allowedRoles: ['admin'] })
export class PaymentAnalyticsController {
  constructor() {}

  @get('/api/analytics/payment-stats')
  @response(200, {
    description: 'Payment statistics',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            currentPeriod: { type: 'object' },
            previousPeriod: { type: 'object' },
            percentageChange: { type: 'object' },
          },
        },
      },
    },
  })
  async getPaymentStats(
    @param.query.string('period') period: string = '30d',
    @param.query.string('timezone') timezone: string = 'Europe/London'
  ): Promise<any> {
    const cacheKey = cache.generateKey('analytics:payment-stats', period, timezone);
    
    return cache.getOrSet(
      cacheKey,
      async () => {
        const { startDate, endDate, previousStart, previousEnd } = this.getPeriodDates(period);
        
        // Current period stats
        const currentStats = await this.calculateStats(startDate, endDate);
        
        // Previous period stats for comparison
        const previousStats = await this.calculateStats(previousStart, previousEnd);
        
        // Calculate percentage changes
        const percentageChange = this.calculatePercentageChanges(currentStats, previousStats);
        
        MonitoringService.info('Payment analytics generated', {
          period,
          revenue: currentStats.totalRevenue,
        });
        
        return {
          currentPeriod: currentStats,
          previousPeriod: previousStats,
          percentageChange,
          generatedAt: new Date(),
        };
      },
      { ttl: 3600 } // Cache for 1 hour
    );
  }

  @get('/api/analytics/revenue-timeline')
  @response(200, {
    description: 'Revenue timeline data',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              revenue: { type: 'number' },
              transactions: { type: 'number' },
              refunds: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getRevenueTimeline(
    @param.query.string('period') period: string = '30d',
    @param.query.string('granularity') granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesData[]> {
    const cacheKey = cache.generateKey('analytics:revenue-timeline', period, granularity);
    
    return cache.getOrSet(
      cacheKey,
      async () => {
        const { startDate, endDate } = this.getPeriodDates(period);
        
        const dateFormat = this.getDateFormat(granularity);
        
        const result = await db.query<TimeSeriesData>(`
          WITH payment_data AS (
            SELECT 
              DATE_TRUNC($3, created_at AT TIME ZONE 'UTC') as period,
              SUM(amount) as revenue,
              COUNT(*) as transactions
            FROM payments
            WHERE status = 'succeeded'
              AND created_at >= $1
              AND created_at <= $2
            GROUP BY period
          ),
          refund_data AS (
            SELECT 
              DATE_TRUNC($3, created_at AT TIME ZONE 'UTC') as period,
              SUM(amount) as refunds
            FROM refunds
            WHERE status = 'processed'
              AND created_at >= $1
              AND created_at <= $2
            GROUP BY period
          )
          SELECT 
            TO_CHAR(COALESCE(p.period, r.period), $4) as date,
            COALESCE(p.revenue, 0)::INTEGER as revenue,
            COALESCE(p.transactions, 0)::INTEGER as transactions,
            COALESCE(r.refunds, 0)::INTEGER as refunds
          FROM payment_data p
          FULL OUTER JOIN refund_data r ON p.period = r.period
          ORDER BY COALESCE(p.period, r.period)
        `, [startDate, endDate, granularity, dateFormat]);
        
        return result.rows;
      },
      { ttl: 1800 } // Cache for 30 minutes
    );
  }

  @get('/api/analytics/fraud-metrics')
  @response(200, {
    description: 'Fraud detection metrics',
  })
  async getFraudMetrics(
    @param.query.string('period') period: string = '7d'
  ): Promise<any> {
    const cacheKey = cache.generateKey('analytics:fraud-metrics', period);
    
    return cache.getOrSet(
      cacheKey,
      async () => {
        const { startDate, endDate } = this.getPeriodDates(period);
        
        const result = await db.query(`
          SELECT 
            COUNT(*) as total_attempts,
            SUM(CASE WHEN blocked = true THEN 1 ELSE 0 END) as blocked_count,
            AVG(risk_score) as avg_risk_score,
            COUNT(DISTINCT user_id) as unique_users,
            jsonb_agg(DISTINCT jsonb_array_elements(signals) -> 'type') as signal_types
          FROM fraud_attempts
          WHERE created_at >= $1 AND created_at <= $2
        `, [startDate, endDate]);
        
        const riskDistribution = await db.query(`
          SELECT 
            risk_level,
            COUNT(*) as count
          FROM fraud_attempts
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY risk_level
          ORDER BY 
            CASE risk_level 
              WHEN 'low' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'high' THEN 3
              WHEN 'critical' THEN 4
            END
        `, [startDate, endDate]);
        
        return {
          summary: result.rows[0],
          riskDistribution: riskDistribution.rows,
          period: { startDate, endDate },
        };
      },
      { ttl: 900 } // Cache for 15 minutes
    );
  }

  @get('/api/analytics/performance-metrics')
  @response(200, {
    description: 'System performance metrics',
  })
  async getPerformanceMetrics(): Promise<any> {
    const cacheKey = 'analytics:performance-metrics';
    
    return cache.getOrSet(
      cacheKey,
      async () => {
        // Database metrics
        const dbMetrics = db.getMetrics();
        
        // Cache metrics
        const cacheMetrics = cache.getStats();
        
        // Recent payment processing times
        const processingTimes = await db.query(`
          SELECT 
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at))) as p95_processing_time,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at))) as p99_processing_time
          FROM payments
          WHERE status = 'succeeded'
            AND created_at >= NOW() - INTERVAL '1 hour'
        `);
        
        return {
          database: dbMetrics,
          cache: cacheMetrics,
          paymentProcessing: processingTimes.rows[0],
          timestamp: new Date(),
        };
      },
      { ttl: 60 } // Cache for 1 minute
    );
  }

  private async calculateStats(startDate: Date, endDate: Date): Promise<PaymentStats> {
    // Total revenue and transactions
    const revenueResult = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0)::INTEGER as total_revenue,
        COUNT(*) as total_transactions,
        COALESCE(AVG(amount), 0)::INTEGER as average_transaction
      FROM payments
      WHERE status = 'succeeded'
        AND created_at >= $1
        AND created_at <= $2
    `, [startDate, endDate]);
    
    // Success rate
    const successRateResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END)::FLOAT / 
        NULLIF(COUNT(*), 0) * 100 as success_rate
      FROM payments
      WHERE created_at >= $1
        AND created_at <= $2
    `, [startDate, endDate]);
    
    // Refund rate
    const refundRateResult = await db.query(`
      SELECT 
        COUNT(DISTINCT r.payment_id)::FLOAT / 
        NULLIF(COUNT(DISTINCT p.id), 0) * 100 as refund_rate
      FROM payments p
      LEFT JOIN refunds r ON p.id = r.payment_id AND r.status = 'processed'
      WHERE p.status = 'succeeded'
        AND p.created_at >= $1
        AND p.created_at <= $2
    `, [startDate, endDate]);
    
    // Top courses by revenue
    const topCoursesResult = await db.query(`
      SELECT 
        c.name as course_name,
        SUM(p.amount)::INTEGER as revenue,
        COUNT(DISTINCT b.id) as bookings
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN course_sessions cs ON b.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE p.status = 'succeeded'
        AND p.created_at >= $1
        AND p.created_at <= $2
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT 5
    `, [startDate, endDate]);
    
    return {
      totalRevenue: revenueResult.rows[0].total_revenue,
      totalTransactions: parseInt(revenueResult.rows[0].total_transactions),
      averageTransaction: revenueResult.rows[0].average_transaction,
      successRate: parseFloat(successRateResult.rows[0]?.success_rate || '0'),
      refundRate: parseFloat(refundRateResult.rows[0]?.refund_rate || '0'),
      topCourses: topCoursesResult.rows.map(row => ({
        courseName: row.course_name,
        revenue: row.revenue,
        bookings: parseInt(row.bookings),
      })),
    };
  }

  private calculatePercentageChanges(
    current: PaymentStats,
    previous: PaymentStats
  ): Record<string, number> {
    const calculateChange = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number(((curr - prev) / prev * 100).toFixed(2));
    };
    
    return {
      revenue: calculateChange(current.totalRevenue, previous.totalRevenue),
      transactions: calculateChange(current.totalTransactions, previous.totalTransactions),
      averageTransaction: calculateChange(current.averageTransaction, previous.averageTransaction),
      successRate: calculateChange(current.successRate, previous.successRate),
      refundRate: calculateChange(current.refundRate, previous.refundRate),
    };
  }

  private getPeriodDates(period: string): {
    startDate: Date;
    endDate: Date;
    previousStart: Date;
    previousEnd: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let previousStart: Date;
    
    // Parse period (e.g., '30d', '7d', '1m', '3m')
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) {
      throw new Error('Invalid period format');
    }
    
    const [, value, unit] = match;
    const numValue = parseInt(value);
    
    switch (unit) {
      case 'd': // days
        startDate = new Date(now.getTime() - numValue * 24 * 60 * 60 * 1000);
        previousStart = new Date(startDate.getTime() - numValue * 24 * 60 * 60 * 1000);
        break;
      case 'w': // weeks
        startDate = new Date(now.getTime() - numValue * 7 * 24 * 60 * 60 * 1000);
        previousStart = new Date(startDate.getTime() - numValue * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'm': // months
        startDate = new Date(now.getFullYear(), now.getMonth() - numValue, now.getDate());
        previousStart = new Date(startDate.getFullYear(), startDate.getMonth() - numValue, startDate.getDate());
        break;
      case 'y': // years
        startDate = new Date(now.getFullYear() - numValue, now.getMonth(), now.getDate());
        previousStart = new Date(startDate.getFullYear() - numValue, startDate.getMonth(), startDate.getDate());
        break;
    }
    
    return {
      startDate,
      endDate: now,
      previousStart,
      previousEnd: startDate,
    };
  }

  private getDateFormat(granularity: string): string {
    switch (granularity) {
      case 'hour':
        return 'YYYY-MM-DD HH24:00';
      case 'day':
        return 'YYYY-MM-DD';
      case 'week':
        return 'YYYY-"W"IW';
      case 'month':
        return 'YYYY-MM';
      default:
        return 'YYYY-MM-DD';
    }
  }
}