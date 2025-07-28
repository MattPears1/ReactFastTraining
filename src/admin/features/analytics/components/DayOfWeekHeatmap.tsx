import React from "react";

interface DayData {
  day: string;
  bookings: number;
  revenue: number;
}

interface Props {
  data: DayData[];
}

export const DayOfWeekHeatmap: React.FC<Props> = ({ data }) => {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>No booking data available for the selected period</p>
      </div>
    );
  }

  try {
    // Find max values for scaling
    const maxBookings = Math.max(...data.map((d) => d.bookings));
    const maxRevenue = Math.max(...data.map((d) => d.revenue));

    const getIntensity = (value: number, max: number) => {
      if (max === 0) return 0;
      const intensity = (value / max) * 100;
      if (intensity >= 80) return 5;
      if (intensity >= 60) return 4;
      if (intensity >= 40) return 3;
      if (intensity >= 20) return 2;
      if (intensity > 0) return 1;
      return 0;
    };

    const intensityColors = [
      "bg-gray-100",
      "bg-primary-100",
      "bg-primary-200",
      "bg-primary-300",
      "bg-primary-400",
      "bg-primary-500",
    ];

    return (
      <div className="space-y-6">
        {/* Bookings Heatmap */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Bookings by Day
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {data.map((dayData) => {
              const intensity = getIntensity(dayData.bookings, maxBookings);
              return (
                <div
                  key={dayData.day}
                  className={`relative p-4 rounded-lg ${intensityColors[intensity]} transition-all hover:scale-105 cursor-pointer group`}
                >
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      {dayData.day.slice(0, 3)}
                    </p>
                    <p
                      className={`text-lg font-bold ${intensity >= 3 ? "text-white" : "text-gray-900"}`}
                    >
                      {dayData.bookings}
                    </p>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    <div>{dayData.day}</div>
                    <div>{dayData.bookings} bookings</div>
                    <div>£{dayData.revenue.toLocaleString()} revenue</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Heatmap */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Revenue by Day
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {data.map((dayData) => {
              const intensity = getIntensity(dayData.revenue, maxRevenue);
              return (
                <div
                  key={`revenue-${dayData.day}`}
                  className={`relative p-4 rounded-lg ${intensityColors[intensity]} transition-all hover:scale-105 cursor-pointer group`}
                >
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      {dayData.day.slice(0, 3)}
                    </p>
                    <p
                      className={`text-sm font-bold ${intensity >= 3 ? "text-white" : "text-gray-900"}`}
                    >
                      £{(dayData.revenue / 1000).toFixed(1)}k
                    </p>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    <div>{dayData.day}</div>
                    <div>£{dayData.revenue.toLocaleString()} revenue</div>
                    <div>{dayData.bookings} bookings</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex gap-1">
            {intensityColors.map((color, index) => (
              <div key={index} className={`w-4 h-4 rounded ${color}`}></div>
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering DayOfWeekHeatmap:", error);
    return (
      <div className="h-80 flex items-center justify-center text-red-500">
        <p>Error loading heatmap. Please try again.</p>
      </div>
    );
  }
};
