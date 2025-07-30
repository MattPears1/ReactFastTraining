import Stripe from 'stripe';
import {CircuitBreaker, CircuitBreakerFactory, CircuitState} from '../circuit-breaker/circuit-breaker';
import {HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/core';
import {BookingEnhancedRepository} from '../../repositories/enhanced/booking-enhanced.repository';
import {repository} from '@loopback/repository';
import {Booking, Payment, PaymentStatus} from '../../models';

export interface PaymentResult {
  success: boolean;
  paymentIntent?: Stripe.PaymentIntent;
  error?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

export interface RefundResult {
  success: boolean;
  refund?: Stripe.Refund;
  error?: string;
}

export class PaymentServiceEnhanced {
  private stripe: Stripe;
  private paymentCircuitBreaker: CircuitBreaker;
  private refundCircuitBreaker: CircuitBreaker;
  private webhookCircuitBreaker: CircuitBreaker;

  constructor(
    @inject('services.stripe.key')
    private stripeKey: string,
    @repository(BookingEnhancedRepository)
    private bookingRepository: BookingEnhancedRepository,
    @inject('services.monitoring')
    private monitoring: any
  ) {
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      timeout: 20000,
      maxNetworkRetries: 2,
    });

    // Initialize circuit breakers
    this.paymentCircuitBreaker = CircuitBreakerFactory.createPaymentCircuitBreaker(
      (state) => this.onCircuitStateChange('payment', state)
    );

    this.refundCircuitBreaker = CircuitBreakerFactory.createPaymentCircuitBreaker(
      (state) => this.onCircuitStateChange('refund', state)
    );

    this.webhookCircuitBreaker = CircuitBreakerFactory.createExternalAPICircuitBreaker(
      'Stripe Webhooks',
      (state) => this.onCircuitStateChange('webhook', state)
    );
  }

  async createPaymentIntent(
    booking: Booking,
    idempotencyKey?: string
  ): Promise<PaymentResult> {
    try {
      const result = await this.paymentCircuitBreaker.execute(async () => {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(booking.totalAmount * 100), // Convert to pence
          currency: 'gbp',
          metadata: {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            customerEmail: booking.contactDetails.email,
          },
          description: `Booking ${booking.bookingReference} - React Fast Training`,
          receipt_email: booking.contactDetails.email,
          automatic_payment_methods: {
            enabled: true,
          },
          // 3D Secure authentication
          payment_method_options: {
            card: {
              request_three_d_secure: 'automatic',
            },
          },
        }, {
          idempotencyKey: idempotencyKey || `booking_${booking.id}_${Date.now()}`,
        });

        return paymentIntent;
      });

      // Log successful payment intent creation
      await this.logPaymentEvent('payment_intent_created', {
        bookingId: booking.id,
        paymentIntentId: result.id,
        amount: result.amount,
      });

      return {
        success: true,
        paymentIntent: result,
        clientSecret: result.client_secret || undefined,
      };
    } catch (error) {
      // Log payment failure
      await this.logPaymentEvent('payment_intent_failed', {
        bookingId: booking.id,
        error: error.message,
      });

      // Check if circuit breaker is open
      if (this.paymentCircuitBreaker.isOpen()) {
        throw new HttpErrors.ServiceUnavailable(
          'Payment service is temporarily unavailable. Please try again in a few minutes.'
        );
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async confirmPayment(
    paymentIntentId: string,
    bookingId: string
  ): Promise<PaymentResult> {
    try {
      const result = await this.paymentCircuitBreaker.execute(async () => {
        // Retrieve the payment intent
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

        // Check if payment requires additional action
        if (paymentIntent.status === 'requires_action') {
          return {
            success: false,
            requiresAction: true,
            clientSecret: paymentIntent.client_secret || undefined,
          };
        }

        // Check if payment is already successful
        if (paymentIntent.status === 'succeeded') {
          // Update booking status
          await this.bookingRepository.updateById(bookingId, {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          });

          return {
            success: true,
            paymentIntent,
          };
        }

        // Payment failed or is in unexpected state
        return {
          success: false,
          error: `Payment is in ${paymentIntent.status} state`,
        };
      });

      return result as PaymentResult;
    } catch (error) {
      await this.logPaymentEvent('payment_confirmation_failed', {
        bookingId,
        paymentIntentId,
        error: error.message,
      });

      throw error;
    }
  }

  async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<RefundResult> {
    try {
      const result = await this.refundCircuitBreaker.execute(async () => {
        // Create refund
        const refund = await this.stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount, // If not specified, full refund
          reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
        });

        return refund;
      });

      await this.logPaymentEvent('refund_processed', {
        refundId: result.id,
        paymentIntentId,
        amount: result.amount,
        status: result.status,
      });

      return {
        success: true,
        refund: result,
      };
    } catch (error) {
      await this.logPaymentEvent('refund_failed', {
        paymentIntentId,
        error: error.message,
      });

      if (this.refundCircuitBreaker.isOpen()) {
        throw new HttpErrors.ServiceUnavailable(
          'Refund service is temporarily unavailable. Your refund will be processed as soon as the service is restored.'
        );
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleWebhook(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<void> {
    try {
      await this.webhookCircuitBreaker.execute(async () => {
        // Verify webhook signature
        const event = this.stripe.webhooks.constructEvent(
          payload,
          signature,
          webhookSecret
        );

        // Process different event types
        switch (event.type) {
          case 'payment_intent.succeeded':
            await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
            break;

          case 'payment_intent.payment_failed':
            await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
            break;

          case 'charge.refunded':
            await this.handleRefundUpdate(event.data.object as Stripe.Charge);
            break;

          case 'payment_intent.requires_action':
            await this.handle3DSecureRequired(event.data.object as Stripe.PaymentIntent);
            break;

          default:
            console.log(`Unhandled webhook event type: ${event.type}`);
        }

        // Store webhook event for audit
        await this.storeWebhookEvent(event);
      });
    } catch (error) {
      if (error.type === 'StripeSignatureVerificationError') {
        throw new HttpErrors.Unauthorized('Invalid webhook signature');
      }

      if (this.webhookCircuitBreaker.isOpen()) {
        // Queue webhook for later processing
        await this.queueWebhookForRetry(payload, signature);
        throw new HttpErrors.ServiceUnavailable('Webhook processing temporarily unavailable');
      }

      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata.bookingId;
    if (!bookingId) return;

    // Update booking status
    await this.bookingRepository.updateById(bookingId, {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      paymentIntentId: paymentIntent.id,
    });

    // Trigger booking confirmation flow
    await this.triggerBookingConfirmation(bookingId);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata.bookingId;
    if (!bookingId) return;

    // Log payment failure
    await this.logPaymentEvent('payment_failed_webhook', {
      bookingId,
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    });

    // Send failure notification
    await this.sendPaymentFailureNotification(bookingId);
  }

  private async handleRefundUpdate(charge: Stripe.Charge): Promise<void> {
    if (!charge.payment_intent || typeof charge.payment_intent !== 'string') return;

    await this.logPaymentEvent('refund_webhook', {
      chargeId: charge.id,
      paymentIntentId: charge.payment_intent,
      refunded: charge.refunded,
      amountRefunded: charge.amount_refunded,
    });
  }

  private async handle3DSecureRequired(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata.bookingId;
    if (!bookingId) return;

    // Send notification to complete 3D Secure
    await this.send3DSecureNotification(bookingId, paymentIntent.client_secret || '');
  }

  private async onCircuitStateChange(service: string, state: CircuitState): void {
    // Log state change
    console.log(`Circuit breaker for ${service} changed to ${state}`);

    // Send monitoring alert
    if (this.monitoring) {
      await this.monitoring.sendAlert({
        severity: state === CircuitState.OPEN ? 'critical' : 'warning',
        service: `payment-${service}`,
        message: `Circuit breaker state changed to ${state}`,
        timestamp: new Date(),
      });
    }

    // Additional actions based on state
    if (state === CircuitState.OPEN) {
      // Notify operations team
      await this.notifyOperationsTeam(service, state);
    }
  }

  private async logPaymentEvent(eventType: string, data: any): Promise<void> {
    // Implementation would log to database or monitoring service
    console.log(`Payment Event: ${eventType}`, data);
  }

  private async storeWebhookEvent(event: Stripe.Event): Promise<void> {
    // Store in database for audit and replay capability
    console.log('Storing webhook event:', event.id);
  }

  private async queueWebhookForRetry(payload: any, signature: string): Promise<void> {
    // Queue for later processing when service recovers
    console.log('Queueing webhook for retry');
  }

  private async triggerBookingConfirmation(bookingId: string): Promise<void> {
    // Trigger the booking confirmation flow
    console.log('Triggering booking confirmation for:', bookingId);
  }

  private async sendPaymentFailureNotification(bookingId: string): Promise<void> {
    // Send notification about payment failure
    console.log('Sending payment failure notification for:', bookingId);
  }

  private async send3DSecureNotification(bookingId: string, clientSecret: string): Promise<void> {
    // Send notification to complete 3D Secure
    console.log('Sending 3D Secure notification for:', bookingId);
  }

  private async notifyOperationsTeam(service: string, state: CircuitState): Promise<void> {
    // Notify operations team about circuit breaker state
    console.log(`Notifying operations: ${service} circuit is ${state}`);
  }

  // Get circuit breaker statistics
  getCircuitBreakerStats() {
    return {
      payment: this.paymentCircuitBreaker.getStats(),
      refund: this.refundCircuitBreaker.getStats(),
      webhook: this.webhookCircuitBreaker.getStats(),
    };
  }

  // Health check
  async healthCheck(): Promise<{healthy: boolean; services: any}> {
    const services = {
      payment: this.paymentCircuitBreaker.isClosed() ? 'healthy' : 'degraded',
      refund: this.refundCircuitBreaker.isClosed() ? 'healthy' : 'degraded',
      webhook: this.webhookCircuitBreaker.isClosed() ? 'healthy' : 'degraded',
    };

    const healthy = Object.values(services).every(status => status === 'healthy');

    return {healthy, services};
  }
}