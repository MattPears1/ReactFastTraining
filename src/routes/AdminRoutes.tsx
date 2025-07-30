import React, { Suspense } from "react";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import LoadingScreen from "@/components/common/LoadingScreen";

// Create a fallback component for errors
const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 m-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Portal Loading Error</h1>
      <p className="text-gray-600 mb-4">Failed to load the admin portal. Please check the console for details.</p>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-sm text-red-700 font-mono">{error.toString()}</p>
          {error.stack && (
            <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
              {error.stack}
            </pre>
          )}
        </div>
      )}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <h2 className="font-semibold text-blue-800 mb-2">Debug Info:</h2>
        <pre className="text-xs text-blue-600">
{JSON.stringify({
  pathname: window.location.pathname,
  origin: window.location.origin,
  apiUrl: import.meta.env.VITE_API_URL,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
}, null, 2)}
        </pre>
      </div>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Retry
      </button>
      <a 
        href="/admin/test"
        className="ml-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 inline-block"
      >
        Go to Test Page
      </a>
    </div>
  </div>
);

// Lazy load AdminApp to catch import errors
const AdminApp = React.lazy(() => 
  import("@/admin/AdminApp").then(module => {
    console.log("AdminApp module loaded successfully");
    return { default: module.AdminApp };
  }).catch(error => {
    console.error("Failed to load AdminApp:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    // Return a fallback component
    return {
      default: () => <ErrorFallback error={error} />
    };
  })
);

export const AdminRoutes: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Portal Error</h1>
            <p className="text-gray-600 mb-4">Something went wrong loading the admin portal.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <Suspense fallback={<LoadingScreen />}>
        <AdminApp />
      </Suspense>
    </ErrorBoundary>
  );
};
