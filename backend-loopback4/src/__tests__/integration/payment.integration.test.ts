import { Client, expect } from '@loopback/testlab';
import { Application } from '@loopback/core';
import { RestServer } from '@loopback/rest';
import { testdb } from '../fixtures/datasources/testdb.datasource';
import { givenHttpServerConfig } from '@loopback/testlab';
import sinon from 'sinon';
import Stripe from 'stripe';

describe('Payment System Integration Tests', () => {
  let app: Application;
  let client: Client;
  let sandbox: sinon.SinonSandbox;
  let stripeStub: any;

  before(async () => {
    sandbox = sinon.createSandbox();
    
    // Mock Stripe for integration tests
    stripeStub = {
      paymentIntents: {
        create: sandbox.stub(),
        retrieve: sandbox.stub(),
      },
      webhooks: {
        constructEvent: sandbox.stub(),
      },
      refunds: {
        create: sandbox.stub(),
      },
    };

    // Create test application
    app = new Application({
      rest: givenHttpServerConfig(),
    });

    // Setup test database
    app.dataSource(testdb);

    // Start the application
    await app.boot();
    await app.start();

    const restServer = await app.getServer(RestServer);
    client = new Client(restServer);
  });

  after(async () => {
    await app.stop();
    sandbox.restore();
  });

  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData();
    
    // Create test user and booking
    await createTestData();
  });

  describe('POST /api/payments/create-intent', () => {
    it('should create payment intent for valid booking', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      };

      stripeStub.paymentIntents.create.resolves(mockPaymentIntent);

      const response = await client
        .post('/api/payments/create-intent')
        .set('Authorization', 'Bearer test-token')
        .send({
          bookingId: 'test-booking-id',
        })
        .expect(200);

      expect(response.body).to.have.property('clientSecret');
      expect(response.body).to.have.property('paymentIntentId');
      expect(response.body).to.have.property('amount');
      expect(response.body).to.have.property('bookingReference');
      expect(response.body.amount).to.equal(75);
    });

    it('should reject payment for non-existent booking', async () => {
      const response = await client
        .post('/api/payments/create-intent')
        .set('Authorization', 'Bearer test-token')
        .send({
          bookingId: 'non-existent-id',
        })
        .expect(404);

      expect(response.body.error.message).to.match(/Booking not found/);
    });

    it('should reject payment for already paid booking', async () => {
      // Create a paid booking
      await createPaidBooking();

      const response = await client
        .post('/api/payments/create-intent')
        .set('Authorization', 'Bearer test-token')
        .send({
          bookingId: 'paid-booking-id',
        })
        .expect(409);

      expect(response.body.error.message).to.match(/Payment already completed/);
    });

    it('should enforce authentication', async () => {
      await client
        .post('/api/payments/create-intent')
        .send({
          bookingId: 'test-booking-id',
        })
        .expect(401);
    });
  });

  describe('POST /api/payments/confirm', () => {
    it('should confirm successful payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        latest_charge: {
          id: 'ch_test_123',
          receipt_url: 'https://receipt.url',
        },
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent);

      const response = await client
        .post('/api/payments/confirm')
        .set('Authorization', 'Bearer test-token')
        .send({
          paymentIntentId: 'pi_test_123',
        })
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('bookingReference');
      expect(response.body).to.have.property('receiptUrl');
    });

    it('should handle payment requiring action', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'requires_action',
        next_action: {
          type: 'redirect_to_url',
        },
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent);

      const response = await client
        .post('/api/payments/confirm')
        .set('Authorization', 'Bearer test-token')
        .send({
          paymentIntentId: 'pi_test_123',
        })
        .expect(200);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('requiresAction', true);
    });
  });

  describe('POST /api/webhooks/stripe', () => {
    it('should process valid webhook', async () => {
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

      stripeStub.webhooks.constructEvent.returns(mockEvent);

      const response = await client
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test-signature')
        .send('raw-payload')
        .expect(200);

      expect(response.body).to.have.property('received', true);
      expect(response.body).to.have.property('eventId', 'evt_test_123');
    });

    it('should reject invalid signature', async () => {
      stripeStub.webhooks.constructEvent.throws(new Error('Invalid signature'));

      await client
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'invalid-signature')
        .send('raw-payload')
        .expect(401);
    });

    it('should require signature header', async () => {
      await client
        .post('/api/webhooks/stripe')
        .send('raw-payload')
        .expect(400);
    });
  });

  describe('Refund Flow', () => {
    it('should create refund request', async () => {
      const response = await client
        .post('/api/refunds/request')
        .set('Authorization', 'Bearer test-token')
        .send({
          bookingId: 'paid-booking-id',
          reason: 'Unable to attend',
        })
        .expect(200);

      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('status', 'pending');
      expect(response.body).to.have.property('amount');
    });

    it('should allow admin to approve refund', async () => {
      // Create refund request
      const refundId = await createRefundRequest();

      const mockRefund = {
        id: 're_test_123',
        status: 'succeeded',
      };

      stripeStub.refunds.create.resolves(mockRefund);

      const response = await client
        .post(`/api/admin/refunds/${refundId}/approve`)
        .set('Authorization', 'Bearer admin-token')
        .send({
          notes: 'Approved - valid reason',
        })
        .expect(200);

      expect(response.body).to.have.property('status', 'approved');
      expect(response.body).to.have.property('stripeRefundId');
    });

    it('should allow admin to reject refund', async () => {
      const refundId = await createRefundRequest();

      const response = await client
        .post(`/api/admin/refunds/${refundId}/reject`)
        .set('Authorization', 'Bearer admin-token')
        .send({
          reason: 'Outside refund policy window',
        })
        .expect(200);

      expect(response.body).to.have.property('status', 'rejected');
      expect(response.body).to.have.property('rejectionReason');
    });
  });

  describe('Invoice Generation', () => {
    it('should generate invoice after successful payment', async () => {
      // Simulate successful payment
      await completePayment('test-booking-id');

      const response = await client
        .get('/api/invoices')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.invoices).to.have.length(1);
      expect(response.body.invoices[0]).to.have.property('invoiceNumber');
      expect(response.body.invoices[0]).to.have.property('totalAmount', '75.00');
    });

    it('should allow invoice download', async () => {
      const invoiceId = await createInvoice();

      const response = await client
        .get(`/api/invoices/${invoiceId}/download`)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.headers['content-type']).to.match(/application\/pdf/);
      expect(response.headers['content-disposition']).to.match(/attachment/);
    });

    it('should allow invoice resend', async () => {
      const invoiceId = await createInvoice();

      const response = await client
        .post(`/api/invoices/${invoiceId}/resend`)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message');
    });
  });

  describe('Security Tests', () => {
    it('should rate limit payment attempts', async () => {
      // Make multiple payment attempts
      for (let i = 0; i < 15; i++) {
        await client
          .post('/api/payments/create-intent')
          .set('Authorization', 'Bearer test-token')
          .send({ bookingId: 'test-booking-id' });
      }

      // Next request should be rate limited
      const response = await client
        .post('/api/payments/create-intent')
        .set('Authorization', 'Bearer test-token')
        .send({ bookingId: 'test-booking-id' })
        .expect(429);

      expect(response.body.error.message).to.match(/Too many/);
    });

    it('should validate input data', async () => {
      const response = await client
        .post('/api/payments/create-intent')
        .set('Authorization', 'Bearer test-token')
        .send({
          bookingId: 'not-a-uuid',
        })
        .expect(400);

      expect(response.body.error.message).to.match(/Invalid/);
    });

    it('should prevent SQL injection', async () => {
      const response = await client
        .get('/api/payments')
        .set('Authorization', 'Bearer test-token')
        .query({
          bookingId: "'; DROP TABLE payments; --",
        })
        .expect(400);

      expect(response.body.error.message).to.match(/Invalid request/);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent payment requests', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      };

      stripeStub.paymentIntents.create.resolves(mockPaymentIntent);

      // Create multiple bookings
      const bookingIds = await createMultipleBookings(5);

      // Make concurrent requests
      const promises = bookingIds.map(bookingId =>
        client
          .post('/api/payments/create-intent')
          .set('Authorization', 'Bearer test-token')
          .send({ bookingId })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('clientSecret');
      });
    });

    it('should cache frequently accessed data', async () => {
      // First request - cache miss
      const start1 = Date.now();
      await client
        .get('/api/invoices')
        .set('Authorization', 'Bearer test-token')
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request - cache hit
      const start2 = Date.now();
      await client
        .get('/api/invoices')
        .set('Authorization', 'Bearer test-token')
        .expect(200);
      const time2 = Date.now() - start2;

      // Cached request should be faster
      expect(time2).to.be.lessThan(time1 * 0.5);
    });
  });

  // Helper functions
  async function cleanupTestData() {
    // Clean up test data in reverse order of dependencies
    await testdb.execute('DELETE FROM payment_logs');
    await testdb.execute('DELETE FROM refunds');
    await testdb.execute('DELETE FROM invoices');
    await testdb.execute('DELETE FROM payments');
    await testdb.execute('DELETE FROM bookings');
    await testdb.execute('DELETE FROM users');
  }

  async function createTestData() {
    // Create test user
    await testdb.execute(`
      INSERT INTO users (id, email, name, role)
      VALUES ('test-user-id', 'test@example.com', 'Test User', 'customer')
    `);

    // Create test booking
    await testdb.execute(`
      INSERT INTO bookings (
        id, user_id, booking_reference, course_type,
        session_date, total_amount, status, number_of_attendees
      )
      VALUES (
        'test-booking-id', 'test-user-id', 'BK-TEST-001', 'EFAW',
        '2024-12-01', '75.00', 'pending', 1
      )
    `);
  }

  async function createPaidBooking() {
    await testdb.execute(`
      INSERT INTO bookings (
        id, user_id, booking_reference, course_type,
        session_date, total_amount, status, number_of_attendees
      )
      VALUES (
        'paid-booking-id', 'test-user-id', 'BK-TEST-002', 'EFAW',
        '2024-12-01', '75.00', 'confirmed', 1
      )
    `);

    await testdb.execute(`
      INSERT INTO payments (
        id, booking_id, stripe_payment_intent_id, amount,
        currency, status
      )
      VALUES (
        'test-payment-id', 'paid-booking-id', 'pi_paid_123',
        '75.00', 'GBP', 'succeeded'
      )
    `);
  }

  async function createRefundRequest(): Promise<string> {
    const result = await testdb.execute(`
      INSERT INTO refunds (
        id, booking_id, payment_id, amount, reason, status
      )
      VALUES (
        'test-refund-id', 'paid-booking-id', 'test-payment-id',
        '75.00', 'Unable to attend', 'pending'
      )
      RETURNING id
    `);
    return result.rows[0].id;
  }

  async function completePayment(bookingId: string) {
    await testdb.execute(`
      UPDATE bookings SET status = 'confirmed' WHERE id = $1
    `, [bookingId]);

    await testdb.execute(`
      INSERT INTO payments (
        id, booking_id, stripe_payment_intent_id, amount,
        currency, status
      )
      VALUES (
        'completed-payment-id', $1, 'pi_completed_123',
        '75.00', 'GBP', 'succeeded'
      )
    `, [bookingId]);
  }

  async function createInvoice(): Promise<string> {
    const result = await testdb.execute(`
      INSERT INTO invoices (
        id, invoice_number, booking_id, user_id, payment_id,
        subtotal, tax_amount, total_amount, status
      )
      VALUES (
        'test-invoice-id', 'INV-2024-00001', 'paid-booking-id',
        'test-user-id', 'test-payment-id', '75.00', '0.00',
        '75.00', 'paid'
      )
      RETURNING id
    `);
    return result.rows[0].id;
  }

  async function createMultipleBookings(count: number): Promise<string[]> {
    const bookingIds = [];
    for (let i = 0; i < count; i++) {
      const id = `booking-${i}`;
      await testdb.execute(`
        INSERT INTO bookings (
          id, user_id, booking_reference, course_type,
          session_date, total_amount, status, number_of_attendees
        )
        VALUES (
          $1, 'test-user-id', $2, 'EFAW',
          '2024-12-01', '75.00', 'pending', 1
        )
      `, [id, `BK-TEST-${i.toString().padStart(3, '0')}`]);
      bookingIds.push(id);
    }
    return bookingIds;
  }
});