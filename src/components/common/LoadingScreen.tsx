import React from "react";
import { HeartPulseLoader } from "@components/ui/LoadingAnimations";

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <HeartPulseLoader size={80} />
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Loading your training experience...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
