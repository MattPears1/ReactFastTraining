import React from "react";
import {
  Eye,
  MousePointer,
  ShoppingCart,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface FunnelData {
  visitors: number;
  coursesViewed: number;
  bookingStarted: number;
  bookingCompleted: number;
  bookingCancelled: number;
}

interface Props {
  data: FunnelData;
}

export const BookingFunnelChart: React.FC<Props> = ({ data }) => {
  // Handle empty or invalid data
  if (!data || typeof data !== "object") {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No funnel data available</p>
      </div>
    );
  }

  // Ensure all required properties exist with defaults
  const safeData = {
    visitors: data.visitors || 0,
    coursesViewed: data.coursesViewed || 0,
    bookingStarted: data.bookingStarted || 0,
    bookingCompleted: data.bookingCompleted || 0,
    bookingCancelled: data.bookingCancelled || 0,
  };

  const stages = [
    {
      name: "Visitors",
      value: safeData.visitors,
      icon: <Eye className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-700",
      percentage: 100,
    },
    {
      name: "Viewed Courses",
      value: safeData.coursesViewed,
      icon: <MousePointer className="w-5 h-5" />,
      color: "bg-indigo-100 text-indigo-700",
      percentage:
        safeData.visitors > 0
          ? (safeData.coursesViewed / safeData.visitors) * 100
          : 0,
    },
    {
      name: "Started Booking",
      value: safeData.bookingStarted,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-purple-100 text-purple-700",
      percentage:
        safeData.visitors > 0
          ? (safeData.bookingStarted / safeData.visitors) * 100
          : 0,
    },
    {
      name: "Completed Booking",
      value: safeData.bookingCompleted,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "bg-green-100 text-green-700",
      percentage:
        safeData.visitors > 0
          ? (safeData.bookingCompleted / safeData.visitors) * 100
          : 0,
    },
  ];

  const getDropoffRate = (currentStage: number, previousStage: number) => {
    if (previousStage === 0) return 0;
    return (((previousStage - currentStage) / previousStage) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stages.map((stage, index) => (
          <div key={stage.name} className="relative">
            <div
              className={`p-4 rounded-lg ${stage.color} transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                {stage.icon}
                <span className="text-2xl font-bold">
                  {stage.value.toLocaleString()}
                </span>
              </div>
              <div className="text-sm font-medium">{stage.name}</div>
              <div className="text-xs mt-1">
                {stage.percentage.toFixed(1)}% of total
              </div>
            </div>

            {index < stages.length - 1 && (
              <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                <div className="bg-white rounded-full p-1 shadow-sm">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs text-red-600 font-medium">
                    -{getDropoffRate(stages[index + 1].value, stage.value)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Conversion Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Conversion Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">View to Booking:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {safeData.coursesViewed > 0
                ? `${((safeData.bookingStarted / safeData.coursesViewed) * 100).toFixed(1)}%`
                : "0%"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Booking Completion:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {safeData.bookingStarted > 0
                ? `${((safeData.bookingCompleted / safeData.bookingStarted) * 100).toFixed(1)}%`
                : "0%"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Overall Conversion:</span>
            <span className="ml-2 font-semibold text-green-600">
              {safeData.visitors > 0
                ? `${((safeData.bookingCompleted / safeData.visitors) * 100).toFixed(2)}%`
                : "0%"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Abandoned Bookings:</span>
            <span className="ml-2 font-semibold text-red-600">
              {safeData.bookingCancelled}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
