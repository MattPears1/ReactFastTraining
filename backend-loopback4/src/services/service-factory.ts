import {BindingScope, injectable} from '@loopback/core';
import {DataSource} from '@loopback/repository';
import {BaseService} from './base.service';

export interface ServiceConfig {
  dataSource?: DataSource;
  cache?: boolean;
  cacheTTL?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ServiceMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  lastError?: Error;
  lastErrorTime?: Date;
}

/**
 * Service factory for creating and managing service instances
 */
@injectable({scope: BindingScope.SINGLETON})
export class ServiceFactory {
  private services: Map<string, BaseService> = new Map();
  private metrics: Map<string, ServiceMetrics> = new Map();
  private config: Map<string, ServiceConfig> = new Map();

  /**
   * Register a service with configuration
   */
  registerService<T extends BaseService>(
    name: string,
    ServiceClass: new (...args: any[]) => T,
    config?: ServiceConfig,
    ...args: any[]
  ): T {
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    const service = new ServiceClass(...args);
    this.services.set(name, service);
    
    if (config) {
      this.config.set(name, config);
    }

    this.metrics.set(name, {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
    });

    return service;
  }

  /**
   * Get a registered service
   */
  getService<T extends BaseService>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  /**
   * Create a proxy for service with metrics and retry logic
   */
  createServiceProxy<T extends BaseService>(
    service: T,
    serviceName: string
  ): T {
    const config = this.config.get(serviceName) || {};
    const metrics = this.metrics.get(serviceName)!;

    return new Proxy(service, {
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);
        
        if (typeof value === 'function' && prop !== 'constructor') {
          return this.wrapMethod(
            value.bind(target),
            serviceName,
            prop as string,
            config,
            metrics
          );
        }
        
        return value;
      },
    });
  }

  /**
   * Wrap service method with metrics and retry logic
   */
  private wrapMethod(
    method: Function,
    serviceName: string,
    methodName: string,
    config: ServiceConfig,
    metrics: ServiceMetrics
  ): Function {
    return async (...args: any[]) => {
      const startTime = Date.now();
      let attempts = 0;
      const maxAttempts = config.retryAttempts || 1;
      const retryDelay = config.retryDelay || 1000;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          metrics.totalCalls++;

          const result = await method(...args);
          
          metrics.successfulCalls++;
          this.updateResponseTime(metrics, Date.now() - startTime);
          
          return result;
        } catch (error) {
          if (attempts >= maxAttempts) {
            metrics.failedCalls++;
            metrics.lastError = error as Error;
            metrics.lastErrorTime = new Date();
            
            console.error(
              `[${serviceName}.${methodName}] Failed after ${attempts} attempts:`,
              error
            );
            
            throw error;
          }

          console.warn(
            `[${serviceName}.${methodName}] Attempt ${attempts} failed, retrying...`
          );
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    };
  }

  /**
   * Update average response time
   */
  private updateResponseTime(metrics: ServiceMetrics, responseTime: number): void {
    const totalTime = metrics.averageResponseTime * (metrics.successfulCalls - 1);
    metrics.averageResponseTime = (totalTime + responseTime) / metrics.successfulCalls;
  }

  /**
   * Get metrics for a service
   */
  getMetrics(serviceName: string): ServiceMetrics | undefined {
    return this.metrics.get(serviceName);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, ServiceMetrics> {
    const result: Record<string, ServiceMetrics> = {};
    
    this.metrics.forEach((metrics, name) => {
      result[name] = { ...metrics };
    });
    
    return result;
  }

  /**
   * Reset metrics for a service
   */
  resetMetrics(serviceName?: string): void {
    if (serviceName) {
      const metrics = this.metrics.get(serviceName);
      if (metrics) {
        metrics.totalCalls = 0;
        metrics.successfulCalls = 0;
        metrics.failedCalls = 0;
        metrics.averageResponseTime = 0;
        delete metrics.lastError;
        delete metrics.lastErrorTime;
      }
    } else {
      this.metrics.forEach(metrics => {
        metrics.totalCalls = 0;
        metrics.successfulCalls = 0;
        metrics.failedCalls = 0;
        metrics.averageResponseTime = 0;
        delete metrics.lastError;
        delete metrics.lastErrorTime;
      });
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, {
      name: string;
      healthy: boolean;
      metrics: ServiceMetrics;
      lastError?: string;
    }>;
  }> {
    const results: Record<string, any> = {};
    let allHealthy = true;

    for (const [name, service] of this.services) {
      const metrics = this.metrics.get(name)!;
      const errorRate = metrics.totalCalls > 0
        ? metrics.failedCalls / metrics.totalCalls
        : 0;
      
      const healthy = errorRate < 0.1; // Less than 10% error rate
      allHealthy = allHealthy && healthy;

      results[name] = {
        name,
        healthy,
        metrics: { ...metrics },
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
        lastError: metrics.lastError?.message,
      };
    }

    return {
      healthy: allHealthy,
      services: results,
    };
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    for (const [name, service] of this.services) {
      try {
        if (typeof (service as any).shutdown === 'function') {
          await (service as any).shutdown();
        }
      } catch (error) {
        console.error(`Error shutting down service ${name}:`, error);
      }
    }
    
    this.services.clear();
    this.metrics.clear();
    this.config.clear();
  }
}