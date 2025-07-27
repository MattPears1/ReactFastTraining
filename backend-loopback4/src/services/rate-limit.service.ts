import {injectable, BindingScope} from '@loopback/core';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@injectable({scope: BindingScope.SINGLETON})
export class RateLimitService {
  private store: Map<string, RateLimitEntry> = new Map();

  constructor() {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if rate limit has been exceeded
   * @param key - Unique identifier for the rate limit
   * @param limit - Maximum number of attempts allowed
   * @param windowMs - Time window in milliseconds
   * @returns Current attempt count
   */
  async checkLimit(key: string, limit: number, windowMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      // Create new entry or reset expired one
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return 1;
    }

    if (entry.count >= limit) {
      return entry.count;
    }

    // Increment count
    entry.count++;
    return entry.count;
  }

  /**
   * Increment the counter for a key
   * @param key - Unique identifier
   */
  async increment(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry && entry.resetAt > Date.now()) {
      entry.count++;
    }
  }

  /**
   * Get current count for a key
   * @param key - Unique identifier
   * @returns Current count or 0 if not found
   */
  async getCount(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || entry.resetAt <= Date.now()) {
      return 0;
    }
    return entry.count;
  }

  /**
   * Reset the counter for a key
   * @param key - Unique identifier
   */
  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }
}