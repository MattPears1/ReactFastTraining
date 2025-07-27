# Stripe Payment Integration

## Overview
Implement Stripe payment processing for course bookings with embedded or popup checkout, supporting single payments only (no payment plans).please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Stripe Setup

### 1. Account Configuration
- Create Stripe account at https://stripe.com
- Verify business details
- Set up bank account for payouts
- Configure webhook endpoints
- Enable payment methods (cards only initially)

### 2. Environment Variables
```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Development

STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE
```

## Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  status VARCHAR(50) NOT NULL,
  payment_method_type VARCHAR(50),
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
```

## Backend Implementation

### Stripe Service
```typescript
// backend-loopback4/src/services/stripe.service.ts
import Stripe from 'stripe';
import { db } from '../config/database.config';
import { payments, paymentLogs } from '../db/schema';

export class StripeService {
  private static stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  });

  static async createPaymentIntent(data: {
    amount: number; // in pounds
    bookingId: string;
    customerEmail: string;
    metadata?: Record<string, string>;
  }) {
    try {
      // Convert pounds to pence
      const amountInPence = Math.round(data.amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInPence,
        currency: 'gbp',
        metadata: {
          bookingId: data.bookingId,
          ...data.metadata,
        },
        receipt_email: data.customerEmail,
        description: 'First Aid Training Course Booking',
        statement_descriptor: 'REACT FAST TRAINING',
      });

      // Store payment record
      await db.insert(payments).values({
        bookingId: data.bookingId,
        stripePaymentIntentId: paymentIntent.id,
        amount: data.amount,
        currency: 'GBP',
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error('Payment processing failed');
    }
  }

  static async confirmPayment(paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update payment record
      await db
        .update(payments)
        .set({
          status: 'succeeded',
          stripeChargeId: paymentIntent.latest_charge as string,
          updatedAt: new Date(),
        })
        .where(eq(payments.stripePaymentIntentId, paymentIntentId));

      // Get booking and confirm it
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, paymentIntentId));

      if (payment) {
        await BookingService.confirmBooking(payment.bookingId, paymentIntentId);
      }

      return { success: true, payment };
    }

    return { success: false, status: paymentIntent.status };
  }

  static async handleWebhook(signature: string, payload: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new Error('Invalid webhook signature');
    }

    // Log the event
    await this.logPaymentEvent(event);

    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await this.handleDispute(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    await this.confirmPayment(paymentIntent.id);
  }

  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    await db
      .update(payments)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    // Notify user of failure
    const [payment] = await db
      .select({ booking: bookings })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    if (payment) {
      await EmailService.sendPaymentFailedEmail(payment.booking);
    }
  }

  private static async logPaymentEvent(event: Stripe.Event) {
    const paymentIntentId = (event.data.object as any).id;
    
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntentId));

    if (payment) {
      await db.insert(paymentLogs).values({
        paymentId: payment.id,
        eventType: event.type,
        eventData: event.data.object as any,
      });
    }
  }
}
```

### Payment Controller
```typescript
// backend-loopback4/src/controllers/payment.controller.ts
export class PaymentController {
  @post('/api/payments/create-intent')
  @authenticate
  async createPaymentIntent(
    @requestBody() data: CreatePaymentIntentRequest
  ) {
    // Verify booking belongs to user
    const booking = await BookingService.getBooking(data.bookingId);
    if (booking.userId !== request.user.id) {
      throw new HttpErrors.Forbidden();
    }

    const paymentIntent = await StripeService.createPaymentIntent({
      amount: booking.totalAmount,
      bookingId: booking.id,
      customerEmail: request.user.email,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: booking.totalAmount,
    };
  }

  @post('/api/payments/confirm')
  async confirmPayment(
    @requestBody() data: { paymentIntentId: string }
  ) {
    const result = await StripeService.confirmPayment(data.paymentIntentId);
    return result;
  }

  @post('/api/webhooks/stripe', {
    responses: {
      '200': {
        description: 'Webhook processed successfully',
      },
    },
  })
  async handleStripeWebhook(
    @requestBody() body: Buffer,
    @inject(RestBindings.Http.REQUEST) request: Request
  ) {
    const signature = request.headers['stripe-signature'] as string;
    
    try {
      await StripeService.handleWebhook(signature, body.toString());
      return { received: true };
    } catch (error) {
      throw new HttpErrors.BadRequest('Webhook processing failed');
    }
  }
}
```

## Frontend Implementation

### Stripe Setup Hook
```typescript
// src/hooks/useStripe.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

let stripePromise: Promise<Stripe | null>;

export const useStripe = () => {
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    if (!stripePromise) {
      stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    }

    stripePromise.then(setStripe);
  }, []);

  return stripe;
};
```

### Payment Step Component
```typescript
// src/components/booking/steps/PaymentStep.tsx
import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const PaymentStep: React.FC<{
  bookingData: BookingData;
  onComplete: (bookingReference: string) => void;
  onBack: () => void;
}> = ({ bookingData, onComplete, onBack }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        bookingData={bookingData}
        onComplete={onComplete}
        onBack={onBack}
      />
    </Elements>
  );
};

const PaymentForm: React.FC<{
  bookingData: BookingData;
  onComplete: (bookingReference: string) => void;
  onBack: () => void;
}> = ({ bookingData, onComplete, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    createBookingAndPaymentIntent();
  }, []);

  const createBookingAndPaymentIntent = async () => {
    try {
      // Create booking first
      const bookingResponse = await bookingApi.create({
        sessionId: bookingData.sessionId,
        attendees: bookingData.attendees,
        specialRequirements: bookingData.specialRequirements,
        termsAccepted: true,
      });

      setClientSecret(bookingResponse.clientSecret);
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) return;

    // Confirm the payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: {
          name: bookingData.attendees[0].name,
          email: bookingData.attendees[0].email,
        },
      },
    });

    if (result.error) {
      setError(result.error.message || 'Payment failed');
      setProcessing(false);
    } else if (result.paymentIntent?.status === 'succeeded') {
      // Payment successful, confirm with backend
      const confirmation = await bookingApi.confirmPayment({
        paymentIntentId: result.paymentIntent.id,
      });

      onComplete(confirmation.bookingReference);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  const totalAmount = bookingData.courseDetails.price * bookingData.attendees.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Payment Details</h2>
        <p className="text-gray-600">
          Complete your booking by entering your payment information
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{bookingData.courseDetails.courseType}</span>
            <span>£{bookingData.courseDetails.price}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>× {bookingData.attendees.length} attendees</span>
            <span>£{totalAmount - bookingData.courseDetails.price}</span>
          </div>
          <div className="pt-2 mt-2 border-t">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>£{totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Security Badge */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>Pay £{totalAmount}</>
          )}
        </button>
      </div>
    </form>
  );
};
```

### Alternative: Stripe Checkout (Redirect)
```typescript
// src/components/booking/StripeCheckout.tsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

export const StripeCheckout: React.FC<{
  bookingData: BookingData;
}> = ({ bookingData }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      
      // Create checkout session
      const response = await bookingApi.createCheckoutSession({
        bookingId: bookingData.bookingId,
        successUrl: `${window.location.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/booking-cancelled`,
      });

      // Redirect to Stripe Checkout
      const result = await stripe!.redirectToCheckout({
        sessionId: response.sessionId,
      });

      if (result.error) {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Redirecting to payment...
        </>
      ) : (
        <>
          Proceed to Secure Payment
        </>
      )}
    </button>
  );
};
```

### Payment Status Component
```typescript
// src/components/booking/PaymentStatus.tsx
import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface PaymentStatusProps {
  status: 'processing' | 'succeeded' | 'failed';
  amount?: number;
  error?: string;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ 
  status, 
  amount, 
  error 
}) => {
  const statusConfig = {
    processing: {
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      title: 'Processing Payment',
      message: 'Please wait while we process your payment...',
    },
    succeeded: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      title: 'Payment Successful',
      message: `Your payment of £${amount} has been processed successfully.`,
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      title: 'Payment Failed',
      message: error || 'Your payment could not be processed. Please try again.',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-6`}>
      <div className="flex items-start gap-4">
        <Icon className={`w-8 h-8 ${config.color} flex-shrink-0`} />
        <div>
          <h3 className={`font-semibold text-lg ${config.color}`}>
            {config.title}
          </h3>
          <p className="mt-1 text-gray-700">{config.message}</p>
        </div>
      </div>
    </div>
  );
};
```

## Security Considerations

1. **PCI Compliance**
   - Never store card details
   - Use Stripe Elements or Checkout
   - Implement HTTPS everywhere
   - Regular security audits

2. **Webhook Security**
   - Verify webhook signatures
   - Use webhook endpoints whitelist
   - Implement idempotency
   - Log all events

3. **Payment Security**
   - Implement 3D Secure when required
   - Monitor for fraudulent patterns
   - Set up Stripe Radar rules
   - Regular reconciliation

## Testing

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Test Scenarios
1. Successful payment flow
2. Failed payment handling
3. 3D Secure authentication
4. Webhook processing
5. Network interruption recovery
6. Concurrent booking attempts
7. Payment reconciliation