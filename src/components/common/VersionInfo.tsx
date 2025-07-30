import React from "react";

interface VersionInfoProps {
  className?: string;
}

export const VersionInfo: React.FC<VersionInfoProps> = ({ className = "" }) => {
  const version = import.meta.env.VITE_APP_VERSION || "1.0.0";
  const buildTime = import.meta.env.VITE_BUILD_TIME;
  const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP;
  const isDev = import.meta.env.DEV;

  // Only show in development or if explicitly requested
  if (!isDev && !window.location.search.includes("version=1")) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded z-50 ${className}`}
    >
      <div>v{version}</div>
      {buildTime && (
        <div className="text-xs opacity-75">
          {new Date(buildTime).toLocaleString()}
        </div>
      )}
      {buildTimestamp && (
        <div className="text-xs opacity-50">#{buildTimestamp}</div>
      )}
    </div>
  );
};

export default VersionInfo;
