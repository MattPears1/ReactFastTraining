interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  onEvict?: (key: string, value: any) => void;
}

export class DataCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number;
  private maxSize: number;
  private onEvict?: (key: string, value: T) => void;
  private accessOrder: string[] = [];

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
    this.onEvict = options.onEvict;
  }

  set(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.ttl;
    const now = Date.now();
    
    // Remove from access order if exists
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    
    // Add to end of access order
    this.accessOrder.push(key);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });

    // Enforce max size with LRU eviction
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        const evicted = this.cache.get(oldestKey);
        this.cache.delete(oldestKey);
        if (evicted && this.onEvict) {
          this.onEvict(oldestKey, evicted.data);
        }
      }
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access order (move to end)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry && this.onEvict) {
      this.onEvict(key, entry.data);
    }
    
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return this.cache.delete(key);
  }

  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => {
        this.onEvict!(key, entry.data);
      });
    }
    
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
  }

  // Get all valid entries
  entries(): Array<[string, T]> {
    const now = Date.now();
    const validEntries: Array<[string, T]> = [];

    this.cache.forEach((entry, key) => {
      if (now <= entry.expiresAt) {
        validEntries.push([key, entry.data]);
      }
    });

    return validEntries;
  }

  // Get cache statistics
  stats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    // This would need to track hits/misses in get() method
    return {
      size: this.cache.size,
      hits: 0, // Would need to implement tracking
      misses: 0, // Would need to implement tracking
      hitRate: 0,
    };
  }
}

// Singleton cache instances for different data types
export const sessionCache = new DataCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 50,
});

export const userCache = new DataCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
});

export const apiCache = new DataCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
});

// Cache key generators
export const cacheKeys = {
  session: (id: string) => `session:${id}`,
  sessionList: (filters: Record<string, any>) => 
    `sessions:${JSON.stringify(filters)}`,
  user: (id: string) => `user:${id}`,
  booking: (id: string) => `booking:${id}`,
  availability: (date: string, location?: string) => 
    `availability:${date}:${location || 'all'}`,
};

// Decorator for caching method results
export function cacheable(
  cache: DataCache,
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator(...args);
      
      // Check cache first
      const cached = cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Call original method
      const result = await originalMethod.apply(this, args);
      
      // Cache result
      cache.set(key, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}