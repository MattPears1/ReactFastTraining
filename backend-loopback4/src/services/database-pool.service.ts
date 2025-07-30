import { Pool, PoolClient, PoolConfig } from 'pg';
import { MonitoringService } from './monitoring.service';
import { CircuitBreakerManager } from './payment-circuit-breaker.service';

export interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingRequests: number;
  averageQueryTime: number;
  slowQueries: number;
  errorRate: number;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  duration: number;
}

export class DatabasePool {
  private static instance: DatabasePool;
  private pool: Pool;
  private metrics = {
    queryTimes: [] as number[],
    errorCount: 0,
    totalQueries: 0,
    slowQueries: 0,
  };
  
  private readonly slowQueryThreshold = 1000; // 1 second
  private readonly circuitBreaker = CircuitBreakerManager.getCircuit('database', {
    failureThreshold: 10,
    timeout: 30000,
    errorThresholdPercentage: 30,
  });
  
  private constructor(config?: PoolConfig) {
    const defaultConfig: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'reactfast',
      user: process.env.DB_USER || 'dbuser',
      password: process.env.DB_PASSWORD,
      
      // Pool configuration
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      statementTimeout: 30000,
      query_timeout: 30000,
      
      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
      } : undefined,
    };
    
    this.pool = new Pool({ ...defaultConfig, ...config });
    
    // Pool event handlers
    this.pool.on('error', (err, client) => {
      MonitoringService.error('Database pool error', err);
    });
    
    this.pool.on('connect', (client) => {
      MonitoringService.debug('New database connection established');
      
      // Set session parameters for performance
      client.query('SET statement_timeout = 30000'); // 30 seconds
      client.query('SET lock_timeout = 10000'); // 10 seconds
      client.query('SET idle_in_transaction_session_timeout = 60000'); // 1 minute
    });
    
    this.pool.on('acquire', (client) => {
      MonitoringService.debug('Database connection acquired');
    });
    
    this.pool.on('remove', (client) => {
      MonitoringService.debug('Database connection removed');
    });
    
    // Start metrics collection
    this.startMetricsCollection();
  }
  
  static getInstance(config?: PoolConfig): DatabasePool {
    if (!this.instance) {
      this.instance = new DatabasePool(config);
    }
    return this.instance;
  }
  
  async query<T = any>(
    text: string,
    params?: any[],
    options?: { timeout?: number; logSlow?: boolean }
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const queryId = Math.random().toString(36).substring(7);
    
    return this.circuitBreaker.execute(async () => {
      let client: PoolClient | undefined;
      
      try {
        // Acquire client from pool
        client = await this.pool.connect();
        
        // Log query start
        MonitoringService.debug('Executing query', {
          queryId,
          text: text.substring(0, 100),
          params: params?.length,
        });
        
        // Execute query with timeout
        const queryPromise = client.query(text, params);
        const timeoutMs = options?.timeout || 30000;
        
        const result = await Promise.race([
          queryPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
          ),
        ]);
        
        const duration = Date.now() - startTime;
        
        // Track metrics
        this.metrics.totalQueries++;
        this.metrics.queryTimes.push(duration);
        this.keepMetricsWindow();
        
        // Check for slow query
        if (duration > this.slowQueryThreshold) {
          this.metrics.slowQueries++;
          
          if (options?.logSlow !== false) {
            MonitoringService.warn('Slow query detected', {
              queryId,
              duration,
              text: text.substring(0, 200),
              rowCount: result.rowCount,
            });
          }
        }
        
        return {
          rows: result.rows,
          rowCount: result.rowCount || 0,
          duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        this.metrics.errorCount++;
        
        MonitoringService.error('Query execution failed', error, {
          queryId,
          duration,
          text: text.substring(0, 100),
        });
        
        throw error;
      } finally {
        // Always release the client
        if (client) {
          client.release();
        }
      }
    });
  }
  
  async transaction<T = any>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    const startTime = Date.now();
    const transactionId = Math.random().toString(36).substring(7);
    
    try {
      MonitoringService.debug('Starting transaction', { transactionId });
      
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      MonitoringService.debug('Transaction committed', {
        transactionId,
        duration: Date.now() - startTime,
      });
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      MonitoringService.error('Transaction rolled back', error, {
        transactionId,
        duration: Date.now() - startTime,
      });
      
      throw error;
    } finally {
      client.release();
    }
  }
  
  async batchQuery<T = any>(
    queries: Array<{ text: string; params?: any[] }>
  ): Promise<QueryResult<T>[]> {
    const results: QueryResult<T>[] = [];
    const startTime = Date.now();
    
    // Use transaction for consistency
    await this.transaction(async (client) => {
      for (const query of queries) {
        const queryStart = Date.now();
        const result = await client.query(query.text, query.params);
        
        results.push({
          rows: result.rows,
          rowCount: result.rowCount || 0,
          duration: Date.now() - queryStart,
        });
      }
    });
    
    MonitoringService.info('Batch query completed', {
      queryCount: queries.length,
      totalDuration: Date.now() - startTime,
    });
    
    return results;
  }
  
  // Prepared statements for better performance
  async prepare(name: string, text: string, paramTypes?: string[]): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query({
        name,
        text,
        types: paramTypes,
      });
      
      MonitoringService.debug('Prepared statement created', { name });
    } finally {
      client.release();
    }
  }
  
  async execute<T = any>(
    name: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    return this.query(`EXECUTE ${name}(${params?.map((_, i) => `$${i + 1}`).join(', ')})`, params);
  }
  
  getMetrics(): PoolMetrics {
    const avgQueryTime = this.metrics.queryTimes.length > 0
      ? this.metrics.queryTimes.reduce((a, b) => a + b, 0) / this.metrics.queryTimes.length
      : 0;
    
    const errorRate = this.metrics.totalQueries > 0
      ? (this.metrics.errorCount / this.metrics.totalQueries) * 100
      : 0;
    
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingRequests: this.pool.waitingCount,
      averageQueryTime: Number(avgQueryTime.toFixed(2)),
      slowQueries: this.metrics.slowQueries,
      errorRate: Number(errorRate.toFixed(2)),
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health', [], { timeout: 5000 });
      return result.rows[0]?.health === 1;
    } catch (error) {
      MonitoringService.error('Database health check failed', error);
      return false;
    }
  }
  
  async optimize(): Promise<void> {
    const optimizationQueries = [
      // Update statistics
      'ANALYZE;',
      
      // Clean up dead tuples
      'VACUUM;',
      
      // Reindex for better performance (be careful in production)
      // 'REINDEX DATABASE CONCURRENTLY;',
    ];
    
    for (const query of optimizationQueries) {
      try {
        await this.query(query, [], { timeout: 300000 }); // 5 minutes
        MonitoringService.info(`Optimization completed: ${query}`);
      } catch (error) {
        MonitoringService.error(`Optimization failed: ${query}`, error);
      }
    }
  }
  
  async createIndexes(): Promise<void> {
    const indexes = [
      // Payments indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_booking_id ON payments(booking_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created ON payments(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_customer ON payments(customer_id)',
      
      // Refunds indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_status ON refunds(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_created ON refunds(created_at)',
      
      // Invoices indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_number ON invoices(invoice_number)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_created ON invoices(created_at)',
      
      // Webhook events indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhooks_stripe_event ON webhook_events(stripe_event_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhooks_processed ON webhook_events(processed)',
      
      // Composite indexes for common queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created ON payments(status, created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_status_created ON refunds(status, created_at)',
    ];
    
    for (const index of indexes) {
      try {
        await this.query(index, [], { timeout: 600000 }); // 10 minutes
        MonitoringService.info(`Index created: ${index.match(/idx_\w+/)?.[0]}`);
      } catch (error) {
        // Index might already exist
        MonitoringService.debug(`Index creation skipped: ${index.match(/idx_\w+/)?.[0]}`);
      }
    }
  }
  
  private keepMetricsWindow() {
    // Keep only last 1000 query times
    if (this.metrics.queryTimes.length > 1000) {
      this.metrics.queryTimes = this.metrics.queryTimes.slice(-1000);
    }
  }
  
  private startMetricsCollection() {
    setInterval(() => {
      const metrics = this.getMetrics();
      
      // Record metrics
      MonitoringService.recordGauge('db_pool_total', metrics.totalConnections);
      MonitoringService.recordGauge('db_pool_idle', metrics.idleConnections);
      MonitoringService.recordGauge('db_pool_waiting', metrics.waitingRequests);
      MonitoringService.recordGauge('db_query_avg_time', metrics.averageQueryTime);
      MonitoringService.recordGauge('db_slow_queries', metrics.slowQueries);
      MonitoringService.recordGauge('db_error_rate', metrics.errorRate);
      
      // Log if there are issues
      if (metrics.waitingRequests > 5) {
        MonitoringService.warn('High database pool contention', metrics);
      }
      
      if (metrics.errorRate > 5) {
        MonitoringService.error('High database error rate', null, metrics);
      }
    }, 30000); // Every 30 seconds
  }
  
  async shutdown(): Promise<void> {
    await this.pool.end();
    MonitoringService.info('Database pool shut down');
  }
}

// Export singleton instance
export const db = DatabasePool.getInstance();