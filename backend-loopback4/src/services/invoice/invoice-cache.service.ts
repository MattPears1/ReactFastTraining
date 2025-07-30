import NodeCache from 'node-cache';

export class InvoiceCacheService {
  private static cache = new NodeCache({ 
    stdTTL: 300, // 5 minutes default TTL
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false, // Don't clone objects for better performance
  });

  static get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  static set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  static del(keys: string | string[]): number {
    return this.cache.del(keys);
  }

  static keys(): string[] {
    return this.cache.keys();
  }

  static getStats() {
    return this.cache.getStats();
  }

  static clearInvoiceCache(invoiceId: string): void {
    this.del([
      `invoice_${invoiceId}`,
      `invoice_details_${invoiceId}`,
      `invoice_booking_${invoiceId}`,
    ]);
  }

  static clearAllInvoiceCaches(): void {
    // Clear all invoice-related caches
    const keys = this.keys();
    const invoiceKeys = keys.filter(key => 
      key.startsWith('invoice_') || 
      key.startsWith('user_invoices_') || 
      key.startsWith('invoice_metrics_')
    );
    
    if (invoiceKeys.length > 0) {
      this.del(invoiceKeys);
    }
  }

  static getCacheStats(): {
    keys: number;
    hits: number;
    misses: number;
    hitRate: string;
  } {
    const stats = this.getStats();
    return {
      keys: this.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
        : '0%',
    };
  }
}