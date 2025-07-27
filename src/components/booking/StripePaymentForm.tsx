import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { cn } from '@utils/cn';

// Initialize Stripe
console.log('=== STRIPE INITIALIZATION ===');
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Qw5QyQSHAAMHn4tPbe31bwAtRb7qEAGms4h3kr8h8mu1nfyzzM1u9GHdnbtGtiuzJWH9NSqFoER4Wmhw3k91cKN00PQVbUU7I';
console.log('Publishable Key:', stripePublishableKey ? 'Set' : 'Not Set');
console.log('Key starts with:', stripePublishableKey?.substring(0, 7));
console.log('Full key length:', stripePublishableKey?.length);

if (!stripePublishableKey) {
  console.error('❌ Stripe publishable key is missing!');
  throw new Error('Stripe publishable key is required');
}

const stripePromise = loadStripe(stripePublishableKey);

interface StripePaymentFormProps {
  courseSchedule: {
    id: number;
    courseName: string;
    startDate: string;
    venueName: string;
    pricePerPerson: number;
  };
  bookingData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
    numberOfParticipants: number;
    specialRequirements?: string;
  };
  totalAmount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

interface PaymentFormInternalProps extends StripePaymentFormProps {
  clientSecret: string;
}

const PaymentForm: React.FC<PaymentFormInternalProps> = ({
  courseSchedule,
  bookingData,
  totalAmount,
  onSuccess,
  onError,
  clientSecret
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== PAYMENT FORM MOUNTED ===');
    console.log('Course Schedule:', courseSchedule);
    console.log('Booking Data:', bookingData);
    console.log('Total Amount (pence):', totalAmount);
    console.log('Total Amount (pounds):', totalAmount / 100);
    console.log('Stripe loaded:', !!stripe);
    console.log('Elements loaded:', !!elements);
    console.log('Client Secret provided:', !!clientSecret);
  }, [courseSchedule, bookingData, totalAmount, stripe, elements, clientSecret]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('=== REAL STRIPE PAYMENT SUBMISSION ===');

    if (!stripe || !elements || !clientSecret) {
      console.error('Stripe, Elements, or Client Secret not loaded!');
      console.log('Stripe:', !!stripe);
      console.log('Elements:', !!elements);
      console.log('Client Secret:', !!clientSecret);
      return;
    }

    console.log('Processing real Stripe payment...');
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Use Stripe's real confirmPayment method
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success`,
          payment_method_data: {
            billing_details: {
              name: `${bookingData.firstName} ${bookingData.lastName}`,
              email: bookingData.email,
              phone: bookingData.phone,
            },
          },
        },
        redirect: 'if_required',
      });

      console.log('=== REAL STRIPE PAYMENT RESPONSE ===');
      console.log('Error:', error);
      console.log('Payment Intent:', paymentIntent);

      if (error) {
        console.error('=== PAYMENT ERROR ===');
        console.error('Error Type:', error.type);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
        showToast('error', error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('=== PAYMENT SUCCESS ===');
        console.log('Payment Intent ID:', paymentIntent.id);
        console.log('Payment Intent Status:', paymentIntent.status);
        showToast('success', 'Payment successful! Completing your booking...');
        onSuccess(paymentIntent.id);
      } else {
        console.log('=== PAYMENT UNEXPECTED STATE ===');
        console.log('Payment Intent:', paymentIntent);
      }
    } catch (err) {
      console.error('=== PAYMENT EXCEPTION ===');
      console.error('Exception:', err);
      const message = 'An unexpected error occurred. Please try again.';
      setErrorMessage(message);
      onError(message);
      showToast('error', message);
    } finally {
      console.log('Payment processing complete, resetting state');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Summary */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
        <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
          Payment Summary
        </h3>
        <div className="text-sm text-primary-700 dark:text-primary-300 space-y-1">
          <p><span className="font-medium">Course:</span> {courseSchedule.courseName}</p>
          <p><span className="font-medium">Date:</span> {new Date(courseSchedule.startDate).toLocaleDateString('en-GB', { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
          })}</p>
          <p><span className="font-medium">Venue:</span> {courseSchedule.venueName}</p>
          <p><span className="font-medium">Participants:</span> {bookingData.numberOfParticipants}</p>
          <div className="border-t pt-2 mt-2">
            <p className="font-semibold text-lg">Total: £{(totalAmount / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Card Details
        </h3>
        <div className="border border-gray-300 rounded-lg p-4">
          {clientSecret ? (
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card'],
                fields: {
                  billingDetails: 'never',
                },
                terms: {
                  card: 'never',
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-gray-600">Initializing payment...</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="text-sm text-green-800 dark:text-green-200">
            <p className="font-medium mb-1">Secure Payment</p>
            <p>Your payment information is encrypted and processed securely by Stripe. We never store your card details.</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium mb-1">Payment Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={cn(
          "w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
          isProcessing || !stripe
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-primary-600 text-white hover:bg-primary-700"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay £{(totalAmount / 100).toFixed(2)}
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        By completing this payment, you agree to our terms and conditions.
      </p>
    </form>
  );
};

// Wrapper component with Stripe Elements
export const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [hasCreatedIntent, setHasCreatedIntent] = useState(false);
  
  console.log('=== STRIPE PAYMENT FORM WRAPPER ===');
  console.log('Client Secret:', clientSecret ? 'Provided' : 'Missing');
  console.log('Props:', props);

  // Create payment intent when wrapper mounts - only once
  useEffect(() => {
    if (hasCreatedIntent) return; // Prevent multiple calls
    
    const createPaymentIntent = async () => {
      try {
        console.log('=== CREATING REAL STRIPE PAYMENT INTENT ===');
        setHasCreatedIntent(true);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/bookings/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseSessionId: props.courseSchedule.id,
            amount: props.totalAmount,
            bookingData: {
              firstName: props.bookingData.firstName,
              lastName: props.bookingData.lastName,
              email: props.bookingData.email,
              phone: props.bookingData.phone,
              companyName: props.bookingData.companyName,
              specialRequirements: props.bookingData.specialRequirements,
              numberOfParticipants: props.bookingData.numberOfParticipants,
            },
          }),
        });

        const data = await response.json();
        console.log('Payment intent response:', data);

        if (data.success && data.paymentIntent?.client_secret) {
          setClientSecret(data.paymentIntent.client_secret);
          console.log('✅ Real Stripe payment intent created:', data.paymentIntent.id);
        } else {
          throw new Error(data.error || 'Failed to create payment intent');
        }
      } catch (error) {
        console.error('❌ Payment intent creation failed:', error);
        props.onError('Failed to initialize payment. Please try again.');
        setHasCreatedIntent(false); // Allow retry on error
      }
    };

    createPaymentIntent();
  }, [hasCreatedIntent]); // Only depend on hasCreatedIntent flag
  
  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-3 text-gray-600">Initializing secure payment...</span>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0EA5E9',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
    loader: 'auto' as const,
  };

  console.log('Stripe Elements options:', options);

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} clientSecret={clientSecret} />
    </Elements>
  );
};