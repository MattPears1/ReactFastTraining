import React from "react";

export const AdminDebug: React.FC = () => {
  const debugInfo = {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: import.meta.env.VITE_API_URL,
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
    baseUrl: import.meta.env.BASE_URL,
    mode: import.meta.env.MODE,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    pathname: window.location.pathname,
    origin: window.location.origin,
    localStorage: {
      hasAdminToken: !!localStorage.getItem("adminAccessToken"),
      tokenLength: localStorage.getItem("adminAccessToken")?.length || 0
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-md z-50 border border-gray-200">
      <h3 className="font-bold text-sm mb-2">Admin Debug Info</h3>
      <pre className="text-xs overflow-auto max-h-64">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};