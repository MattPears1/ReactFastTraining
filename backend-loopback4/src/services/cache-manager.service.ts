import * as NodeCache from 'node-cache';
import Redis from 'ioredis';
import { MonitoringService } from './monitoring.service';
import * as crypto from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  refreshOnGet?: boolean; // Refresh TTL on get
  priority?: 'l1' | 'l2' | 'l3'; // Cache priority level
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  size: number;
}

export class CacheManager {
  private static instance: CacheManager;
  
  // L1 Cache - In-memory (fastest)
  private l1Cache: NodeCache;
  private l1Stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  
  // L2 Cache - Redis (distributed)
  private l2Cache?: Redis;
  private l2Stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  
  // L3 Cache - CDN (future implementation)
  private l3Cache?: any;
  
  private readonly defaultTTL = 300; // 5 minutes
  private readonly maxL1Size = 1000; // Maximum items in L1 cache
  
  private constructor() {
    // Initialize L1 cache
    this.l1Cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 60,
      useClones: false,
      maxKeys: this.maxL1Size,
    });
    
    // Initialize L2 cache (Redis) if available
    if (process.env.REDIS_URL) {
      try {
        this.l2Cache = new Redis(process.env.REDIS_URL, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });
        
        this.l2Cache.on('error', (error) => {
          MonitoringService.error('Redis cache error', error);
        });
        
        this.l2Cache.on('connect', () => {
          MonitoringService.info('Redis cache connected');
        });
      } catch (error) {
        MonitoringService.error('Failed to initialize Redis cache', error);
      }
    }
    
    // Start metrics collection
    this.startMetricsCollection();
  }
  
  static getInstance(): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager();
    }
    return this.instance;
  }
  
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // L1 Check
      const l1Value = this.l1Cache.get<T>(key);
      if (l1Value !== undefined) {
        this.l1Stats.hits++;
        
        if (options?.refreshOnGet) {
          this.l1Cache.ttl(key, options.ttl || this.defaultTTL);
        }
        
        MonitoringService.debug('Cache L1 hit', { key, latency: Date.now() - startTime });
        return l1Value;
      }
      this.l1Stats.misses++;
      
      // L2 Check (Redis)
      if (this.l2Cache && options?.priority !== 'l1') {
        try {
          const l2Value = await this.l2Cache.get(key);
          if (l2Value) {
            this.l2Stats.hits++;
            const parsed = JSON.parse(l2Value) as T;
            
            // Promote to L1
            this.l1Cache.set(key, parsed, options?.ttl || this.defaultTTL);
            
            if (options?.refreshOnGet) {
              await this.l2Cache.expire(key, options.ttl || this.defaultTTL);
            }
            
            MonitoringService.debug('Cache L2 hit', { key, latency: Date.now() - startTime });
            return parsed;
          }
          this.l2Stats.misses++;
        } catch (error) {
          MonitoringService.error('L2 cache get error', error, { key });
        }
      }
      
      // L3 Check (future CDN implementation)
      // ...
      
      MonitoringService.debug('Cache miss', { key, latency: Date.now() - startTime });
      return null;
    } catch (error) {
      MonitoringService.error('Cache get error', error, { key });
      return null;
    }
  }
  
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const startTime = Date.now();
    const ttl = options?.ttl || this.defaultTTL;
    
    try {
      // Always set in L1 (unless specifically excluded)
      if (options?.priority !== 'l2' && options?.priority !== 'l3') {
        this.l1Cache.set(key, value, ttl);
        this.l1Stats.sets++;
      }
      
      // Set in L2 (Redis) if available
      if (this.l2Cache && options?.priority !== 'l1') {
        try {
          const serialized = JSON.stringify(value);
          await this.l2Cache.setex(key, ttl, serialized);
          this.l2Stats.sets++;
        } catch (error) {
          MonitoringService.error('L2 cache set error', error, { key });
        }
      }
      
      // Set in L3 (future CDN implementation)
      // ...
      
      MonitoringService.debug('Cache set', {
        key,
        ttl,
        latency: Date.now() - startTime,
        size: JSON.stringify(value).length,
      });
    } catch (error) {
      MonitoringService.error('Cache set error', error, { key });
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      // Delete from all levels
      this.l1Cache.del(key);
      this.l1Stats.deletes++;
      
      if (this.l2Cache) {
        await this.l2Cache.del(key);
        this.l2Stats.deletes++;
      }
      
      MonitoringService.debug('Cache delete', { key });
    } catch (error) {
      MonitoringService.error('Cache delete error', error, { key });
    }
  }
  
  async deletePattern(pattern: string): Promise<void> {
    try {
      // Delete from L1
      const l1Keys = this.l1Cache.keys();
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      l1Keys.forEach(key => {
        if (regex.test(key)) {
          this.l1Cache.del(key);
          this.l1Stats.deletes++;
        }
      });
      
      // Delete from L2
      if (this.l2Cache) {
        const l2Keys = await this.l2Cache.keys(pattern);
        if (l2Keys.length > 0) {
          await this.l2Cache.del(...l2Keys);
          this.l2Stats.deletes += l2Keys.length;
        }
      }
      
      MonitoringService.debug('Cache pattern delete', { pattern });
    } catch (error) {
      MonitoringService.error('Cache pattern delete error', error, { pattern });
    }
  }
  
  async flush(): Promise<void> {
    try {
      this.l1Cache.flushAll();
      
      if (this.l2Cache) {
        await this.l2Cache.flushall();
      }
      
      MonitoringService.info('Cache flushed');
    } catch (error) {
      MonitoringService.error('Cache flush error', error);
    }
  }
  
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }
    
    // Generate value
    const value = await factory();
    
    // Cache the value
    await this.set(key, value, options);
    
    return value;
  }
  
  async warmCache(data: Array<{ key: string; value: any; options?: CacheOptions }>) {
    const startTime = Date.now();
    let warmed = 0;
    
    for (const item of data) {
      try {
        await this.set(item.key, item.value, item.options);
        warmed++;
      } catch (error) {
        MonitoringService.error('Cache warming error', error, { key: item.key });
      }
    }
    
    MonitoringService.info('Cache warming completed', {
      total: data.length,
      warmed,
      duration: Date.now() - startTime,
    });
  }
  
  generateKey(...parts: any[]): string {
    const keyData = parts.map(part => 
      typeof part === 'object' ? JSON.stringify(part) : String(part)
    ).join(':');
    
    // For long keys, use hash
    if (keyData.length > 200) {
      const hash = crypto.createHash('sha256').update(keyData).digest('hex');
      return `${parts[0]}:hash:${hash.substring(0, 16)}`;
    }
    
    return keyData;
  }
  
  getStats(): {
    l1: CacheStats;
    l2: CacheStats;
    overall: CacheStats;
  } {
    const l1Keys = this.l1Cache.keys();
    const l1HitRate = this.l1Stats.hits / (this.l1Stats.hits + this.l1Stats.misses) || 0;
    
    const l2HitRate = this.l2Stats.hits / (this.l2Stats.hits + this.l2Stats.misses) || 0;
    
    const totalHits = this.l1Stats.hits + this.l2Stats.hits;
    const totalMisses = this.l1Stats.misses + this.l2Stats.misses;
    const overallHitRate = totalHits / (totalHits + totalMisses) || 0;
    
    return {
      l1: {
        ...this.l1Stats,
        hitRate: Number((l1HitRate * 100).toFixed(2)),
        size: l1Keys.length,
      },
      l2: {
        ...this.l2Stats,
        hitRate: Number((l2HitRate * 100).toFixed(2)),
        size: -1, // Would need to query Redis
      },
      overall: {
        hits: totalHits,
        misses: totalMisses,
        sets: this.l1Stats.sets + this.l2Stats.sets,
        deletes: this.l1Stats.deletes + this.l2Stats.deletes,
        hitRate: Number((overallHitRate * 100).toFixed(2)),
        size: l1Keys.length,
      },
    };
  }
  
  private startMetricsCollection() {
    setInterval(() => {
      const stats = this.getStats();
      
      // Record metrics
      MonitoringService.recordGauge('cache_hit_rate', stats.overall.hitRate, { cache: 'overall' });
      MonitoringService.recordGauge('cache_hit_rate', stats.l1.hitRate, { cache: 'l1' });
      MonitoringService.recordGauge('cache_hit_rate', stats.l2.hitRate, { cache: 'l2' });
      
      MonitoringService.recordGauge('cache_size', stats.l1.size, { cache: 'l1' });
      
      // Log stats periodically
      if (Math.random() < 0.1) { // 10% chance to log
        MonitoringService.info('Cache statistics', stats);
      }
    }, 60000); // Every minute
  }
  
  // Cache key patterns for different domains
  static keys = {
    payment: (id: string) => `payment:${id}`,
    paymentByIntent: (intentId: string) => `payment:intent:${intentId}`,
    invoice: (id: string) => `invoice:${id}`,
    invoiceByNumber: (number: string) => `invoice:number:${number}`,
    refund: (id: string) => `refund:${id}`,
    refundByPayment: (paymentId: string) => `refund:payment:${paymentId}`,
    customer: (id: string) => `customer:${id}`,
    session: (id: string) => `session:${id}`,
    stats: (type: string, period: string) => `stats:${type}:${period}`,
    config: (key: string) => `config:${key}`,
  };
}

// Export singleton instance
export const cache = CacheManager.getInstance();