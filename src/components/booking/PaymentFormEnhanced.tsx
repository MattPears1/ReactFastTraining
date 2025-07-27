import React, { useState, useEffect, useCallback } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { 
  CreditCard, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Loader2,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string;
  bookingReference: string;
  onSuccess: (paymentIntentId: string, receiptUrl?: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  customerEmail?: string;
  savePaymentMethod?: boolean;
}

interface PaymentStatus {
  type: 'idle' | 'processing' | 'success' | 'error' | 'requires_action';
  message?: string;
}

// Payment form component
function PaymentFormContent({
  bookingId,
  amount,
  currency = 'GBP',
  bookingReference,
  onSuccess,
  onError,
  onCancel,
  customerEmail,
  savePaymentMethod = false,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<PaymentStatus>({ type: 'idle' });
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Create payment intent
  useEffect(() => {
    createPaymentIntent();
  }, [bookingId]);

  const createPaymentIntent = async () => {
    try {
      setStatus({ type: 'processing', message: 'Initializing payment...' });
      
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          bookingId,
          savePaymentMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Payment initialization failed');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStatus({ type: 'idle' });
    } catch (error) {
      console.error('Payment intent creation error:', error);
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to initialize payment' 
      });
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Handle payment submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setStatus({ type: 'processing', message: 'Processing payment...' });
    setErrorDetails('');

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/payment-complete`,
          receipt_email: customerEmail,
        },
        redirect: 'if_required',
      });

      if (error) {
        handlePaymentError(error);
      } else if (paymentIntent) {
        handlePaymentSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      handlePaymentError({
        type: 'card_error',
        message: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    
    // Map Stripe error codes to user-friendly messages
    const errorMessages: { [key: string]: string } = {
      'card_declined': 'Your card was declined. Please try a different card.',
      'insufficient_funds': 'Your card has insufficient funds.',
      'incorrect_cvc': 'The CVC number is incorrect.',
      'expired_card': 'Your card has expired.',
      'processing_error': 'An error occurred while processing your card. Please try again.',
      'incorrect_number': 'The card number is incorrect.',
      'invalid_expiry_month': 'The expiration month is invalid.',
      'invalid_expiry_year': 'The expiration year is invalid.',
    };

    const message = error.code ? errorMessages[error.code] || error.message : error.message;
    
    setStatus({ type: 'error', message });
    setErrorDetails(error.message);
    onError(message);

    // Auto-retry for certain errors
    if (retryCount < maxRetries && ['processing_error', 'network_error'].includes(error.code)) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        setStatus({ 
          type: 'processing', 
          message: `Retrying... (Attempt ${retryCount + 2}/${maxRetries + 1})` 
        });
        handleSubmit(new Event('submit') as any);
      }, 2000);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    if (paymentIntent.status === 'succeeded') {
      setStatus({ type: 'success', message: 'Payment successful!' });
      
      // Confirm payment on backend
      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
          }),
        });

        const data = await response.json();
        if (data.success) {
          onSuccess(paymentIntent.id, data.receiptUrl);
        } else {
          throw new Error(data.error || 'Payment confirmation failed');
        }
      } catch (error) {
        console.error('Payment confirmation error:', error);
        setStatus({ 
          type: 'error', 
          message: 'Payment processed but confirmation failed. Please contact support.' 
        });
      }
    } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
      setStatus({ 
        type: 'requires_action', 
        message: 'Additional authentication required. Please complete the verification.' 
      });
    } else {
      setStatus({ 
        type: 'error', 
        message: `Payment status: ${paymentIntent.status}. Please try again.` 
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Secure Payment</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4" />
              <span>SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Booking Reference</p>
              <p className="font-semibold">{bookingReference}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatAmount(amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {clientSecret && (
            <div className="space-y-4">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  defaultValues: {
                    billingDetails: {
                      email: customerEmail,
                    },
                  },
                }}
                onChange={(event) => {
                  setIsFormComplete(event.complete);
                  if (event.error) {
                    setErrorDetails(event.error.message || '');
                  } else {
                    setErrorDetails('');
                  }
                }}
              />

              {/* Save payment method checkbox */}
              {savePaymentMethod && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="save-payment"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    defaultChecked
                  />
                  <label htmlFor="save-payment" className="text-sm text-gray-700">
                    Save payment method for future bookings
                  </label>
                </div>
              )}

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 py-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>PCI DSS Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span>Secure Processing</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {status.type !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                  status.type === 'error' ? 'bg-red-50 text-red-800' :
                  status.type === 'success' ? 'bg-green-50 text-green-800' :
                  status.type === 'requires_action' ? 'bg-amber-50 text-amber-800' :
                  'bg-blue-50 text-blue-800'
                }`}
              >
                {status.type === 'processing' && <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 mt-0.5" />}
                {status.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                {status.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                {status.type === 'requires_action' && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="font-medium">{status.message}</p>
                  {errorDetails && status.type === 'error' && (
                    <p className="text-sm mt-1 opacity-75">{errorDetails}</p>
                  )}
                  {retryCount > 0 && status.type === 'error' && (
                    <p className="text-sm mt-1">
                      Retry attempt {retryCount} of {maxRetries}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={status.type === 'processing'}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg 
                       hover:bg-gray-50 transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !stripe || 
                !elements || 
                !clientSecret || 
                !isFormComplete ||
                status.type === 'processing' ||
                status.type === 'success'
              }
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg 
                       hover:bg-primary-700 transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2
                       font-semibold shadow-md"
            >
              {status.type === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay {formatAmount(amount)}
                </>
              )}
            </button>
          </div>

          {/* Additional Information */}
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              By completing this payment, you agree to our{' '}
              <a href="/terms" className="text-primary-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </form>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center"
      >
        <p className="text-sm text-gray-600">
          Need help? Contact us at{' '}
          <a href="tel:07447485644" className="text-primary-600 hover:underline">
            07447 485644
          </a>{' '}
          or{' '}
          <a href="mailto:info@reactfasttraining.co.uk" className="text-primary-600 hover:underline">
            info@reactfasttraining.co.uk
          </a>
        </p>
      </motion.div>
    </div>
  );
}

// Main component with Stripe Elements provider
export function PaymentFormEnhanced(props: PaymentFormProps) {
  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(props.amount * 100), // Convert to pence
    currency: props.currency?.toLowerCase() || 'gbp',
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0EA5E9',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
      rules: {
        '.Tab': {
          border: '1px solid #e5e7eb',
          boxShadow: 'none',
        },
        '.Tab:hover': {
          border: '1px solid #d1d5db',
        },
        '.Tab--selected': {
          border: '1px solid #0EA5E9',
          boxShadow: '0 0 0 1px #0EA5E9',
        },
        '.Input': {
          border: '1px solid #e5e7eb',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '1px solid #0EA5E9',
          boxShadow: '0 0 0 1px #0EA5E9',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}