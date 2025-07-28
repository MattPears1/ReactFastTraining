import React, { useState } from "react";
import { X, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { refundApi } from "@/services/api/refunds";

interface RefundRequestModalProps {
  booking: {
    id: string;
    bookingReference: string;
    courseDetails: {
      courseType: string;
      sessionDate: string;
      startTime: string;
      location: string;
    };
    totalAmount: string;
    numberOfAttendees: number;
    status: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalReason = reason === "Other" ? customReason : reason;

    if (!finalReason.trim()) {
      setError("Please provide a reason for the refund");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await refundApi.requestRefund({
        bookingId: booking.id,
        reason: finalReason,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to submit refund request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason("");
      setCustomReason("");
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Request Refund</h2>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Booking Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Booking Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium">{booking.bookingReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Course:</span>
                <span className="font-medium">
                  {booking.courseDetails.courseType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {format(
                    new Date(booking.courseDetails.sessionDate),
                    "dd/MM/yyyy",
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {booking.courseDetails.startTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">
                  {booking.courseDetails.location}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Attendees:</span>
                <span className="font-medium">{booking.numberOfAttendees}</span>
              </div>
              <div className="pt-2 mt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">
                    Amount Paid:
                  </span>
                  <span className="font-semibold text-lg">
                    £{booking.totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Refund
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                disabled={submitting}
              >
                <option value="">Select a reason</option>
                <option value="Unable to attend">Unable to attend</option>
                <option value="Course cancelled">Course cancelled</option>
                <option value="Medical reasons">Medical reasons</option>
                <option value="Work commitment">Work commitment</option>
                <option value="Found alternative course">
                  Found alternative course
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Custom Reason */}
            {reason === "Other" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Please provide more details..."
                  required
                  disabled={submitting}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Refund Policy */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Refund Policy</p>
                  <ul className="space-y-1">
                    <li>
                      • Full refunds are currently available for all
                      cancellations
                    </li>
                    <li>
                      • Refunds typically process within 5-10 business days
                    </li>
                    <li>• You will receive email confirmation once approved</li>
                    <li>
                      • Refunds will be credited to your original payment method
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Important:</p>
                  <p>
                    Requesting a refund will cancel your booking and release
                    your course spot to other participants.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Submitting...
                  </span>
                ) : (
                  "Request Refund"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
