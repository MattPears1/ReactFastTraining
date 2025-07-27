import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  AddressElement
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { cn } from '@utils/cn';

// Initialize Stripe
console.log('=== STRIPE INITIALIZATION ===');
console.log('Publishable Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Not Set');
console.log('Key starts with:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 7));
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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

const PaymentForm: React.FC<StripePaymentFormProps> = ({
  courseSchedule,
  bookingData,
  totalAmount,
  onSuccess,
  onError
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
  }, [courseSchedule, bookingData, totalAmount, stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('=== PAYMENT FORM SUBMIT ===');

    if (!stripe || !elements) {
      console.error('Stripe or Elements not loaded!');
      console.log('Stripe:', stripe);
      console.log('Elements:', elements);
      return;
    }

    console.log('Starting payment processing...');
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const confirmParams = {
        return_url: `${window.location.origin}/booking-confirmation`,
        receipt_email: bookingData.email,
        payment_method_data: {
          billing_details: {
            name: `${bookingData.firstName} ${bookingData.lastName}`,
            email: bookingData.email,
            phone: bookingData.phone,
          }
        }
      };
      
      console.log('Confirming payment with params:', confirmParams);
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams,
        redirect: 'if_required'
      });

      console.log('Payment confirmation response:');
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

      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Billing Address
        </h3>
        <div className="border border-gray-300 rounded-lg p-4">
          <AddressElement 
            options={{
              mode: 'billing',
              defaultValues: {
                name: `${bookingData.firstName} ${bookingData.lastName}`,
                organization: bookingData.companyName || undefined,
              }
            }}
          />
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Payment Details
        </h3>
        <div className="border border-gray-300 rounded-lg p-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  name: `${bookingData.firstName} ${bookingData.lastName}`,
                  email: bookingData.email,
                  phone: bookingData.phone,
                }
              }
            }}
          />
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
export const StripePaymentForm: React.FC<StripePaymentFormProps & { clientSecret: string }> = ({
  clientSecret,
  ...props
}) => {
  console.log('=== STRIPE PAYMENT FORM WRAPPER ===');
  console.log('Client Secret:', clientSecret ? 'Provided' : 'Missing');
  console.log('Client Secret length:', clientSecret?.length);
  console.log('Props:', props);
  
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
      <PaymentForm {...props} />
    </Elements>
  );
};