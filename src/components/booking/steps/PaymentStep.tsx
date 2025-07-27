import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, CreditCard, AlertCircle } from 'lucide-react';
import { BookingData } from '../BookingWizard';
import { bookingApi } from '@/services/api/bookings';

// Initialize Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Qw5QyQSHAAMHn4tPbe31bwAtRb7qEAGms4h3kr8h8mu1nfyzzM1u9GHdnbtGtiuzJWH9NSqFoER4Wmhw3k91cKN00PQVbUU7I';
const stripePromise = loadStripe(stripePublishableKey);

interface PaymentStepProps {
  bookingData: BookingData;
  onComplete: (bookingReference: string) => void;
  onBack: () => void;
}

const PaymentForm: React.FC<PaymentStepProps> = ({ bookingData, onComplete, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');

  const totalAmount = bookingData.courseDetails.price * bookingData.attendees.length;

  useEffect(() => {
    // Create booking and payment intent
    createBooking();
  }, []);

  const createBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.createBooking({
        sessionId: bookingData.sessionId,
        attendees: bookingData.attendees,
        specialRequirements: bookingData.specialRequirements,
        termsAccepted: bookingData.termsAccepted,
      });

      setClientSecret(response.clientSecret);
      setBookingId(response.bookingId);
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
      console.error('Booking creation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card details not found');
      setLoading(false);
      return;
    }

    // Confirm the payment
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: bookingData.attendees[0].name,
          email: bookingData.attendees[0].email,
        },
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Confirm booking on backend
      try {
        const confirmResponse = await bookingApi.confirmBooking({
          bookingId,
          paymentIntentId: paymentIntent.id,
        });

        // Get booking reference
        const bookingDetails = await bookingApi.getBooking(bookingId);
        onComplete(bookingDetails.bookingReference);
      } catch (err) {
        setError('Payment succeeded but booking confirmation failed. Please contact support.');
        console.error('Booking confirmation failed:', err);
      }
    }

    setLoading(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Payment Details</h2>
        <p className="text-gray-600">Complete your booking with secure payment</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {bookingData.courseDetails.courseType}
            </span>
            <span>£{bookingData.courseDetails.price} × {bookingData.attendees.length}</span>
          </div>
          <div className="pt-2 border-t flex justify-between items-center">
            <span className="font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary-600">£{totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </div>

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="w-5 h-5" />
          <span>Secure payment</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="w-5 h-5" />
          <span>SSL encrypted</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Payment Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg 
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || loading || !clientSecret}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Pay £{totalAmount}
            </>
          )}
        </button>
      </div>

      {/* Terms Notice */}
      <p className="text-xs text-gray-500 text-center">
        By completing this payment, you agree to our terms and conditions. 
        Your booking will be confirmed via email once payment is processed.
      </p>
    </form>
  );
};

export const PaymentStep: React.FC<PaymentStepProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};