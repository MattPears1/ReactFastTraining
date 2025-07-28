import React from "react";

export const AdminTestPage: React.FC = () => {
  const [apiTest, setApiTest] = React.useState<any>(null);
  const [error, setError] = React.useState<any>(null);

  React.useEffect(() => {
    // Test basic API connectivity
    const testApi = async () => {
      try {
        const baseURL = import.meta.env.PROD
          ? ""
          : import.meta.env.VITE_API_URL || "http://localhost:3000";
        
        const response = await fetch(`${baseURL}/api/health`);
        const data = await response.text();
        setApiTest({
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: response.url,
        });
      } catch (err: any) {
        setError({
          message: err.message,
          stack: err.stack,
        });
      }
    };

    testApi();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              NODE_ENV: process.env.NODE_ENV,
              VITE_API_URL: import.meta.env.VITE_API_URL,
              PROD: import.meta.env.PROD,
              DEV: import.meta.env.DEV,
              MODE: import.meta.env.MODE,
              BASE_URL: import.meta.env.BASE_URL,
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Location Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              pathname: window.location.pathname,
              origin: window.location.origin,
              href: window.location.href,
              protocol: window.location.protocol,
              host: window.location.host,
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">API Test</h2>
          {apiTest ? (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          ) : error ? (
            <pre className="bg-red-100 p-4 rounded text-sm text-red-700 overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">Testing API connection...</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Module Test</h2>
          <ul className="space-y-2 text-sm">
            <li>React: {React.version || "Unknown"}</li>
            <li>React Router Available: {typeof window !== 'undefined' && window.React ? "Yes" : "No"}</li>
            <li>Import Meta Available: {typeof import.meta !== 'undefined' ? "Yes" : "No"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};