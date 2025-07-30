import { Pool, PoolConfig } from 'pg';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { db } from '../../config/database.config';
import { sql } from 'drizzle-orm';
import { PaymentMonitoringService } from './payment-monitoring.service';

interface CacheConfig {
  ttl: number; // seconds
  maxSize: number;
  updateAgeOnGet: boolean;
}

interface QueryOptimization {
  query: string;
  indexes: string[];
  estimatedImprovement: string;
}

export class PaymentOptimizationService {
  // Database connection pool
  private static dbPool: Pool;
  
  // Redis client for distributed caching
  private static redis: Redis | null = null;
  
  // Local LRU cache for hot data
  private static localCache = new LRUCache<string, any>({
    max: 1000,
    ttl: 1000 * 60 * 5, // 5 minutes
    updateAgeOnGet: true,
    updateAgeOnHas: true,
  });

  // Cache configurations
  private static cacheConfigs: Record<string, CacheConfig> = {
    paymentIntent: { ttl: 300, maxSize: 1000, updateAgeOnGet: true },
    userPayments: { ttl: 120, maxSize: 500, updateAgeOnGet: false },
    paymentStatus: { ttl: 60, maxSize: 2000, updateAgeOnGet: true },
    invoiceData: { ttl: 600, maxSize: 500, updateAgeOnGet: true },
    refundStatus: { ttl: 300, maxSize: 200, updateAgeOnGet: false },
  };

  // Query cache
  private static queryCache = new Map<string, { result: any; timestamp: number }>();

  /**
   * Initialize optimization services
   */
  static initialize(): void {
    // Initialize database connection pool
    this.initializeDBPool();
    
    // Initialize Redis if configured
    this.initializeRedis();
    
    // Start cache warming
    this.startCacheWarming();
    
    // Start query optimization monitoring
    this.startQueryMonitoring();
  }

  /**
   * Initialize database connection pool with optimal settings
   */
  private static initializeDBPool(): void {
    const poolConfig: PoolConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      
      // Pool optimization settings
      max: 20, // Maximum pool size
      min: 5, // Minimum pool size
      idleTimeoutMillis: 30000, // 30 seconds
      connectionTimeoutMillis: 2000, // 2 seconds
      
      // Performance settings
      statement_timeout: '30000', // 30 seconds
      query_timeout: '30000',
      idle_in_transaction_session_timeout: '60000', // 1 minute
    };

    this.dbPool = new Pool(poolConfig);

    // Handle pool errors
    this.dbPool.on('error', (err) => {
      PaymentMonitoringService.logPaymentEvent(
        'db_pool_error',
        { error: err.message },
        'error'
      );
    });

    // Log pool statistics periodically
    setInterval(() => {
      const stats = {
        totalCount: this.dbPool.totalCount,
        idleCount: this.dbPool.idleCount,
        waitingCount: this.dbPool.waitingCount,
      };
      
      PaymentMonitoringService.recordMetric('db_pool_connections', stats.totalCount);
      PaymentMonitoringService.recordMetric('db_pool_idle', stats.idleCount);
      PaymentMonitoringService.recordMetric('db_pool_waiting', stats.waitingCount);
    }, 60000); // Every minute
  }

  /**
   * Initialize Redis for distributed caching
   */
  private static initializeRedis(): void {
    if (!process.env.REDIS_URL) {
      console.log('Redis URL not configured, using local cache only');
      return;
    }

    this.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      disconnectTimeout: 2000,
      commandTimeout: 5000,
      
      // Retry strategy
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (err) => {
      PaymentMonitoringService.logPaymentEvent(
        'redis_error',
        { error: err.message },
        'error'
      );
    });

    this.redis.on('connect', () => {
      PaymentMonitoringService.logPaymentEvent(
        'redis_connected',
        { timestamp: new Date().toISOString() },
        'info'
      );
    });
  }

  /**
   * Get from cache with fallback
   */
  static async getFromCache<T>(
    key: string,
    fallback: () => Promise<T>,
    cacheType: keyof typeof PaymentOptimizationService.cacheConfigs = 'paymentIntent'
  ): Promise<T> {
    const operationId = `cache_${Date.now()}`;
    PaymentMonitoringService.startOperation(operationId);

    try {
      // Check local cache first
      const localValue = this.localCache.get(key);
      if (localValue !== undefined) {
        PaymentMonitoringService.recordMetric('cache_hit', 1, { type: 'local' });
        PaymentMonitoringService.endOperation(operationId, 'cache_get', true, { source: 'local' });
        return localValue;
      }

      // Check Redis if available
      if (this.redis) {
        try {
          const redisValue = await this.redis.get(key);
          if (redisValue) {
            const parsed = JSON.parse(redisValue);
            
            // Store in local cache
            this.localCache.set(key, parsed);
            
            PaymentMonitoringService.recordMetric('cache_hit', 1, { type: 'redis' });
            PaymentMonitoringService.endOperation(operationId, 'cache_get', true, { source: 'redis' });
            return parsed;
          }
        } catch (error) {
          // Redis error, continue to fallback
          console.error('Redis get error:', error);
        }
      }

      // Cache miss - execute fallback
      PaymentMonitoringService.recordMetric('cache_miss', 1);
      const value = await fallback();

      // Store in caches
      await this.setInCache(key, value, cacheType);

      PaymentMonitoringService.endOperation(operationId, 'cache_get', true, { source: 'fallback' });
      return value;
    } catch (error) {
      PaymentMonitoringService.endOperation(operationId, 'cache_get', false, { error });
      throw error;
    }
  }

  /**
   * Set in cache
   */
  static async setInCache(
    key: string,
    value: any,
    cacheType: keyof typeof PaymentOptimizationService.cacheConfigs = 'paymentIntent'
  ): Promise<void> {
    const config = this.cacheConfigs[cacheType];
    
    // Set in local cache
    this.localCache.set(key, value);

    // Set in Redis if available
    if (this.redis) {
      try {
        await this.redis.setex(
          key,
          config.ttl,
          JSON.stringify(value)
        );
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }
  }

  /**
   * Invalidate cache
   */
  static async invalidateCache(pattern: string): Promise<void> {
    // Clear from local cache
    for (const key of this.localCache.keys()) {
      if (key.includes(pattern)) {
        this.localCache.delete(key);
      }
    }

    // Clear from Redis if available
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('Redis invalidate error:', error);
      }
    }

    PaymentMonitoringService.recordMetric('cache_invalidate', 1, { pattern });
  }

  /**
   * Batch database operations
   */
  static async batchOperation<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Optimize query with caching
   */
  static async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 60000 // 1 minute default
  ): Promise<T> {
    // Check query cache
    const cached = this.queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      PaymentMonitoringService.recordMetric('query_cache_hit', 1);
      return cached.result;
    }

    // Execute query
    const operationId = `query_${Date.now()}`;
    PaymentMonitoringService.startOperation(operationId);
    
    try {
      const result = await queryFn();
      
      // Cache result
      this.queryCache.set(queryKey, {
        result,
        timestamp: Date.now(),
      });

      PaymentMonitoringService.endOperation(operationId, 'optimized_query', true);
      return result;
    } catch (error) {
      PaymentMonitoringService.endOperation(operationId, 'optimized_query', false, { error });
      throw error;
    }
  }

  /**
   * Get query optimization suggestions
   */
  static async getQueryOptimizations(): Promise<QueryOptimization[]> {
    const optimizations: QueryOptimization[] = [];

    // Analyze slow queries
    const slowQueries = await db.execute(sql`
      SELECT 
        query,
        mean_exec_time,
        calls,
        total_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000 -- Queries slower than 1 second
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);

    // Common optimization patterns
    const patterns = [
      {
        pattern: /WHERE.*booking_id.*AND.*status/i,
        suggestion: 'CREATE INDEX idx_payments_booking_status ON payments(booking_id, status)',
        improvement: '50-70% faster lookups',
      },
      {
        pattern: /WHERE.*created_at.*BETWEEN/i,
        suggestion: 'CREATE INDEX idx_payments_created_at ON payments(created_at) WHERE status = \'succeeded\'',
        improvement: '60-80% faster date range queries',
      },
      {
        pattern: /JOIN.*ON.*user_id/i,
        suggestion: 'CREATE INDEX idx_bookings_user_id ON bookings(user_id) INCLUDE (status, created_at)',
        improvement: '40-60% faster joins',
      },
    ];

    // Analyze each slow query
    for (const row of slowQueries.rows) {
      for (const { pattern, suggestion, improvement } of patterns) {
        if (pattern.test(row.query)) {
          optimizations.push({
            query: row.query.substring(0, 100) + '...',
            indexes: [suggestion],
            estimatedImprovement: improvement,
          });
        }
      }
    }

    return optimizations;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  private static async warmCache(): Promise<void> {
    try {
      // Warm up recent payments
      const recentPayments = await db.execute(sql`
        SELECT p.*, b.booking_reference
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE p.created_at > NOW() - INTERVAL '1 hour'
        AND p.status IN ('succeeded', 'processing')
        LIMIT 100
      `);

      for (const payment of recentPayments.rows) {
        const key = `payment:${payment.id}`;
        await this.setInCache(key, payment, 'paymentStatus');
      }

      // Warm up active payment intents
      const activeIntents = await db.execute(sql`
        SELECT *
        FROM payments
        WHERE status IN ('processing', 'requires_action')
        AND created_at > NOW() - INTERVAL '24 hours'
        LIMIT 50
      `);

      for (const intent of activeIntents.rows) {
        const key = `intent:${intent.stripe_payment_intent_id}`;
        await this.setInCache(key, intent, 'paymentIntent');
      }

      PaymentMonitoringService.logPaymentEvent(
        'cache_warmed',
        {
          recentPayments: recentPayments.rows.length,
          activeIntents: activeIntents.rows.length,
        },
        'info'
      );
    } catch (error) {
      PaymentMonitoringService.logPaymentEvent(
        'cache_warm_failed',
        { error },
        'error'
      );
    }
  }

  /**
   * Start cache warming schedule
   */
  private static startCacheWarming(): void {
    // Initial warm
    this.warmCache();

    // Warm cache every 5 minutes
    setInterval(() => {
      this.warmCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Monitor query performance
   */
  private static startQueryMonitoring(): void {
    setInterval(async () => {
      try {
        // Get database statistics
        const stats = await db.execute(sql`
          SELECT 
            numbackends as active_connections,
            xact_commit as transactions_committed,
            xact_rollback as transactions_rolled_back,
            blks_read as blocks_read,
            blks_hit as blocks_hit,
            tup_returned as rows_returned,
            tup_fetched as rows_fetched,
            tup_inserted as rows_inserted,
            tup_updated as rows_updated,
            tup_deleted as rows_deleted
          FROM pg_stat_database
          WHERE datname = current_database()
        `);

        if (stats.rows.length > 0) {
          const dbStats = stats.rows[0];
          
          // Record metrics
          PaymentMonitoringService.recordMetric('db_active_connections', dbStats.active_connections);
          PaymentMonitoringService.recordMetric('db_transactions_per_min', dbStats.transactions_committed);
          PaymentMonitoringService.recordMetric('db_cache_hit_ratio', 
            dbStats.blocks_hit / (dbStats.blocks_hit + dbStats.blocks_read) * 100
          );
        }
      } catch (error) {
        console.error('Query monitoring error:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Get optimization statistics
   */
  static async getOptimizationStats(): Promise<{
    cache: {
      localSize: number;
      hitRate: number;
      missRate: number;
    };
    database: {
      poolSize: number;
      activeConnections: number;
      waitingRequests: number;
    };
    performance: {
      avgQueryTime: number;
      cacheHitRatio: number;
    };
  }> {
    // Calculate cache statistics
    const cacheStats = {
      localSize: this.localCache.size,
      hitRate: 0, // Would need to track this
      missRate: 0, // Would need to track this
    };

    // Database pool statistics
    const dbStats = {
      poolSize: this.dbPool.totalCount,
      activeConnections: this.dbPool.totalCount - this.dbPool.idleCount,
      waitingRequests: this.dbPool.waitingCount,
    };

    // Performance statistics
    const perfStats = {
      avgQueryTime: 0, // Would need to track this
      cacheHitRatio: 0, // Would need to track this
    };

    return {
      cache: cacheStats,
      database: dbStats,
      performance: perfStats,
    };
  }

  /**
   * Clean up resources
   */
  static async cleanup(): Promise<void> {
    // Close database pool
    if (this.dbPool) {
      await this.dbPool.end();
    }

    // Close Redis connection
    if (this.redis) {
      this.redis.disconnect();
    }

    // Clear local cache
    this.localCache.clear();
  }
}

// Initialize on module load
PaymentOptimizationService.initialize();