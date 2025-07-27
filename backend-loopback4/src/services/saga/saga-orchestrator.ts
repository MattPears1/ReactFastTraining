import {injectable, inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {v4 as uuid} from 'uuid';

export enum SagaStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPENSATING = 'COMPENSATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATED = 'COMPENSATED',
}

export interface SagaStep {
  id: string;
  name: string;
  action: () => Promise<any>;
  compensate: () => Promise<void>;
  retryable?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export interface SagaTransaction {
  id: string;
  name: string;
  status: SagaStatus;
  steps: SagaStep[];
  completedSteps: string[];
  currentStep?: string;
  result?: any;
  error?: any;
  startedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface SagaLog {
  sagaId: string;
  stepId: string;
  action: 'start' | 'complete' | 'fail' | 'compensate_start' | 'compensate_complete';
  timestamp: Date;
  data?: any;
  error?: any;
}

@injectable()
export class SagaOrchestrator {
  private sagas: Map<string, SagaTransaction> = new Map();
  private logs: SagaLog[] = [];
  
  constructor(
    @inject('services.monitoring')
    private monitoring: any,
    @inject('services.event-bus', {optional: true})
    private eventBus?: any
  ) {}

  /**
   * Create and execute a new saga
   */
  async createSaga(
    name: string,
    steps: SagaStep[],
    metadata?: Record<string, any>
  ): Promise<SagaTransaction> {
    const saga: SagaTransaction = {
      id: uuid(),
      name,
      status: SagaStatus.PENDING,
      steps,
      completedSteps: [],
      startedAt: new Date(),
      metadata,
    };

    this.sagas.set(saga.id, saga);
    await this.executeSaga(saga);
    return saga;
  }

  /**
   * Execute saga steps
   */
  private async executeSaga(saga: SagaTransaction): Promise<void> {
    saga.status = SagaStatus.RUNNING;
    await this.publishEvent('saga.started', saga);

    try {
      for (const step of saga.steps) {
        saga.currentStep = step.id;
        await this.executeStep(saga, step);
        saga.completedSteps.push(step.id);
      }

      saga.status = SagaStatus.COMPLETED;
      saga.completedAt = new Date();
      await this.publishEvent('saga.completed', saga);

      // Record success metrics
      this.monitoring.recordMetric({
        name: 'saga.completed',
        value: 1,
        unit: 'count',
        tags: { name: saga.name },
      });
    } catch (error) {
      saga.error = error;
      saga.status = SagaStatus.COMPENSATING;
      await this.publishEvent('saga.failed', saga);

      // Start compensation
      await this.compensateSaga(saga);

      // Record failure metrics
      this.monitoring.recordMetric({
        name: 'saga.failed',
        value: 1,
        unit: 'count',
        tags: { name: saga.name, step: saga.currentStep },
      });
    }
  }

  /**
   * Execute a single saga step with retry logic
   */
  private async executeStep(saga: SagaTransaction, step: SagaStep): Promise<any> {
    const maxRetries = step.maxRetries || 0;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.logAction(saga.id, step.id, 'start');

        // Execute with timeout if specified
        const result = step.timeout
          ? await this.executeWithTimeout(step.action, step.timeout)
          : await step.action();

        await this.logAction(saga.id, step.id, 'complete', result);
        return result;
      } catch (error) {
        lastError = error;
        await this.logAction(saga.id, step.id, 'fail', null, error);

        if (!step.retryable || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 100);
      }
    }

    throw lastError;
  }

  /**
   * Compensate saga by rolling back completed steps
   */
  private async compensateSaga(saga: SagaTransaction): Promise<void> {
    // Compensate in reverse order
    const stepsToCompensate = [...saga.completedSteps].reverse();

    for (const stepId of stepsToCompensate) {
      const step = saga.steps.find(s => s.id === stepId);
      if (!step) continue;

      try {
        await this.logAction(saga.id, step.id, 'compensate_start');
        
        if (step.timeout) {
          await this.executeWithTimeout(step.compensate, step.timeout);
        } else {
          await step.compensate();
        }

        await this.logAction(saga.id, step.id, 'compensate_complete');
      } catch (error) {
        // Log compensation failure but continue
        console.error(`Failed to compensate step ${step.name}:`, error);
        this.monitoring.createAlert({
          type: 'saga_compensation_failed',
          severity: 'critical',
          message: `Failed to compensate step ${step.name} in saga ${saga.name}`,
          details: { sagaId: saga.id, stepId: step.id, error: error.message },
        });
      }
    }

    saga.status = SagaStatus.COMPENSATED;
    saga.completedAt = new Date();
    await this.publishEvent('saga.compensated', saga);
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      ),
    ]);
  }

  /**
   * Log saga action
   */
  private async logAction(
    sagaId: string,
    stepId: string,
    action: SagaLog['action'],
    data?: any,
    error?: any
  ): Promise<void> {
    const log: SagaLog = {
      sagaId,
      stepId,
      action,
      timestamp: new Date(),
      data,
      error,
    };

    this.logs.push(log);
    
    // Keep only recent logs in memory
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000);
    }
  }

  /**
   * Publish saga event
   */
  private async publishEvent(event: string, saga: SagaTransaction): Promise<void> {
    if (this.eventBus) {
      await this.eventBus.publish({
        type: event,
        sagaId: saga.id,
        sagaName: saga.name,
        status: saga.status,
        metadata: saga.metadata,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get saga by ID
   */
  getSaga(sagaId: string): SagaTransaction | undefined {
    return this.sagas.get(sagaId);
  }

  /**
   * Get saga logs
   */
  getSagaLogs(sagaId: string): SagaLog[] {
    return this.logs.filter(log => log.sagaId === sagaId);
  }
}

/**
 * Predefined saga definitions for booking system
 */
@injectable()
export class BookingSagaDefinitions {
  constructor(
    @inject('services.booking')
    private bookingService: any,
    @inject('services.payment')
    private paymentService: any,
    @inject('services.notification')
    private notificationService: any,
    @inject('services.distributed-lock')
    private lockService: any
  ) {}

  /**
   * Create booking saga with distributed transactions
   */
  createBookingSaga(bookingData: any): SagaStep[] {
    const lockKey = `booking:session:${bookingData.sessionId}`;
    let lock: any;
    let booking: any;
    let payment: any;

    return [
      {
        id: 'acquire-lock',
        name: 'Acquire Session Lock',
        action: async () => {
          lock = await this.lockService.acquire(lockKey, { ttl: 60000 });
          return lock;
        },
        compensate: async () => {
          if (lock) {
            await this.lockService.release(lock);
          }
        },
        retryable: true,
        maxRetries: 3,
        timeout: 5000,
      },
      {
        id: 'validate-capacity',
        name: 'Validate Session Capacity',
        action: async () => {
          const available = await this.bookingService.checkCapacity(
            bookingData.sessionId,
            bookingData.attendees.length
          );
          if (!available) {
            throw new HttpErrors.Conflict('Insufficient capacity');
          }
        },
        compensate: async () => {
          // No compensation needed for validation
        },
      },
      {
        id: 'create-booking',
        name: 'Create Booking Record',
        action: async () => {
          booking = await this.bookingService.createBooking(bookingData);
          return booking;
        },
        compensate: async () => {
          if (booking) {
            await this.bookingService.cancelBooking(booking.id);
          }
        },
        retryable: false,
        timeout: 10000,
      },
      {
        id: 'reserve-capacity',
        name: 'Reserve Session Capacity',
        action: async () => {
          await this.bookingService.reserveCapacity(
            bookingData.sessionId,
            bookingData.attendees.length
          );
        },
        compensate: async () => {
          if (booking) {
            await this.bookingService.releaseCapacity(
              bookingData.sessionId,
              bookingData.attendees.length
            );
          }
        },
      },
      {
        id: 'create-payment',
        name: 'Create Payment Intent',
        action: async () => {
          payment = await this.paymentService.createPaymentIntent(booking);
          return payment;
        },
        compensate: async () => {
          if (payment) {
            await this.paymentService.cancelPaymentIntent(payment.id);
          }
        },
        retryable: true,
        maxRetries: 2,
        timeout: 15000,
      },
      {
        id: 'send-confirmation',
        name: 'Send Confirmation Email',
        action: async () => {
          await this.notificationService.sendBookingConfirmation(booking);
        },
        compensate: async () => {
          // No compensation for email - can be resent
        },
        retryable: true,
        maxRetries: 3,
        timeout: 10000,
      },
      {
        id: 'release-lock',
        name: 'Release Session Lock',
        action: async () => {
          if (lock) {
            await this.lockService.release(lock);
            lock = null;
          }
        },
        compensate: async () => {
          // No compensation needed
        },
      },
    ];
  }

  /**
   * Create refund saga
   */
  createRefundSaga(refundData: any): SagaStep[] {
    let refund: any;
    let stripeRefund: any;

    return [
      {
        id: 'validate-refund',
        name: 'Validate Refund Request',
        action: async () => {
          await this.paymentService.validateRefundEligibility(refundData);
        },
        compensate: async () => {
          // No compensation needed
        },
      },
      {
        id: 'create-refund-record',
        name: 'Create Refund Record',
        action: async () => {
          refund = await this.paymentService.createRefundRecord(refundData);
          return refund;
        },
        compensate: async () => {
          if (refund) {
            await this.paymentService.cancelRefundRecord(refund.id);
          }
        },
      },
      {
        id: 'process-stripe-refund',
        name: 'Process Stripe Refund',
        action: async () => {
          stripeRefund = await this.paymentService.processStripeRefund(refund);
          return stripeRefund;
        },
        compensate: async () => {
          // Cannot compensate Stripe refund
          throw new Error('Cannot reverse Stripe refund');
        },
        retryable: true,
        maxRetries: 2,
        timeout: 20000,
      },
      {
        id: 'update-booking-status',
        name: 'Update Booking Status',
        action: async () => {
          await this.bookingService.updateBookingStatus(
            refundData.bookingId,
            'refunded'
          );
        },
        compensate: async () => {
          await this.bookingService.updateBookingStatus(
            refundData.bookingId,
            'confirmed'
          );
        },
      },
      {
        id: 'release-capacity',
        name: 'Release Session Capacity',
        action: async () => {
          const booking = await this.bookingService.getBooking(refundData.bookingId);
          await this.bookingService.releaseCapacity(
            booking.sessionId,
            booking.attendees.length
          );
        },
        compensate: async () => {
          const booking = await this.bookingService.getBooking(refundData.bookingId);
          await this.bookingService.reserveCapacity(
            booking.sessionId,
            booking.attendees.length
          );
        },
      },
      {
        id: 'send-refund-confirmation',
        name: 'Send Refund Confirmation',
        action: async () => {
          await this.notificationService.sendRefundConfirmation(refund);
        },
        compensate: async () => {
          // No compensation for email
        },
        retryable: true,
        maxRetries: 3,
      },
    ];
  }
}