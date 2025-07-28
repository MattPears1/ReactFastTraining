import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  Info,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { format, differenceInDays, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { refundApi } from "@/services/api/refunds";

interface RefundRequestModalProps {
  booking: {
    id: string;
    bookingReference: string;
    courseDetails: {
      courseType: string;
      sessionDate: string;
      startTime: string;
      endTime?: string;
      location: string;
    };
    totalAmount: string;
    numberOfAttendees: number;
    status: string;
    createdAt?: string;
  };
  payment?: {
    id: string;
    amount: string;
    createdAt: string;
    refundedAmount?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RefundEstimate {
  eligibility: "full" | "partial" | "none";
  amount: number;
  percentage: number;
  reason: string;
  policyDetails: string[];
}

const REFUND_REASONS = [
  {
    value: "unable_to_attend",
    label: "Unable to attend",
    requiresDetails: false,
  },
  {
    value: "medical_emergency",
    label: "Medical emergency",
    requiresDetails: true,
  },
  {
    value: "work_commitment",
    label: "Work commitment",
    requiresDetails: false,
  },
  {
    value: "course_not_suitable",
    label: "Course not suitable",
    requiresDetails: true,
  },
  {
    value: "duplicate_booking",
    label: "Duplicate booking",
    requiresDetails: false,
  },
  {
    value: "personal_circumstances",
    label: "Personal circumstances",
    requiresDetails: true,
  },
  { value: "covid_related", label: "COVID-19 related", requiresDetails: true },
  { value: "other", label: "Other reason", requiresDetails: true },
];

export const RefundRequestModalEnhanced: React.FC<RefundRequestModalProps> = ({
  booking,
  payment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<
    "reason" | "review" | "submitting" | "success"
  >("reason");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [refundEstimate, setRefundEstimate] = useState<RefundEstimate | null>(
    null,
  );
  const [processingTime, setProcessingTime] = useState(0);

  useEffect(() => {
    if (isOpen) {
      calculateRefundEstimate();
    }
  }, [isOpen, booking]);

  const calculateRefundEstimate = () => {
    const sessionDate = new Date(booking.courseDetails.sessionDate);
    const today = new Date();
    const daysUntilSession = differenceInDays(sessionDate, today);
    const totalAmount = parseFloat(booking.totalAmount);

    let estimate: RefundEstimate;

    if (daysUntilSession > 7) {
      estimate = {
        eligibility: "full",
        amount: totalAmount,
        percentage: 100,
        reason: "More than 7 days before course",
        policyDetails: [
          "Full refund available",
          "No cancellation fee",
          "Immediate processing",
        ],
      };
    } else if (daysUntilSession >= 3) {
      estimate = {
        eligibility: "partial",
        amount: totalAmount * 0.5,
        percentage: 50,
        reason: "3-7 days before course",
        policyDetails: [
          "50% refund available",
          "50% cancellation fee applies",
          "Processing within 24-48 hours",
        ],
      };
    } else if (daysUntilSession >= 0) {
      estimate = {
        eligibility: "none",
        amount: 0,
        percentage: 0,
        reason: "Less than 3 days before course",
        policyDetails: [
          "No refund available",
          "Consider rescheduling instead",
          "Contact support for exceptional circumstances",
        ],
      };
    } else {
      estimate = {
        eligibility: "none",
        amount: 0,
        percentage: 0,
        reason: "Course has already taken place",
        policyDetails: [
          "Refunds not available for past courses",
          "Contact support for special circumstances",
        ],
      };
    }

    setRefundEstimate(estimate);
  };

  const handleSubmit = async () => {
    const selectedReason = REFUND_REASONS.find((r) => r.value === reason);
    const finalReason =
      selectedReason?.requiresDetails || reason === "other"
        ? customReason
        : selectedReason?.label || reason;

    if (!finalReason.trim()) {
      setError("Please provide a reason for the refund");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the terms to proceed");
      return;
    }

    setStep("submitting");
    setError("");
    const startTime = Date.now();

    try {
      // Simulate processing time for better UX
      const minProcessingTime = 2000;

      const [response] = await Promise.all([
        refundApi.requestRefund({
          bookingId: booking.id,
          reason: finalReason,
          metadata: {
            originalAmount: booking.totalAmount,
            refundEstimate: refundEstimate?.amount,
            daysBeforeCourse: differenceInDays(
              new Date(booking.courseDetails.sessionDate),
              new Date(),
            ),
          },
        }),
        new Promise((resolve) => setTimeout(resolve, minProcessingTime)),
      ]);

      setProcessingTime(Date.now() - startTime);
      setStep("success");

      // Auto close after showing success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to submit refund request",
      );
      setStep("review");
    }
  };

  const handleClose = () => {
    if (step !== "submitting") {
      setStep("reason");
      setReason("");
      setCustomReason("");
      setAcceptTerms(false);
      setError("");
      setRefundEstimate(null);
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const renderReasonStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Reason Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Why are you requesting a refund?
        </label>
        <div className="space-y-2">
          {REFUND_REASONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                reason === option.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                value={option.value}
                checked={reason === option.value}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <span className="font-medium">{option.label}</span>
                {option.requiresDetails && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Details required)
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Reason */}
      {REFUND_REASONS.find((r) => r.value === reason)?.requiresDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please provide more details
          </label>
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Help us understand your situation..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 20 characters required
          </p>
        </motion.div>
      )}

      {/* Refund Estimate */}
      {refundEstimate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            refundEstimate.eligibility === "full"
              ? "bg-green-50 border-green-200"
              : refundEstimate.eligibility === "partial"
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {refundEstimate.eligibility === "full" ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : refundEstimate.eligibility === "partial" ? (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-medium">
                {refundEstimate.eligibility === "full" &&
                  "Full refund available"}
                {refundEstimate.eligibility === "partial" &&
                  "Partial refund available"}
                {refundEstimate.eligibility === "none" &&
                  "Refund not available"}
              </h4>
              <p className="text-sm mt-1">{refundEstimate.reason}</p>
              {refundEstimate.amount > 0 && (
                <p className="text-lg font-semibold mt-2">
                  Refund amount: {formatCurrency(refundEstimate.amount)}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({refundEstimate.percentage}% of{" "}
                    {formatCurrency(parseFloat(booking.totalAmount))})
                  </span>
                </p>
              )}
              <ul className="text-sm mt-3 space-y-1">
                {refundEstimate.policyDetails.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setStep("review")}
          disabled={
            !reason ||
            (REFUND_REASONS.find((r) => r.value === reason)?.requiresDetails &&
              customReason.length < 20)
          }
          className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );

  const renderReviewStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Summary */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Review Your Refund Request</h3>

        {/* Booking Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {format(
                new Date(booking.courseDetails.sessionDate),
                "EEEE, dd MMMM yyyy",
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {booking.courseDetails.startTime} -{" "}
              {booking.courseDetails.endTime || "TBD"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{booking.courseDetails.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {booking.numberOfAttendees} attendee
              {booking.numberOfAttendees > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {formatCurrency(parseFloat(booking.totalAmount))}
            </span>
          </div>
        </div>

        {/* Reason Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Refund Reason</h4>
          <p className="text-sm text-gray-700">
            {REFUND_REASONS.find((r) => r.value === reason)?.label || reason}
          </p>
          {customReason && (
            <p className="text-sm text-gray-600 mt-2 italic">
              "{customReason}"
            </p>
          )}
        </div>

        {/* Refund Amount */}
        {refundEstimate && refundEstimate.amount > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h4 className="font-medium text-primary-900 mb-1">
              Expected Refund
            </h4>
            <p className="text-2xl font-bold text-primary-700">
              {formatCurrency(refundEstimate.amount)}
            </p>
            <p className="text-sm text-primary-700 mt-1">
              Processing time: 5-10 business days
            </p>
          </div>
        )}

        {/* Terms Acceptance */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1"
            />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">I understand that:</p>
              <ul className="space-y-1">
                <li>• My booking will be cancelled immediately</li>
                <li>• My course spot will be released to other participants</li>
                <li>• Refunds are processed according to the refund policy</li>
                <li>• Processing may take 5-10 business days</li>
              </ul>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => setStep("reason")}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!acceptTerms}
          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Confirm Refund Request
        </button>
      </div>
    </motion.div>
  );

  const renderSubmittingStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-primary-600" />
        </div>
      </div>
      <p className="mt-4 text-lg font-medium">
        Processing your refund request...
      </p>
      <p className="text-sm text-gray-600 mt-2">
        Please don't close this window
      </p>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
      >
        <CheckCircle className="w-10 h-10 text-green-600" />
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">Refund Request Submitted!</h3>
      <p className="text-gray-600 mb-4">
        Your request has been received and is being reviewed
      </p>
      <div className="bg-gray-50 rounded-lg p-4 text-left w-full max-w-sm">
        <h4 className="font-medium mb-2">What happens next?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• You'll receive a confirmation email shortly</li>
          <li>• Our team will review your request within 24 hours</li>
          <li>• You'll be notified once the refund is approved</li>
          <li>• Funds will be returned to your original payment method</li>
        </ul>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Request processed in {(processingTime / 1000).toFixed(1)} seconds
      </p>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <CreditCard className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Request Refund</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={step === "submitting"}
                className="p-1 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {step !== "submitting" && step !== "success" && (
            <div className="px-6 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 ${step === "reason" ? "text-primary-600" : "text-gray-400"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step === "reason"
                        ? "bg-primary-600 text-white"
                        : "bg-gray-300 text-white"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-sm font-medium">Reason</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
                <div
                  className={`flex items-center gap-2 ${step === "review" ? "text-primary-600" : "text-gray-400"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step === "review"
                        ? "bg-primary-600 text-white"
                        : "bg-gray-300 text-white"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-sm font-medium">Review</span>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* Help Button */}
            {step !== "submitting" && step !== "success" && (
              <div className="flex justify-end mb-4">
                <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  Need help?
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === "reason" && renderReasonStep()}
              {step === "review" && renderReviewStep()}
              {step === "submitting" && renderSubmittingStep()}
              {step === "success" && renderSuccessStep()}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
