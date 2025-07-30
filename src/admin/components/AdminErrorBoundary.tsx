import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin Error Boundary caught:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Admin Portal Error
            </h1>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                An error occurred while loading the admin portal. This could be due to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Missing environment variables in production</li>
                <li>API connection issues</li>
                <li>Authentication service initialization failure</li>
                <li>Module loading errors</li>
              </ul>
            </div>
            
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <h2 className="font-semibold text-red-800 mb-2">Error Details:</h2>
                <p className="text-sm text-red-700 font-mono">
                  {this.state.error.toString()}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs text-red-600 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            
            {this.state.errorInfo && (
              <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4">
                <h2 className="font-semibold text-gray-800 mb-2">Component Stack:</h2>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h2 className="font-semibold text-blue-800 mb-2">Debug Information:</h2>
              <pre className="text-xs text-blue-600 overflow-auto">
                {JSON.stringify({
                  apiUrl: import.meta.env.VITE_API_URL,
                  nodeEnv: process.env.NODE_ENV,
                  isProd: import.meta.env.PROD,
                  isDev: import.meta.env.DEV,
                  mode: import.meta.env.MODE,
                  pathname: window.location.pathname,
                  origin: window.location.origin,
                  hasToken: !!localStorage.getItem("adminAccessToken"),
                }, null, 2)}
              </pre>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("adminAccessToken");
                  window.location.href = "/admin/login";
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear Auth & Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}