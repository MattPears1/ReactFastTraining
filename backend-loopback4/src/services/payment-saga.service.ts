import { v4 as uuidv4 } from 'uuid';
import { MonitoringService } from './monitoring.service';
import { db } from '../config/database.config';
import { EventEmitter } from 'events';

export interface SagaStep<T = any> {
  name: string;
  execute: (context: T) => Promise<any>;
  compensate: (context: T, error?: any) => Promise<void>;
  retryable?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export interface SagaContext {
  sagaId: string;
  startedAt: Date;
  completedSteps: string[];
  stepResults: Map<string, any>;
  metadata: Record<string, any>;
}

export enum SagaStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
  FAILED = 'FAILED'
}

export interface SagaResult<T> {
  success: boolean;
  sagaId: string;
  status: SagaStatus;
  result?: T;
  error?: any;
  completedSteps: string[];
  compensatedSteps?: string[];
  duration: number;
}

// Saga Orchestrator for distributed transactions
export class SagaOrchestrator extends EventEmitter {
  private sagas = new Map<string, SagaContext>();

  async execute<T>(
    name: string,
    steps: SagaStep<T>[],
    initialContext: T
  ): Promise<SagaResult<T>> {
    const sagaId = uuidv4();
    const startTime = Date.now();
    
    const context: SagaContext = {
      sagaId,
      startedAt: new Date(),
      completedSteps: [],
      stepResults: new Map(),
      metadata: { name, ...initialContext },
    };

    this.sagas.set(sagaId, context);
    this.emit('saga:started', { sagaId, name });

    MonitoringService.info(`Saga ${name} started`, {
      sagaId,
      steps: steps.map(s => s.name),
    });

    let lastResult: any = initialContext;
    const executedSteps: SagaStep<T>[] = [];

    try {
      // Execute steps in sequence
      for (const step of steps) {
        lastResult = await this.executeStep(step, lastResult, context);
        executedSteps.push(step);
        context.completedSteps.push(step.name);
        context.stepResults.set(step.name, lastResult);
        
        this.emit('step:completed', {
          sagaId,
          stepName: step.name,
          result: lastResult,
        });
      }

      // All steps completed successfully
      const result: SagaResult<T> = {
        success: true,
        sagaId,
        status: SagaStatus.COMPLETED,
        result: lastResult,
        completedSteps: context.completedSteps,
        duration: Date.now() - startTime,
      };

      this.emit('saga:completed', result);
      MonitoringService.info(`Saga ${name} completed successfully`, {
        sagaId,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      // Step failed - initiate compensation
      MonitoringService.error(`Saga ${name} failed at step`, error, {
        sagaId,
        failedStep: executedSteps[executedSteps.length - 1]?.name,
      });

      this.emit('saga:failed', {
        sagaId,
        error,
        failedStep: executedSteps[executedSteps.length - 1]?.name,
      });

      // Compensate in reverse order
      const compensatedSteps = await this.compensate(
        executedSteps.reverse(),
        context,
        error
      );

      const result: SagaResult<T> = {
        success: false,
        sagaId,
        status: compensatedSteps.length === executedSteps.length
          ? SagaStatus.COMPENSATED
          : SagaStatus.FAILED,
        error,
        completedSteps: context.completedSteps,
        compensatedSteps,
        duration: Date.now() - startTime,
      };

      return result;
    } finally {
      this.sagas.delete(sagaId);
    }
  }

  private async executeStep<T>(
    step: SagaStep<T>,
    context: T,
    sagaContext: SagaContext
  ): Promise<any> {
    const maxRetries = step.retryable ? (step.maxRetries || 3) : 1;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        MonitoringService.info(`Executing saga step ${step.name}`, {
          sagaId: sagaContext.sagaId,
          attempt,
        });

        // Execute with timeout if specified
        if (step.timeout) {
          return await this.executeWithTimeout(
            step.execute(context),
            step.timeout,
            `Step ${step.name} timed out`
          );
        }

        return await step.execute(context);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          MonitoringService.warn(
            `Saga step ${step.name} failed, retrying`,
            {
              sagaId: sagaContext.sagaId,
              attempt,
              error: error.message,
            }
          );
          
          // Exponential backoff
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    throw lastError;
  }

  private async compensate<T>(
    steps: SagaStep<T>[],
    context: SagaContext,
    originalError: any
  ): Promise<string[]> {
    const compensatedSteps: string[] = [];

    this.emit('saga:compensating', {
      sagaId: context.sagaId,
      stepsToCompensate: steps.map(s => s.name),
    });

    for (const step of steps) {
      try {
        MonitoringService.info(`Compensating saga step ${step.name}`, {
          sagaId: context.sagaId,
        });

        const stepContext = context.stepResults.get(step.name);
        await step.compensate(stepContext, originalError);
        
        compensatedSteps.push(step.name);
        
        this.emit('step:compensated', {
          sagaId: context.sagaId,
          stepName: step.name,
        });
      } catch (compensationError) {
        MonitoringService.error(
          `Failed to compensate step ${step.name}`,
          compensationError,
          { sagaId: context.sagaId }
        );
        
        this.emit('step:compensation-failed', {
          sagaId: context.sagaId,
          stepName: step.name,
          error: compensationError,
        });
        
        // Continue compensating other steps even if one fails
      }
    }

    return compensatedSteps;
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeout)
      ),
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSagaStatus(sagaId: string): SagaContext | undefined {
    return this.sagas.get(sagaId);
  }
}

// Payment Processing Saga Example
export class PaymentProcessingSaga {
  static async createPaymentSaga(
    orchestrator: SagaOrchestrator,
    paymentData: {
      bookingId: string;
      amount: number;
      customerId: string;
      paymentMethodId: string;
    }
  ): Promise<SagaResult<any>> {
    const steps: SagaStep[] = [
      {
        name: 'validate-booking',
        execute: async (context) => {
          // Validate booking exists and is in correct state
          const [booking] = await db
            .select()
            .from('bookings')
            .where({ id: context.bookingId });
          
          if (!booking) {
            throw new Error('Booking not found');
          }
          
          if (booking.status !== 'pending') {
            throw new Error('Booking is not in pending state');
          }
          
          return { ...context, booking };
        },
        compensate: async () => {
          // No compensation needed for validation
        },
        retryable: true,
        maxRetries: 3,
      },
      {
        name: 'reserve-capacity',
        execute: async (context) => {
          // Reserve capacity in the session
          await db
            .update('course_sessions')
            .set({
              reserved_capacity: db.raw('reserved_capacity + ?', [
                context.booking.numberOfAttendees,
              ]),
            })
            .where({ id: context.booking.sessionId });
          
          return { ...context, capacityReserved: true };
        },
        compensate: async (context) => {
          // Release reserved capacity
          if (context.capacityReserved) {
            await db
              .update('course_sessions')
              .set({
                reserved_capacity: db.raw('reserved_capacity - ?', [
                  context.booking.numberOfAttendees,
                ]),
              })
              .where({ id: context.booking.sessionId });
          }
        },
        retryable: true,
        timeout: 5000,
      },
      {
        name: 'create-payment-intent',
        execute: async (context) => {
          // Create Stripe payment intent
          const { StripeService } = await import('./stripe.service.enhanced');
          
          const { paymentIntent, paymentRecord } = await StripeService.createPaymentIntent({
            amount: context.amount,
            bookingId: context.bookingId,
            customerEmail: context.booking.customerEmail,
            metadata: {
              sagaId: context.sagaId,
            },
          });
          
          return {
            ...context,
            paymentIntentId: paymentIntent.id,
            paymentRecordId: paymentRecord.id,
          };
        },
        compensate: async (context) => {
          // Cancel payment intent if created
          if (context.paymentIntentId) {
            const { StripeService } = await import('./stripe.service.enhanced');
            try {
              await StripeService.cancelPaymentIntent(context.paymentIntentId);
            } catch (error) {
              // Log but don't fail compensation
              MonitoringService.error('Failed to cancel payment intent', error);
            }
          }
        },
        retryable: true,
        maxRetries: 2,
        timeout: 10000,
      },
      {
        name: 'update-booking-status',
        execute: async (context) => {
          // Update booking to processing
          await db
            .update('bookings')
            .set({
              status: 'payment_processing',
              paymentIntentId: context.paymentIntentId,
              updatedAt: new Date(),
            })
            .where({ id: context.bookingId });
          
          return { ...context, bookingUpdated: true };
        },
        compensate: async (context) => {
          // Revert booking status
          if (context.bookingUpdated) {
            await db
              .update('bookings')
              .set({
                status: 'pending',
                paymentIntentId: null,
                updatedAt: new Date(),
              })
              .where({ id: context.bookingId });
          }
        },
        retryable: true,
      },
      {
        name: 'send-confirmation-email',
        execute: async (context) => {
          // Send booking confirmation email
          const { EmailService } = await import('./email.service');
          
          await EmailService.sendBookingConfirmation({
            bookingId: context.bookingId,
            customerEmail: context.booking.customerEmail,
            paymentIntentId: context.paymentIntentId,
          });
          
          return { ...context, emailSent: true };
        },
        compensate: async (context) => {
          // Send cancellation email if confirmation was sent
          if (context.emailSent) {
            const { EmailService } = await import('./email.service');
            try {
              await EmailService.sendBookingCancellation({
                bookingId: context.bookingId,
                customerEmail: context.booking.customerEmail,
                reason: 'Payment processing failed',
              });
            } catch (error) {
              // Log but don't fail compensation
              MonitoringService.error('Failed to send cancellation email', error);
            }
          }
        },
        retryable: false, // Don't retry email sending
      },
    ];

    return orchestrator.execute('payment-processing', steps, paymentData);
  }
}

// Refund Processing Saga
export class RefundProcessingSaga {
  static async createRefundSaga(
    orchestrator: SagaOrchestrator,
    refundData: {
      refundId: string;
      paymentId: string;
      amount: number;
      reason: string;
    }
  ): Promise<SagaResult<any>> {
    const steps: SagaStep[] = [
      {
        name: 'validate-refund',
        execute: async (context) => {
          // Validate refund request
          const [refund] = await db
            .select()
            .from('refunds')
            .where({ id: context.refundId });
          
          if (!refund) {
            throw new Error('Refund request not found');
          }
          
          if (refund.status !== 'approved') {
            throw new Error('Refund is not approved');
          }
          
          return { ...context, refund };
        },
        compensate: async () => {
          // No compensation needed
        },
      },
      {
        name: 'process-stripe-refund',
        execute: async (context) => {
          const { StripeService } = await import('./stripe.service.enhanced');
          
          const stripeRefund = await StripeService.createRefund({
            paymentIntentId: context.refund.stripePaymentIntentId,
            amount: context.amount,
            reason: context.reason,
            metadata: {
              refundId: context.refundId,
              sagaId: context.sagaId,
            },
          });
          
          return {
            ...context,
            stripeRefundId: stripeRefund.id,
            stripeRefundStatus: stripeRefund.status,
          };
        },
        compensate: async () => {
          // Cannot reverse a Stripe refund
          MonitoringService.warn('Cannot compensate Stripe refund');
        },
        retryable: true,
        maxRetries: 3,
        timeout: 15000,
      },
      {
        name: 'update-refund-status',
        execute: async (context) => {
          await db
            .update('refunds')
            .set({
              status: 'processed',
              stripeRefundId: context.stripeRefundId,
              processedAt: new Date(),
              updatedAt: new Date(),
            })
            .where({ id: context.refundId });
          
          return { ...context, refundUpdated: true };
        },
        compensate: async (context) => {
          if (context.refundUpdated) {
            await db
              .update('refunds')
              .set({
                status: 'approved',
                stripeRefundId: null,
                processedAt: null,
                updatedAt: new Date(),
              })
              .where({ id: context.refundId });
          }
        },
      },
      {
        name: 'update-booking-status',
        execute: async (context) => {
          await db
            .update('bookings')
            .set({
              status: 'refunded',
              updatedAt: new Date(),
            })
            .where({ id: context.refund.bookingId });
          
          return { ...context, bookingUpdated: true };
        },
        compensate: async (context) => {
          if (context.bookingUpdated) {
            await db
              .update('bookings')
              .set({
                status: 'confirmed',
                updatedAt: new Date(),
              })
              .where({ id: context.refund.bookingId });
          }
        },
      },
      {
        name: 'release-session-capacity',
        execute: async (context) => {
          const [booking] = await db
            .select()
            .from('bookings')
            .where({ id: context.refund.bookingId });
          
          await db
            .update('course_sessions')
            .set({
              available_capacity: db.raw('available_capacity + ?', [
                booking.numberOfAttendees,
              ]),
            })
            .where({ id: booking.sessionId });
          
          return { ...context, capacityReleased: true };
        },
        compensate: async (context) => {
          if (context.capacityReleased) {
            const [booking] = await db
              .select()
              .from('bookings')
              .where({ id: context.refund.bookingId });
            
            await db
              .update('course_sessions')
              .set({
                available_capacity: db.raw('available_capacity - ?', [
                  booking.numberOfAttendees,
                ]),
              })
              .where({ id: booking.sessionId });
          }
        },
      },
      {
        name: 'send-refund-email',
        execute: async (context) => {
          const { EmailService } = await import('./email.service');
          
          await EmailService.sendRefundConfirmation({
            refundId: context.refundId,
            customerEmail: context.refund.customerEmail,
            amount: context.amount,
          });
          
          return { ...context, emailSent: true };
        },
        compensate: async () => {
          // No compensation for email
        },
        retryable: false,
      },
    ];

    return orchestrator.execute('refund-processing', steps, refundData);
  }
}