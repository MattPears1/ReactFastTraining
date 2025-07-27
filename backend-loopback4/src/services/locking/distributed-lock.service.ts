import {injectable, inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import Redis from 'ioredis';
import {v4 as uuid} from 'uuid';

export interface LockOptions {
  ttl?: number; // Time to live in milliseconds
  retries?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in milliseconds
  refreshInterval?: number; // Auto-refresh interval
}

export interface Lock {
  key: string;
  value: string;
  ttl: number;
  acquiredAt: Date;
  expiresAt: Date;
  refreshTimer?: NodeJS.Timeout;
}

@injectable()
export class DistributedLockService {
  private readonly defaultTTL = 30000; // 30 seconds
  private readonly defaultRetries = 3;
  private readonly defaultRetryDelay = 100;
  private readonly locks: Map<string, Lock> = new Map();
  
  constructor(
    @inject('datasources.redis')
    private redis: Redis,
    @inject('services.monitoring')
    private monitoring: any
  ) {}

  /**
   * Acquire a distributed lock
   */
  async acquire(
    key: string,
    options: LockOptions = {}
  ): Promise<Lock> {
    const ttl = options.ttl || this.defaultTTL;
    const retries = options.retries || this.defaultRetries;
    const retryDelay = options.retryDelay || this.defaultRetryDelay;
    const value = uuid();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Try to acquire lock with SET NX PX
        const acquired = await this.redis.set(
          `lock:${key}`,
          value,
          'PX',
          ttl,
          'NX'
        );

        if (acquired === 'OK') {
          const lock: Lock = {
            key,
            value,
            ttl,
            acquiredAt: new Date(),
            expiresAt: new Date(Date.now() + ttl),
          };

          // Store lock locally
          this.locks.set(key, lock);

          // Set up auto-refresh if requested
          if (options.refreshInterval) {
            lock.refreshTimer = setInterval(
              () => this.refresh(lock),
              options.refreshInterval
            );
          }

          // Record metrics
          this.monitoring.recordMetric({
            name: 'lock.acquired',
            value: 1,
            unit: 'count',
            tags: { key, attempt: attempt.toString() },
          });

          return lock;
        }

        // Lock not acquired, wait before retry
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      } catch (error) {
        this.monitoring.recordMetric({
          name: 'lock.error',
          value: 1,
          unit: 'count',
          tags: { key, error: error.message },
        });
        
        throw new HttpErrors.InternalServerError(
          `Failed to acquire lock: ${error.message}`
        );
      }
    }

    // Failed to acquire after all retries
    throw new HttpErrors.Conflict(
      `Failed to acquire lock for ${key} after ${retries} attempts`
    );
  }

  /**
   * Release a distributed lock
   */
  async release(lock: Lock): Promise<boolean> {
    try {
      // Clear refresh timer if exists
      if (lock.refreshTimer) {
        clearInterval(lock.refreshTimer);
      }

      // Use Lua script to ensure atomic release
      const releaseScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(
        releaseScript,
        1,
        `lock:${lock.key}`,
        lock.value
      );

      // Remove from local storage
      this.locks.delete(lock.key);

      // Record metrics
      this.monitoring.recordMetric({
        name: 'lock.released',
        value: 1,
        unit: 'count',
        tags: { key: lock.key, held_duration: (Date.now() - lock.acquiredAt.getTime()).toString() },
      });

      return result === 1;
    } catch (error) {
      this.monitoring.recordMetric({
        name: 'lock.release_error',
        value: 1,
        unit: 'count',
        tags: { key: lock.key, error: error.message },
      });
      
      return false;
    }
  }

  /**
   * Extend the TTL of a lock
   */
  async extend(lock: Lock, additionalTTL: number): Promise<boolean> {
    try {
      const extendScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const newTTL = lock.ttl + additionalTTL;
      const result = await this.redis.eval(
        extendScript,
        1,
        `lock:${lock.key}`,
        lock.value,
        newTTL
      );

      if (result === 1) {
        lock.ttl = newTTL;
        lock.expiresAt = new Date(Date.now() + newTTL);
        return true;
      }

      return false;
    } catch (error) {
      this.monitoring.recordMetric({
        name: 'lock.extend_error',
        value: 1,
        unit: 'count',
        tags: { key: lock.key, error: error.message },
      });
      
      return false;
    }
  }

  /**
   * Check if a lock exists
   */
  async exists(key: string): Promise<boolean> {
    const exists = await this.redis.exists(`lock:${key}`);
    return exists === 1;
  }

  /**
   * Get remaining TTL for a lock
   */
  async getTTL(key: string): Promise<number> {
    const ttl = await this.redis.pttl(`lock:${key}`);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Execute a function with a lock
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T> {
    const lock = await this.acquire(key, options);
    
    try {
      return await fn();
    } finally {
      await this.release(lock);
    }
  }

  /**
   * Refresh a lock (extend TTL)
   */
  private async refresh(lock: Lock): Promise<void> {
    try {
      const extended = await this.extend(lock, lock.ttl);
      if (!extended) {
        // Lock was lost, clear refresh timer
        if (lock.refreshTimer) {
          clearInterval(lock.refreshTimer);
        }
        this.locks.delete(lock.key);
      }
    } catch (error) {
      console.error(`Failed to refresh lock ${lock.key}:`, error);
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up all locks (for graceful shutdown)
   */
  async cleanup(): Promise<void> {
    const releasePromises = Array.from(this.locks.values()).map(lock =>
      this.release(lock)
    );
    await Promise.all(releasePromises);
  }
}

/**
 * Pessimistic locking decorator
 */
export function WithLock(
  keyFactory: (target: any, propertyKey: string, ...args: any[]) => string,
  options: LockOptions = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const lockService = (this as any).lockService as DistributedLockService;
      if (!lockService) {
        throw new Error('DistributedLockService not injected');
      }

      const key = keyFactory(this, propertyKey, ...args);
      return lockService.withLock(key, () => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Optimistic locking implementation
 */
export class OptimisticLockManager {
  constructor(private redis: Redis) {}

  async checkVersion(
    entity: string,
    id: string,
    expectedVersion: number
  ): Promise<boolean> {
    const currentVersion = await this.redis.get(`version:${entity}:${id}`);
    return currentVersion === null || parseInt(currentVersion) === expectedVersion;
  }

  async incrementVersion(
    entity: string,
    id: string,
    expectedVersion: number
  ): Promise<boolean> {
    const script = `
      local current = redis.call("get", KEYS[1])
      if current == false or tonumber(current) == tonumber(ARGV[1]) then
        redis.call("set", KEYS[1], ARGV[1] + 1)
        return 1
      else
        return 0
      end
    `;

    const result = await this.redis.eval(
      script,
      1,
      `version:${entity}:${id}`,
      expectedVersion
    );

    return result === 1;
  }

  async getVersion(entity: string, id: string): Promise<number> {
    const version = await this.redis.get(`version:${entity}:${id}`);
    return version ? parseInt(version) : 0;
  }
}