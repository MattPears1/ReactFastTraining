import React from "react";

export const AdminErrorTest: React.FC = () => {
  const [error, setError] = React.useState<any>(null);
  
  React.useEffect(() => {
    // Log all environment variables
    console.log("Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE
    });
    
    // Test if adminAuthService exists
    try {
      const testImport = async () => {
        const authService = await import("../services/admin-auth.service");
        console.log("Auth service loaded:", authService);
      };
      testImport();
    } catch (e) {
      console.error("Failed to load auth service:", e);
      setError(e);
    }
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Error Test Page</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <pre className="text-sm">
          {JSON.stringify({
            pathname: window.location.pathname,
            origin: window.location.origin,
            hasError: !!error,
            errorMessage: error?.message || "No error"
          }, null, 2)}
        </pre>
      </div>
      {error && (
        <div className="mt-4 bg-red-100 p-4 rounded">
          <h2 className="font-bold text-red-700 mb-2">Error:</h2>
          <pre className="text-sm text-red-600">{error.toString()}</pre>
        </div>
      )}
    </div>
  );
};