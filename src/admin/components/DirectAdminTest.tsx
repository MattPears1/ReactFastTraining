import React from "react";

export const DirectAdminTest: React.FC = () => {
  const [moduleTest, setModuleTest] = React.useState<any>({});

  React.useEffect(() => {
    const testModules = async () => {
      const results: any = {};
      
      // Test basic imports
      try {
        results.react = { success: true, version: React.version };
      } catch (e: any) {
        results.react = { success: false, error: e.message };
      }

      // Test router
      try {
        const router = await import("react-router-dom");
        results.router = { success: true, available: !!router };
      } catch (e: any) {
        results.router = { success: false, error: e.message };
      }

      // Test auth context
      try {
        const authContext = await import("../contexts/AdminAuthContext");
        results.authContext = { success: true, exports: Object.keys(authContext) };
      } catch (e: any) {
        results.authContext = { success: false, error: e.message };
      }

      // Test auth service
      try {
        const authService = await import("../services/admin-auth.service");
        results.authService = { success: true, exports: Object.keys(authService) };
      } catch (e: any) {
        results.authService = { success: false, error: e.message };
      }

      // Test notification context
      try {
        const notifContext = await import("../contexts/NotificationContext");
        results.notificationContext = { success: true, exports: Object.keys(notifContext) };
      } catch (e: any) {
        results.notificationContext = { success: false, error: e.message };
      }

      setModuleTest(results);
    };

    testModules();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Direct Admin Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              env: {
                NODE_ENV: process.env.NODE_ENV,
                VITE_API_URL: import.meta.env.VITE_API_URL,
                PROD: import.meta.env.PROD,
                DEV: import.meta.env.DEV,
                MODE: import.meta.env.MODE,
              },
              location: {
                pathname: window.location.pathname,
                origin: window.location.origin,
                href: window.location.href,
              },
              build: {
                timestamp: new Date().toISOString(),
              }
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Module Tests</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(moduleTest, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a href="/admin/login" className="block text-blue-600 hover:underline">
              → Admin Login Page
            </a>
            <a href="/admin/test" className="block text-blue-600 hover:underline">
              → Admin Test Page (within admin app)
            </a>
            <a href="/" className="block text-blue-600 hover:underline">
              → Main Site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};