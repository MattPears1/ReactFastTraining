import { db } from '../../config/database.config';
import { 
  payments, 
  bookings, 
  paymentLogs, 
  PaymentStatus,
  PaymentEventType 
} from '../../db/schema';
import { eq, and, or, lt, isNull, sql } from 'drizzle-orm';
import { StripeService } from '../stripe.service';
import { EmailService } from '../email.service';
import { PaymentMonitoringService } from './payment-monitoring.service';

interface RecoveryOptions {
  maxAttempts?: number;
  retryDelay?: number; // milliseconds
  backoffMultiplier?: number;
  maxRetryDelay?: number;
  timeout?: number;
}

interface RecoveryResult {
  success: boolean;
  recoveredCount: number;
  failedCount: number;
  details: Array<{
    paymentId: string;
    status: 'recovered' | 'failed' | 'skipped';
    reason?: string;
  }>;
}

export class PaymentRecoveryService {
  private static readonly DEFAULT_RECOVERY_OPTIONS: Required<RecoveryOptions> = {
    maxAttempts: 3,
    retryDelay: 5000, // 5 seconds
    backoffMultiplier: 2,
    maxRetryDelay: 300000, // 5 minutes
    timeout: 30000, // 30 seconds
  };

  private static recoveryQueue: Map<string, NodeJS.Timeout> = new Map();
  private static circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
    threshold: 5,
    timeout: 60000, // 1 minute
  };

  /**
   * Initialize recovery service
   */
  static async initialize(): Promise<void> {
    // Start background recovery job
    this.startBackgroundRecovery();
    
    // Register for monitoring alerts
    PaymentMonitoringService.onAlert((alert) => {
      if (alert.name === 'high_failure_rate') {
        this.triggerEmergencyRecovery();
      }
    });
  }

  /**
   * Recover stuck payments
   */
  static async recoverStuckPayments(): Promise<RecoveryResult> {
    const operationId = `recovery_${Date.now()}`;
    PaymentMonitoringService.startOperation(operationId);

    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen()) {
        PaymentMonitoringService.logPaymentEvent(
          'recovery_skipped',
          { reason: 'circuit_breaker_open' },
          'warn'
        );
        return {
          success: false,
          recoveredCount: 0,
          failedCount: 0,
          details: [],
        };
      }

      // Find stuck payments (processing for > 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const stuckPayments = await db
        .select({
          payment: payments,
          booking: bookings,
        })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .where(
          and(
            or(
              eq(payments.status, 'processing'),
              eq(payments.status, 'requires_action')
            ),
            lt(payments.updatedAt, tenMinutesAgo)
          )
        )
        .limit(20); // Process in batches

      const result: RecoveryResult = {
        success: true,
        recoveredCount: 0,
        failedCount: 0,
        details: [],
      };

      // Process each stuck payment
      for (const { payment, booking } of stuckPayments) {
        try {
          const recovered = await this.recoverSinglePayment(payment, booking);
          
          if (recovered) {
            result.recoveredCount++;
            result.details.push({
              paymentId: payment.id,
              status: 'recovered',
            });
          } else {
            result.failedCount++;
            result.details.push({
              paymentId: payment.id,
              status: 'failed',
              reason: 'Recovery failed',
            });
          }
        } catch (error) {
          result.failedCount++;
          result.details.push({
            paymentId: payment.id,
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Unknown error',
          });

          // Update circuit breaker
          this.recordCircuitBreakerFailure();
        }
      }

      PaymentMonitoringService.endOperation(
        operationId,
        'recover_stuck_payments',
        true,
        { recovered: result.recoveredCount, failed: result.failedCount }
      );

      return result;
    } catch (error) {
      PaymentMonitoringService.endOperation(
        operationId,
        'recover_stuck_payments',
        false,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      throw error;
    }
  }

  /**
   * Recover a single payment
   */
  private static async recoverSinglePayment(
    payment: any,
    booking: any
  ): Promise<boolean> {
    try {
      // Get latest status from Stripe
      const paymentIntent = await StripeService.retrievePaymentIntent(
        payment.stripePaymentIntentId
      );

      // Update local database with current status
      await db
        .update(payments)
        .set({
          status: paymentIntent.status,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // Handle based on status
      switch (paymentIntent.status) {
        case 'succeeded':
          // Payment actually succeeded, update booking
          await this.handleSuccessfulRecovery(payment, booking);
          return true;
          
        case 'requires_payment_method':
        case 'requires_confirmation':
          // Send reminder email to customer
          await this.sendPaymentReminderEmail(payment, booking);
          return true;
          
        case 'canceled':
        case 'failed':
          // Mark as failed and notify customer
          await this.handleFailedPayment(payment, booking);
          return true;
          
        case 'processing':
          // Still processing, check again later
          this.scheduleRetry(payment.id, 60000); // Retry in 1 minute
          return false;
          
        default:
          return false;
      }
    } catch (error) {
      PaymentMonitoringService.logPaymentEvent(
        'recovery_error',
        {
          paymentId: payment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'error'
      );
      
      throw error;
    }
  }

  /**
   * Handle successful recovery
   */
  private static async handleSuccessfulRecovery(
    payment: any,
    booking: any
  ): Promise<void> {
    // Update booking status
    await db
      .update(bookings)
      .set({
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    // Log recovery
    await db.insert(paymentLogs).values({
      paymentId: payment.id,
      eventType: PaymentEventType.PAYMENT_RECOVERED,
      eventSource: 'recovery_service',
      eventData: {
        previousStatus: payment.status,
        newStatus: 'succeeded',
        recoveredAt: new Date().toISOString(),
      },
    });

    // Send confirmation email
    try {
      await EmailService.sendPaymentConfirmation(booking.userId, payment, booking);
    } catch (error) {
      // Log but don't fail the recovery
      PaymentMonitoringService.logPaymentEvent(
        'email_send_failed',
        { paymentId: payment.id, error },
        'warn'
      );
    }
  }

  /**
   * Handle failed payment
   */
  private static async handleFailedPayment(
    payment: any,
    booking: any
  ): Promise<void> {
    // Update payment status
    await db
      .update(payments)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Update booking status
    await db
      .update(bookings)
      .set({
        status: 'payment_failed',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    // Send failure notification
    try {
      await EmailService.sendPaymentFailedEmail(booking.userId, payment, booking);
    } catch (error) {
      PaymentMonitoringService.logPaymentEvent(
        'email_send_failed',
        { paymentId: payment.id, error },
        'warn'
      );
    }
  }

  /**
   * Send payment reminder email
   */
  private static async sendPaymentReminderEmail(
    payment: any,
    booking: any
  ): Promise<void> {
    // Check if we've already sent a reminder recently
    const recentReminder = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM payment_logs
      WHERE payment_id = ${payment.id}
      AND event_type = 'reminder_sent'
      AND created_at > NOW() - INTERVAL '24 hours'
    `);

    if (Number(recentReminder.rows[0].count) > 0) {
      return; // Already sent reminder
    }

    // Send reminder
    await EmailService.sendPaymentReminderEmail(booking.userId, payment, booking);

    // Log reminder sent
    await db.insert(paymentLogs).values({
      paymentId: payment.id,
      eventType: 'reminder_sent',
      eventSource: 'recovery_service',
      eventData: {
        reminderType: 'payment_incomplete',
        sentAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Retry failed operations
   */
  static async retryFailedOperations(): Promise<RecoveryResult> {
    // Find recent failed payments that haven't exceeded retry limit
    const failedPayments = await db.execute(sql`
      SELECT p.*, b.*, 
        COUNT(pl.id) as retry_count
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN payment_logs pl ON p.id = pl.payment_id 
        AND pl.event_type = 'retry_attempted'
      WHERE p.status = 'failed'
      AND p.created_at > NOW() - INTERVAL '24 hours'
      GROUP BY p.id, b.id
      HAVING COUNT(pl.id) < 3
      LIMIT 10
    `);

    const result: RecoveryResult = {
      success: true,
      recoveredCount: 0,
      failedCount: 0,
      details: [],
    };

    for (const row of failedPayments.rows) {
      try {
        // Calculate retry delay with exponential backoff
        const retryCount = Number(row.retry_count) || 0;
        const delay = Math.min(
          this.DEFAULT_RECOVERY_OPTIONS.retryDelay * 
          Math.pow(this.DEFAULT_RECOVERY_OPTIONS.backoffMultiplier, retryCount),
          this.DEFAULT_RECOVERY_OPTIONS.maxRetryDelay
        );

        // Schedule retry
        this.scheduleRetry(row.id, delay);
        
        result.details.push({
          paymentId: row.id,
          status: 'skipped',
          reason: `Scheduled for retry in ${delay / 1000} seconds`,
        });
      } catch (error) {
        result.failedCount++;
        result.details.push({
          paymentId: row.id,
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Schedule a retry for a payment
   */
  private static scheduleRetry(paymentId: string, delay: number): void {
    // Cancel existing retry if any
    const existing = this.recoveryQueue.get(paymentId);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule new retry
    const timeout = setTimeout(async () => {
      try {
        await this.retryPayment(paymentId);
      } catch (error) {
        PaymentMonitoringService.logPaymentEvent(
          'retry_failed',
          { paymentId, error },
          'error'
        );
      } finally {
        this.recoveryQueue.delete(paymentId);
      }
    }, delay);

    this.recoveryQueue.set(paymentId, timeout);
  }

  /**
   * Retry a specific payment
   */
  private static async retryPayment(paymentId: string): Promise<void> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Log retry attempt
    await db.insert(paymentLogs).values({
      paymentId,
      eventType: 'retry_attempted',
      eventSource: 'recovery_service',
      eventData: {
        attemptedAt: new Date().toISOString(),
        previousStatus: payment.status,
      },
    });

    // Attempt to process payment again
    // This would depend on the specific failure reason
    // For now, just check the current status
    const paymentIntent = await StripeService.retrievePaymentIntent(
      payment.stripePaymentIntentId
    );

    if (paymentIntent.status === 'succeeded') {
      await this.handleSuccessfulRecovery(payment, { id: payment.bookingId });
    }
  }

  /**
   * Emergency recovery for system-wide issues
   */
  static async triggerEmergencyRecovery(): Promise<void> {
    PaymentMonitoringService.logPaymentEvent(
      'emergency_recovery_triggered',
      { timestamp: new Date().toISOString() },
      'warn'
    );

    try {
      // Pause new payment processing
      // This would integrate with your payment controller
      
      // Recover all stuck payments
      const result = await this.recoverStuckPayments();
      
      // Retry recent failures
      await this.retryFailedOperations();
      
      // Resume normal operations
      PaymentMonitoringService.logPaymentEvent(
        'emergency_recovery_completed',
        { result },
        'info'
      );
    } catch (error) {
      PaymentMonitoringService.logPaymentEvent(
        'emergency_recovery_failed',
        { error },
        'error'
      );
    }
  }

  /**
   * Clean up old failed payments
   */
  static async cleanupOldFailures(): Promise<number> {
    // Mark very old failed payments as abandoned
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await db
      .update(payments)
      .set({
        status: 'abandoned',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payments.status, 'failed'),
          lt(payments.createdAt, thirtyDaysAgo)
        )
      );

    return result.rowCount || 0;
  }

  /**
   * Start background recovery job
   */
  private static startBackgroundRecovery(): void {
    // Run recovery every 5 minutes
    setInterval(async () => {
      try {
        await this.recoverStuckPayments();
      } catch (error) {
        PaymentMonitoringService.logPaymentEvent(
          'background_recovery_error',
          { error },
          'error'
        );
      }
    }, 5 * 60 * 1000);

    // Run cleanup daily
    setInterval(async () => {
      try {
        const cleaned = await this.cleanupOldFailures();
        PaymentMonitoringService.logPaymentEvent(
          'cleanup_completed',
          { cleanedCount: cleaned },
          'info'
        );
      } catch (error) {
        PaymentMonitoringService.logPaymentEvent(
          'cleanup_error',
          { error },
          'error'
        );
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Circuit breaker management
   */
  private static isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreaker.isOpen) {
      return false;
    }

    // Check if timeout has passed
    if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      return false;
    }

    return true;
  }

  private static recordCircuitBreakerFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      PaymentMonitoringService.logPaymentEvent(
        'circuit_breaker_opened',
        {
          failures: this.circuitBreaker.failures,
          threshold: this.circuitBreaker.threshold,
        },
        'error'
      );
    }
  }

  /**
   * Get recovery status
   */
  static getRecoveryStatus(): {
    queueSize: number;
    circuitBreakerStatus: string;
    lastRecoveryRun?: Date;
  } {
    return {
      queueSize: this.recoveryQueue.size,
      circuitBreakerStatus: this.circuitBreaker.isOpen ? 'open' : 'closed',
    };
  }
}

// Initialize on module load
PaymentRecoveryService.initialize();