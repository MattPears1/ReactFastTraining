import { MonitoringService } from './monitoring.service';
import { cache } from './cache-manager.service';
import { db } from './database-pool.service';
import * as os from 'os';
import * as v8 from 'v8';

export interface PerformanceMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  eventLoop: {
    lag: number;
    utilization: number;
  };
  gc: {
    count: number;
    duration: number;
    lastRun: Date;
  };
}

export interface OptimizationSuggestion {
  type: 'memory' | 'cpu' | 'database' | 'cache' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue: string;
  suggestion: string;
  impact: string;
}

export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private metrics: PerformanceMetrics = this.initializeMetrics();
  private eventLoopMonitor: any;
  private gcStats = {
    count: 0,
    totalDuration: 0,
    lastRun: new Date(),
  };
  
  private constructor() {
    this.startMonitoring();
  }
  
  static getInstance(): PerformanceOptimizationService {
    if (!this.instance) {
      this.instance = new PerformanceOptimizationService();
    }
    return this.instance;
  }
  
  private initializeMetrics(): PerformanceMetrics {
    return {
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
      },
      memory: {
        total: 0,
        used: 0,
        percentage: 0,
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
      eventLoop: {
        lag: 0,
        utilization: 0,
      },
      gc: {
        count: 0,
        duration: 0,
        lastRun: new Date(),
      },
    };
  }
  
  private startMonitoring(): void {
    // CPU monitoring
    this.monitorCPU();
    
    // Memory monitoring
    this.monitorMemory();
    
    // Event loop monitoring
    this.monitorEventLoop();
    
    // Garbage collection monitoring
    this.monitorGC();
    
    // Periodic analysis
    setInterval(() => {
      this.analyzeAndOptimize();
    }, 60000); // Every minute
  }
  
  private monitorCPU(): void {
    const cpus = os.cpus();
    let startMeasure = this.getCPUInfo();
    
    setInterval(() => {
      const endMeasure = this.getCPUInfo();
      const idleDiff = endMeasure.idle - startMeasure.idle;
      const totalDiff = endMeasure.total - startMeasure.total;
      const usage = 100 - (100 * idleDiff / totalDiff);
      
      this.metrics.cpu.usage = Number(usage.toFixed(2));
      this.metrics.cpu.loadAverage = os.loadavg();
      
      startMeasure = endMeasure;
      
      // Record metrics
      MonitoringService.recordGauge('cpu_usage_percent', this.metrics.cpu.usage);
      MonitoringService.recordGauge('cpu_load_1m', this.metrics.cpu.loadAverage[0]);
    }, 5000); // Every 5 seconds
  }
  
  private getCPUInfo() {
    const cpus = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;
    
    for (const cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    
    return {
      idle,
      total: user + nice + sys + idle + irq,
    };
  }
  
  private monitorMemory(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      this.metrics.memory = {
        total: totalMem,
        used: usedMem,
        percentage: Number(((usedMem / totalMem) * 100).toFixed(2)),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      };
      
      // Record metrics
      MonitoringService.recordGauge('memory_heap_used_bytes', memUsage.heapUsed);
      MonitoringService.recordGauge('memory_heap_total_bytes', memUsage.heapTotal);
      MonitoringService.recordGauge('memory_rss_bytes', memUsage.rss);
      MonitoringService.recordGauge('memory_usage_percent', this.metrics.memory.percentage);
    }, 10000); // Every 10 seconds
  }
  
  private monitorEventLoop(): void {
    let lastCheck = Date.now();
    
    setInterval(() => {
      const now = Date.now();
      const delay = now - lastCheck - 1000;
      this.metrics.eventLoop.lag = Math.max(0, delay);
      lastCheck = now;
      
      // Record metric
      MonitoringService.recordGauge('event_loop_lag_ms', this.metrics.eventLoop.lag);
    }, 1000);
  }
  
  private monitorGC(): void {
    try {
      // Enable GC events if available
      const perfHooks = require('perf_hooks');
      const obs = new perfHooks.PerformanceObserver((list: any) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'gc') {
            this.gcStats.count++;
            this.gcStats.totalDuration += entry.duration;
            this.gcStats.lastRun = new Date();
            
            this.metrics.gc = {
              count: this.gcStats.count,
              duration: Number((this.gcStats.totalDuration / this.gcStats.count).toFixed(2)),
              lastRun: this.gcStats.lastRun,
            };
            
            // Record metrics
            MonitoringService.recordCounter('gc_runs_total', 1);
            MonitoringService.recordGauge('gc_duration_ms', entry.duration);
          }
        });
      });
      
      obs.observe({ entryTypes: ['gc'] });
    } catch (error) {
      MonitoringService.debug('GC monitoring not available');
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  async analyzeAndOptimize(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    
    // CPU analysis
    if (this.metrics.cpu.usage > 80) {
      suggestions.push({
        type: 'cpu',
        severity: 'high',
        issue: `CPU usage is ${this.metrics.cpu.usage}%`,
        suggestion: 'Consider scaling horizontally or optimizing CPU-intensive operations',
        impact: 'High CPU can cause slow response times and system instability',
      });
    }
    
    // Memory analysis
    const heapUsedPercentage = (this.metrics.memory.heapUsed / this.metrics.memory.heapTotal) * 100;
    if (heapUsedPercentage > 85) {
      suggestions.push({
        type: 'memory',
        severity: 'high',
        issue: `Heap memory usage is ${heapUsedPercentage.toFixed(2)}%`,
        suggestion: 'Check for memory leaks, consider increasing heap size or optimizing memory usage',
        impact: 'High memory usage can lead to out-of-memory errors',
      });
    }
    
    // Event loop analysis
    if (this.metrics.eventLoop.lag > 100) {
      suggestions.push({
        type: 'general',
        severity: 'medium',
        issue: `Event loop lag is ${this.metrics.eventLoop.lag}ms`,
        suggestion: 'Move heavy computations to worker threads or optimize synchronous operations',
        impact: 'Event loop lag causes delayed request processing',
      });
    }
    
    // Database analysis
    const dbMetrics = await db.getMetrics();
    if (dbMetrics.errorRate > 5) {
      suggestions.push({
        type: 'database',
        severity: 'high',
        issue: `Database error rate is ${dbMetrics.errorRate}%`,
        suggestion: 'Check database connectivity, query performance, and connection pool settings',
        impact: 'Database errors directly impact application functionality',
      });
    }
    
    if (dbMetrics.averageQueryTime > 500) {
      suggestions.push({
        type: 'database',
        severity: 'medium',
        issue: `Average query time is ${dbMetrics.averageQueryTime}ms`,
        suggestion: 'Optimize slow queries, add indexes, or consider query result caching',
        impact: 'Slow queries increase response times and reduce throughput',
      });
    }
    
    // Cache analysis
    const cacheStats = cache.getStats();
    if (cacheStats.overall.hitRate < 70) {
      suggestions.push({
        type: 'cache',
        severity: 'medium',
        issue: `Cache hit rate is only ${cacheStats.overall.hitRate}%`,
        suggestion: 'Review caching strategy, increase TTLs, or implement cache warming',
        impact: 'Low cache hit rate increases database load and response times',
      });
    }
    
    // GC analysis
    if (this.metrics.gc.duration > 50) {
      suggestions.push({
        type: 'memory',
        severity: 'medium',
        issue: `GC duration averaging ${this.metrics.gc.duration}ms`,
        suggestion: 'Reduce object allocation rate, reuse objects, or tune GC settings',
        impact: 'Long GC pauses can cause request timeouts',
      });
    }
    
    // Log suggestions if any
    if (suggestions.length > 0) {
      MonitoringService.warn('Performance optimization suggestions', {
        count: suggestions.length,
        suggestions: suggestions.map(s => ({
          type: s.type,
          severity: s.severity,
          issue: s.issue,
        })),
      });
    }
    
    return suggestions;
  }
  
  async optimizeQueries(): Promise<void> {
    MonitoringService.info('Starting query optimization');
    
    try {
      // Create missing indexes
      await db.createIndexes();
      
      // Update database statistics
      await db.optimize();
      
      MonitoringService.info('Query optimization completed');
    } catch (error) {
      MonitoringService.error('Query optimization failed', error);
    }
  }
  
  async warmCache(): Promise<void> {
    MonitoringService.info('Starting cache warming');
    
    try {
      // Warm frequently accessed data
      const warmupData: Array<{ key: string; factory: () => Promise<any>; ttl: number }> = [
        {
          key: 'config:payment_settings',
          factory: async () => ({
            stripeEnabled: true,
            supportedCurrencies: ['GBP', 'EUR', 'USD'],
            minAmount: 100,
            maxAmount: 1000000,
          }),
          ttl: 3600,
        },
        {
          key: 'stats:payment:daily',
          factory: async () => {
            const result = await db.query(`
              SELECT 
                COUNT(*) as count,
                SUM(amount) as total,
                AVG(amount) as average
              FROM payments
              WHERE created_at >= CURRENT_DATE
              AND status = 'succeeded'
            `);
            return result.rows[0];
          },
          ttl: 300,
        },
      ];
      
      const cachePromises = warmupData.map(item =>
        cache.getOrSet(item.key, item.factory, { ttl: item.ttl })
      );
      
      await Promise.all(cachePromises);
      
      MonitoringService.info('Cache warming completed', {
        warmedKeys: warmupData.length,
      });
    } catch (error) {
      MonitoringService.error('Cache warming failed', error);
    }
  }
  
  forceGarbageCollection(): void {
    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();
      
      MonitoringService.info('Manual garbage collection completed', {
        heapFreed: before.heapUsed - after.heapUsed,
        beforeHeap: before.heapUsed,
        afterHeap: after.heapUsed,
      });
    } else {
      MonitoringService.warn('Garbage collection not exposed. Run with --expose-gc flag');
    }
  }
  
  getHeapSnapshot(): string {
    const snapshot = v8.writeHeapSnapshot();
    MonitoringService.info('Heap snapshot created', { path: snapshot });
    return snapshot;
  }
  
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: PerformanceMetrics;
    suggestions: OptimizationSuggestion[];
  }> {
    const suggestions = await this.analyzeAndOptimize();
    const criticalIssues = suggestions.filter(s => s.severity === 'critical');
    const highIssues = suggestions.filter(s => s.severity === 'high');
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (criticalIssues.length > 0) {
      status = 'unhealthy';
    } else if (highIssues.length > 0) {
      status = 'degraded';
    }
    
    return {
      status,
      metrics: this.getMetrics(),
      suggestions,
    };
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizationService.getInstance();