import { get, Response, RestBindings } from '@loopback/rest';
import { inject } from '@loopback/core';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { db } from '../config/database.config';
import { sql } from 'drizzle-orm';
import { PaymentMonitoringService } from '../services/payment/payment-monitoring.service';
import { PaymentRecoveryService } from '../services/payment/payment-recovery.service';
import { StripeServiceEnhanced as StripeService } from '../services/stripe.service.enhanced';
import Stripe from 'stripe';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    stripe: ComponentHealth;
    email: ComponentHealth;
    storage: ComponentHealth;
    recovery: ComponentHealth;
  };
  metrics?: {
    payments: any;
    performance: any;
    system: any;
  };
  issues: string[];
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  details?: any;
}

export class PaymentHealthController {
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response
  ) {}

  /**
   * Public health check endpoint
   */
  @get('/api/health/payment', {
    responses: {
      '200': {
        description: 'Payment system health status',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                timestamp: { type: 'string', format: 'date-time' },
                uptime: { type: 'number' },
              },
            },
          },
        },
      },
      '503': {
        description: 'Service unavailable',
      },
    },
  })
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    
    // Check all components
    const [database, stripe, email, storage, recovery] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkStripe(),
      this.checkEmail(),
      this.checkStorage(),
      this.checkRecovery(),
    ]);

    // Process results
    const checks = {
      database: database.status === 'fulfilled' ? database.value : this.createUnhealthyResult('Database check failed'),
      stripe: stripe.status === 'fulfilled' ? stripe.value : this.createUnhealthyResult('Stripe check failed'),
      email: email.status === 'fulfilled' ? email.value : this.createUnhealthyResult('Email check failed'),
      storage: storage.status === 'fulfilled' ? storage.value : this.createUnhealthyResult('Storage check failed'),
      recovery: recovery.status === 'fulfilled' ? recovery.value : this.createUnhealthyResult('Recovery check failed'),
    };

    // Collect issues
    Object.entries(checks).forEach(([component, health]) => {
      if (health.status !== 'healthy') {
        issues.push(`${component}: ${health.message || 'unhealthy'}`);
      }
    });

    // Determine overall status
    const unhealthyCount = Object.values(checks).filter(c => c.status === 'unhealthy').length;
    const degradedCount = Object.values(checks).filter(c => c.status === 'degraded').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      status = 'unhealthy';
      this.response.status(503);
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      issues,
    };
  }

  /**
   * Detailed health check endpoint (admin only)
   */
  @get('/api/admin/health/payment/detailed')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async detailedHealthCheck(): Promise<HealthCheckResult> {
    const basicHealth = await this.healthCheck();
    
    // Add detailed metrics
    try {
      const metrics = await PaymentMonitoringService.getRealTimeMetrics();
      return {
        ...basicHealth,
        metrics,
      };
    } catch (error) {
      return {
        ...basicHealth,
        metrics: undefined,
      };
    }
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Simple query to check connection
      const result = await db.execute(sql`SELECT 1 as healthy`);
      
      // Check response time
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 1000) {
        return {
          status: 'degraded',
          responseTime,
          message: 'Slow database response',
        };
      }
      
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Stripe health
   */
  private async checkStripe(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Test Stripe API connection
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
        typescript: true,
        maxNetworkRetries: 0, // Don't retry for health check
        timeout: 5000, // 5 second timeout
      });
      
      // List recent charges to test API
      await stripe.charges.list({ limit: 1 });
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 2000) {
        return {
          status: 'degraded',
          responseTime,
          message: 'Slow Stripe API response',
        };
      }
      
      // Check Stripe metrics
      const metrics = StripeService.getMetrics();
      const failureRate = metrics.paymentIntentsCreated > 0
        ? (metrics.paymentIntentsFailed / metrics.paymentIntentsCreated) * 100
        : 0;
      
      if (failureRate > 10) {
        return {
          status: 'degraded',
          responseTime,
          message: `High payment failure rate: ${failureRate.toFixed(2)}%`,
          details: { metrics },
        };
      }
      
      return {
        status: 'healthy',
        responseTime,
        details: { metrics },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Stripe connection failed',
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check email service health
   */
  private async checkEmail(): Promise<ComponentHealth> {
    // This would check your email service (SendGrid, Mailgun, etc.)
    // For now, return a mock healthy status
    return {
      status: 'healthy',
      responseTime: 50,
    };
  }

  /**
   * Check storage service health
   */
  private async checkStorage(): Promise<ComponentHealth> {
    // This would check your file storage service
    // For now, check if the storage directory exists
    const fs = require('fs').promises;
    const startTime = Date.now();
    
    try {
      const storageDir = process.env.STORAGE_PATH || './storage';
      await fs.access(storageDir);
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Storage directory not accessible',
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check recovery service health
   */
  private async checkRecovery(): Promise<ComponentHealth> {
    try {
      const status = PaymentRecoveryService.getRecoveryStatus();
      
      if (status.circuitBreakerStatus === 'open') {
        return {
          status: 'degraded',
          message: 'Circuit breaker is open',
          details: status,
        };
      }
      
      if (status.queueSize > 50) {
        return {
          status: 'degraded',
          message: `High recovery queue size: ${status.queueSize}`,
          details: status,
        };
      }
      
      return {
        status: 'healthy',
        details: status,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Recovery service check failed',
      };
    }
  }

  /**
   * Create unhealthy result
   */
  private createUnhealthyResult(message: string): ComponentHealth {
    return {
      status: 'unhealthy',
      message,
    };
  }

  /**
   * Liveness probe endpoint (for Kubernetes)
   */
  @get('/api/health/payment/live')
  async liveness(): Promise<{ status: string }> {
    // Simple check that the service is running
    return { status: 'ok' };
  }

  /**
   * Readiness probe endpoint (for Kubernetes)
   */
  @get('/api/health/payment/ready')
  async readiness(): Promise<{ ready: boolean; checks: any }> {
    const health = await this.healthCheck();
    
    return {
      ready: health.status !== 'unhealthy',
      checks: health.checks,
    };
  }

  /**
   * Startup probe endpoint (for Kubernetes)
   */
  @get('/api/health/payment/startup')
  async startup(): Promise<{ started: boolean; dependencies: any }> {
    // Check if all services are initialized
    const checks = {
      database: false,
      stripe: false,
      monitoring: false,
      recovery: false,
    };
    
    try {
      // Quick database check
      await db.execute(sql`SELECT 1`);
      checks.database = true;
      
      // Check if Stripe is configured
      checks.stripe = !!process.env.STRIPE_SECRET_KEY;
      
      // These services initialize on module load
      checks.monitoring = true;
      checks.recovery = true;
      
    } catch (error) {
      // Database not ready
    }
    
    const started = Object.values(checks).every(v => v);
    
    if (!started) {
      this.response.status(503);
    }
    
    return {
      started,
      dependencies: checks,
    };
  }
}