import React, { useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { AdminCard } from "../../../components/ui/AdminCard";
import { SessionDetails, SessionSummary } from "../../../types/schedule.types";

interface FinancialSummaryProps {
  session: SessionDetails;
  summary: SessionSummary;
  onProcessRefunds?: () => void;
  onViewPaymentDetails?: () => void;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  session,
  summary,
  onProcessRefunds,
  onViewPaymentDetails,
}) => {
  const financialMetrics = useMemo(() => {
    const bookings = session.bookings || [];

    // Calculate detailed financial metrics
    const paidBookings = bookings.filter((b) => b.paymentStatus === "paid");
    const pendingPayments = bookings.filter(
      (b) => b.paymentStatus === "pending",
    );
    const failedPayments = bookings.filter((b) => b.paymentStatus === "failed");
    const refundedBookings = bookings.filter(
      (b) => b.paymentStatus === "refunded",
    );

    const totalPotentialRevenue =
      session.maxParticipants * session.pricePerPerson;
    const currentRevenue = paidBookings.reduce(
      (sum, b) => sum + b.paymentAmount,
      0,
    );
    const pendingRevenue = pendingPayments.reduce(
      (sum, b) => sum + b.paymentAmount,
      0,
    );
    const refundedAmount = refundedBookings.reduce(
      (sum, b) => sum + b.paymentAmount,
      0,
    );

    const revenuePercentage =
      totalPotentialRevenue > 0
        ? (currentRevenue / totalPotentialRevenue) * 100
        : 0;

    return {
      totalPotential: totalPotentialRevenue,
      currentRevenue,
      pendingRevenue,
      refundedAmount,
      revenuePercentage,
      paidCount: paidBookings.length,
      pendingCount: pendingPayments.length,
      failedCount: failedPayments.length,
      refundedCount: refundedBookings.length,
      averageBookingValue:
        bookings.length > 0
          ? currentRevenue / paidBookings.length
          : session.pricePerPerson,
    };
  }, [session, summary]);

  const getRevenueColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <AdminCard
      title="Financial Summary"
      icon={DollarSign}
      iconColor="success"
      action={
        onViewPaymentDetails && (
          <button
            onClick={onViewPaymentDetails}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Details
          </button>
        )
      }
    >
      <div className="space-y-6">
        {/* Main Revenue Display */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Total Revenue</p>
          <p
            className={`text-4xl font-bold ${getRevenueColor(financialMetrics.revenuePercentage)}`}
          >
            £{financialMetrics.currentRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            of £{financialMetrics.totalPotential.toLocaleString()} potential
          </p>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  £{financialMetrics.currentRevenue.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-green-700 mt-2">
              {financialMetrics.paidCount} payments
            </p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-900">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  £{financialMetrics.pendingRevenue.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              {financialMetrics.pendingCount} payments
            </p>
          </div>
        </div>

        {/* Payment Status Details */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Payment Status</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Paid</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {financialMetrics.paidCount}
                </span>
                <span className="text-sm text-gray-500">
                  (£{financialMetrics.currentRevenue.toLocaleString()})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {financialMetrics.pendingCount}
                </span>
                <span className="text-sm text-gray-500">
                  (£{financialMetrics.pendingRevenue.toLocaleString()})
                </span>
              </div>
            </div>

            {financialMetrics.failedCount > 0 && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">Failed</span>
                </div>
                <span className="text-sm font-medium text-red-600">
                  {financialMetrics.failedCount}
                </span>
              </div>
            )}

            {financialMetrics.refundedCount > 0 && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Refunded</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {financialMetrics.refundedCount}
                  </span>
                  <span className="text-sm text-gray-500">
                    (£{financialMetrics.refundedAmount.toLocaleString()})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Key Metrics</h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Fill Rate</p>
              <p className="font-medium">
                {financialMetrics.revenuePercentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-500">Avg. Booking Value</p>
              <p className="font-medium">
                £{financialMetrics.averageBookingValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {financialMetrics.pendingCount > 0 && (
          <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Pending Payments</p>
              <p className="text-yellow-700">
                {financialMetrics.pendingCount} payments totaling £
                {financialMetrics.pendingRevenue.toLocaleString()} are awaiting
                confirmation.
              </p>
            </div>
          </div>
        )}

        {financialMetrics.failedCount > 0 && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-800">Failed Payments</p>
              <p className="text-red-700">
                {financialMetrics.failedCount} payment(s) failed. Follow up with
                attendees.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(financialMetrics.refundedCount > 0 ||
          session.status === "CANCELLED") &&
          onProcessRefunds && (
            <div className="flex justify-center pt-2">
              <button
                onClick={onProcessRefunds}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Process Refunds</span>
              </button>
            </div>
          )}
      </div>
    </AdminCard>
  );
};
