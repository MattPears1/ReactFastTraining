import { expect } from '@loopback/testlab';
import sinon from 'sinon';
import Stripe from 'stripe';
import { StripeServiceEnhanced as StripeService, PaymentError } from '../../../services/stripe.service.enhanced';
import { db } from '../../../config/database.config';
import { payments, paymentLogs, bookings, webhookEvents } from '../../../db/schema';

describe('StripeService', () => {
  let sandbox: sinon.SinonSandbox;
  let stripeStub: sinon.SinonStubbedInstance<Stripe>;
  let dbStub: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Mock Stripe
    stripeStub = sandbox.createStubInstance(Stripe);
    stripeStub.paymentIntents = {
      create: sandbox.stub(),
      retrieve: sandbox.stub(),
    } as any;
    stripeStub.webhooks = {
      constructEvent: sandbox.stub(),
    } as any;
    stripeStub.refunds = {
      create: sandbox.stub(),
    } as any;

    // Mock database
    dbStub = {
      insert: sandbox.stub().returns({
        values: sandbox.stub().returns({
          returning: sandbox.stub().resolves([{ id: 'payment-123' }]),
          onConflictDoNothing: sandbox.stub().returns({
            returning: sandbox.stub().resolves([{ id: 'webhook-123' }]),
          }),
        }),
      }),
      update: sandbox.stub().returns({
        set: sandbox.stub().returns({
          where: sandbox.stub().resolves({ rowCount: 1 }),
        }),
      }),
      select: sandbox.stub().returns({
        from: sandbox.stub().returns({
          where: sandbox.stub().resolves([]),
        }),
      }),
      transaction: sandbox.stub().callsFake(async (fn) => fn(dbStub)),
      execute: sandbox.stub().resolves({ rows: [{ seq: 1001 }] }),
    };

    // Replace the actual Stripe instance
    (StripeService as any).stripe = stripeStub;
    (StripeService as any).initialized = true;

    // Mock environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      };

      stripeStub.paymentIntents.create.resolves(mockPaymentIntent as any);

      const result = await StripeService.createPaymentIntent({
        amount: 75,
        bookingId: 'booking-123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
      });

      expect(result).to.have.property('paymentIntent');
      expect(result).to.have.property('paymentRecord');
      expect(result).to.have.property('clientSecret');
      expect(result.paymentIntent.id).to.equal('pi_test_123');
      expect(result.clientSecret).to.equal('pi_test_123_secret');

      // Verify Stripe was called with correct parameters
      sinon.assert.calledOnce(stripeStub.paymentIntents.create);
      const callArgs = stripeStub.paymentIntents.create.getCall(0).args[0];
      expect(callArgs.amount).to.equal(7500); // 75 pounds in pence
      expect(callArgs.currency).to.equal('gbp');
      expect(callArgs.receipt_email).to.equal('test@example.com');
    });

    it('should throw error for invalid amount', async () => {
      try {
        await StripeService.createPaymentIntent({
          amount: -10,
          bookingId: 'booking-123',
          customerEmail: 'test@example.com',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(PaymentError);
        expect(error.code).to.equal('INVALID_AMOUNT');
        expect(error.statusCode).to.equal(400);
      }
    });

    it('should throw error for invalid email', async () => {
      try {
        await StripeService.createPaymentIntent({
          amount: 75,
          bookingId: 'booking-123',
          customerEmail: 'invalid-email',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(PaymentError);
        expect(error.code).to.equal('INVALID_EMAIL');
      }
    });

    it('should handle Stripe API errors', async () => {
      const stripeError = new Error('Stripe API error');
      (stripeError as any).type = 'StripeAPIError';
      stripeStub.paymentIntents.create.rejects(stripeError);

      try {
        await StripeService.createPaymentIntent({
          amount: 75,
          bookingId: 'booking-123',
          customerEmail: 'test@example.com',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(PaymentError);
        expect(error.code).to.equal('PAYMENT_CREATION_FAILED');
        expect(error.statusCode).to.equal(500);
      }
    });

    it('should generate unique idempotency keys', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      };

      stripeStub.paymentIntents.create.resolves(mockPaymentIntent as any);

      await StripeService.createPaymentIntent({
        amount: 75,
        bookingId: 'booking-123',
        customerEmail: 'test@example.com',
      });

      await StripeService.createPaymentIntent({
        amount: 75,
        bookingId: 'booking-123',
        customerEmail: 'test@example.com',
      });

      // Verify different idempotency keys were used
      const firstCall = stripeStub.paymentIntents.create.getCall(0).args[1];
      const secondCall = stripeStub.paymentIntents.create.getCall(1).args[1];
      expect(firstCall.idempotencyKey).to.not.equal(secondCall.idempotencyKey);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm successful payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        latest_charge: {
          id: 'ch_test_123',
          receipt_url: 'https://receipt.url',
        },
        payment_method: {
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
          },
        },
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent as any);
      
      // Mock database responses
      dbStub.select.returns({
        from: sandbox.stub().returns({
          where: sandbox.stub().resolves([{
            id: 'payment-123',
            bookingId: 'booking-123',
          }]),
        }),
      });

      const result = await StripeService.confirmPayment('pi_test_123');

      expect(result.success).to.be.true();
      expect(result).to.have.property('payment');
      expect(result).to.have.property('booking');
      
      // Verify payment intent was retrieved with expansions
      sinon.assert.calledWith(stripeStub.paymentIntents.retrieve, 'pi_test_123', {
        expand: ['payment_method', 'latest_charge', 'latest_charge.outcome'],
      });
    });

    it('should handle payment requiring action', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'requires_action',
        next_action: {
          type: 'redirect_to_url',
          redirect_to_url: {
            url: 'https://hooks.stripe.com/redirect',
          },
        },
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent as any);
      
      dbStub.select.returns({
        from: sandbox.stub().returns({
          where: sandbox.stub().resolves([{
            id: 'payment-123',
            bookingId: 'booking-123',
          }]),
        }),
      });

      const result = await StripeService.confirmPayment('pi_test_123');

      expect(result.success).to.be.false();
      expect(result.requiresAction).to.be.true();
      expect(result.actionUrl).to.equal('https://hooks.stripe.com/redirect');
    });

    it('should handle payment not found', async () => {
      stripeStub.paymentIntents.retrieve.resolves({} as any);
      
      dbStub.select.returns({
        from: sandbox.stub().returns({
          where: sandbox.stub().resolves([]),
        }),
      });

      try {
        await StripeService.confirmPayment('pi_test_123');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(PaymentError);
        expect(error.code).to.equal('PAYMENT_NOT_FOUND');
        expect(error.statusCode).to.equal(404);
      }
    });
  });

  describe('handleWebhook', () => {
    it('should handle valid webhook event', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          },
        },
      };

      stripeStub.webhooks.constructEvent.returns(mockEvent as any);

      dbStub.select.returns({
        from: sandbox.stub().returns({
          where: sandbox.stub().resolves([]),
        }),
      });

      const result = await StripeService.handleWebhook(
        'test-signature',
        'test-payload'
      );

      expect(result.received).to.be.true();
      expect(result.eventId).to.equal('evt_test_123');
      expect(result.eventType).to.equal('payment_intent.succeeded');
      
      // Verify webhook signature was verified
      sinon.assert.calledWith(
        stripeStub.webhooks.constructEvent,
        'test-payload',
        'test-signature',
        'whsec_test_123'
      );
    });

    it('should reject invalid webhook signature', async () => {
      const error = new Error('Invalid signature');
      stripeStub.webhooks.constructEvent.throws(error);

      try {
        await StripeService.handleWebhook(
          'invalid-signature',
          'test-payload'
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(PaymentError);
        expect(error.code).to.equal('WEBHOOK_SIGNATURE_INVALID');
        expect(error.statusCode).to.equal(401);
      }
    });

    it('should handle duplicate webhook events', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
          },
        },
      };

      stripeStub.webhooks.constructEvent.returns(mockEvent as any);

      // Mock already processed event
      dbStub.select.returns({
        from: sandbox.stub().returns({
          where: sandbox.stub().resolves([{
            id: 'webhook-123',
            processed: true,
          }]),
        }),
      });

      const result = await StripeService.handleWebhook(
        'test-signature',
        'test-payload'
      );

      expect(result.received).to.be.true();
      expect(result.eventId).to.equal('evt_test_123');
      
      // Should not process again
      sinon.assert.notCalled(dbStub.update);
    });
  });

  describe('createRefund', () => {
    it('should create full refund successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 7500,
      };

      const mockRefund = {
        id: 're_test_123',
        amount: 7500,
        status: 'succeeded',
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent as any);
      stripeStub.refunds.create.resolves(mockRefund as any);

      const result = await StripeService.createRefund({
        paymentIntentId: 'pi_test_123',
      });

      expect(result.id).to.equal('re_test_123');
      expect(result.amount).to.equal(7500);
      
      // Verify refund was created without amount (full refund)
      sinon.assert.calledWith(stripeStub.refunds.create, {
        payment_intent: 'pi_test_123',
        reason: 'requested_by_customer',
        metadata: sinon.match.object,
      });
    });

    it('should create partial refund successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 7500,
      };

      const mockRefund = {
        id: 're_test_123',
        amount: 2500,
        status: 'succeeded',
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent as any);
      stripeStub.refunds.create.resolves(mockRefund as any);

      const result = await StripeService.createRefund({
        paymentIntentId: 'pi_test_123',
        amount: 25, // 25 pounds
      });

      expect(result.amount).to.equal(2500);
      
      // Verify refund was created with correct amount
      const createCall = stripeStub.refunds.create.getCall(0).args[0];
      expect(createCall.amount).to.equal(2500);
    });

    it('should reject refund for non-succeeded payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'canceled',
        amount: 7500,
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent as any);

      try {
        await StripeService.createRefund({
          paymentIntentId: 'pi_test_123',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(PaymentError);
        expect(error.code).to.equal('PAYMENT_NOT_REFUNDABLE');
        expect(error.statusCode).to.equal(400);
      }
    });

    it('should reject refund exceeding payment amount', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 7500,
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent as any);

      try {
        await StripeService.createRefund({
          paymentIntentId: 'pi_test_123',
          amount: 100, // 100 pounds > 75 pounds
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(PaymentError);
        expect(error.code).to.equal('REFUND_EXCEEDS_PAYMENT');
        expect(error.statusCode).to.equal(400);
      }
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      // Reset metrics
      StripeService.resetMetrics();

      // Simulate some operations
      (StripeService as any).metrics.paymentIntentsCreated = 10;
      (StripeService as any).metrics.paymentIntentsSucceeded = 8;
      (StripeService as any).metrics.paymentIntentsFailed = 2;
      (StripeService as any).metrics.webhooksProcessed = 15;
      (StripeService as any).metrics.webhooksFailed = 1;

      const metrics = StripeService.getMetrics();

      expect(metrics.paymentIntentsCreated).to.equal(10);
      expect(metrics.paymentIntentsSucceeded).to.equal(8);
      expect(metrics.paymentIntentsFailed).to.equal(2);
      expect(metrics.webhooksProcessed).to.equal(15);
      expect(metrics.webhooksFailed).to.equal(1);
    });
  });
});