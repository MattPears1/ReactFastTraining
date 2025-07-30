import React, { useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  CreditCard,
} from "lucide-react";

export type PaymentStatusType =
  | "processing"
  | "succeeded"
  | "failed"
  | "requires_action"
  | "canceled";

interface PaymentStatusProps {
  status: PaymentStatusType;
  amount?: number;
  error?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  bookingReference?: string;
  receiptUrl?: string;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  amount,
  error,
  onRetry,
  onContactSupport,
  bookingReference,
  receiptUrl,
}) => {
  const statusConfig = {
    processing: {
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      title: "Processing Payment",
      message: "Please wait while we process your payment...",
      showSpinner: true,
    },
    succeeded: {
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
      title: "Payment Successful",
      message: amount
        ? `Your payment of £${amount} has been processed successfully.`
        : "Your payment has been processed successfully.",
      showSpinner: false,
    },
    failed: {
      icon: XCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-300",
      title: "Payment Failed",
      message:
        error || "Your payment could not be processed. Please try again.",
      showSpinner: false,
    },
    requires_action: {
      icon: AlertCircle,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-300",
      title: "Authentication Required",
      message:
        "Your bank requires additional authentication. Please complete the verification process.",
      showSpinner: true,
    },
    canceled: {
      icon: XCircle,
      iconColor: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-300",
      title: "Payment Canceled",
      message:
        "Your payment has been canceled. You can try again when you're ready.",
      showSpinner: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Auto-scroll to payment status when it changes
  useEffect(() => {
    const element = document.getElementById("payment-status");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [status]);

  return (
    <div
      id="payment-status"
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-6 transition-all duration-300`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {config.showSpinner ? (
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <Icon
                className={`absolute inset-0 m-auto w-6 h-6 ${config.iconColor}`}
              />
            </div>
          ) : (
            <Icon className={`w-12 h-12 ${config.iconColor}`} />
          )}
        </div>

        <div className="flex-1">
          <h3
            className={`font-semibold text-lg mb-1 ${config.iconColor.replace("text-", "text-")}`}
          >
            {config.title}
          </h3>
          <p className="text-gray-700">{config.message}</p>

          {/* Success Details */}
          {status === "succeeded" && bookingReference && (
            <div className="mt-4 p-4 bg-white bg-opacity-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Booking Reference:</strong> {bookingReference}
              </p>
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to your registered email
                address.
              </p>
              {receiptUrl && (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-primary-600 hover:text-primary-700"
                >
                  <CreditCard className="w-4 h-4" />
                  View Receipt
                </a>
              )}
            </div>
          )}

          {/* Error Details */}
          {status === "failed" && error && (
            <div className="mt-3 p-3 bg-white bg-opacity-50 rounded text-sm">
              <p className="font-medium text-red-800 mb-1">Error Details:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            {status === "failed" && onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                         transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}

            {status === "failed" && onContactSupport && (
              <button
                onClick={onContactSupport}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg 
                         hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </button>
            )}

            {status === "canceled" && onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                         transition-colors flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Make Payment
              </button>
            )}
          </div>

          {/* Additional Information */}
          {status === "processing" && (
            <div className="mt-4 text-sm text-gray-600">
              <p>• Do not refresh or close this page</p>
              <p>• This may take up to 30 seconds</p>
              <p>• You will receive a confirmation once complete</p>
            </div>
          )}

          {status === "requires_action" && (
            <div className="mt-4 text-sm text-gray-600">
              <p>• Check your mobile banking app or SMS for verification</p>
              <p>• Complete the authentication to confirm your payment</p>
              <p>• This is required by your bank for security</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
