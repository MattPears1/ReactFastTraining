import {injectable, BindingScope} from '@loopback/core';

@injectable({scope: BindingScope.SINGLETON})
export class RateLimitService {
  constructor() {
    console.log('🚫 [RATE LIMIT] Service disabled - all requests allowed');
  }

  async checkLimit(key: string, limit: number, windowMs: number): Promise<number> {
    // Always return 0 - never hit limit
    return 0;
  }

  async increment(key: string): Promise<void> {
    // Do nothing
  }

  async reset(key: string): Promise<void> {
    // Do nothing
  }

  async cleanup(): Promise<void> {
    // Do nothing
  }
}