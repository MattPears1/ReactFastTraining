import React from "react";
import { MapPin } from "lucide-react";

interface MapProps {
  address?: string;
  height?: string;
}

const Map: React.FC<MapProps> = ({
  address = "123 Business Ave, Suite 100, New York, NY 10001",
  height = "h-full",
}) => {
  // In a real application, you would integrate with Google Maps, Mapbox, or another mapping service
  // For now, we'll create a placeholder that looks like a map

  return (
    <div
      className={`relative ${height} min-h-[400px] rounded-xl overflow-hidden shadow-lg`}
    >
      {/* Map Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />

        {/* Center Marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75" />
            <div className="relative bg-primary-600 dark:bg-primary-500 text-white p-3 rounded-full shadow-lg">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Address Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Lex Business Headquarters
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Controls (Decorative) */}
      <div className="absolute top-4 right-4 space-y-2">
        <button className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
        <button className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-gray-400 rounded-full opacity-50" />
      <div className="absolute top-32 right-20 w-2 h-2 bg-gray-400 rounded-full opacity-50" />
      <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-gray-400 rounded-full opacity-50" />

      {/* Roads (Decorative) */}
      <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600 opacity-30" />
      <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-gray-300 dark:bg-gray-600 opacity-30" />
    </div>
  );
};

export default Map;
