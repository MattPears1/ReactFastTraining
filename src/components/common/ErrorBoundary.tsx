import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
    errorId: "",
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('🚨 [ERROR BOUNDARY] Error caught in getDerivedStateFromError:', {
      errorId: errorId,
      error: error.toString(),
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  public componentDidUpdate(prevProps: Props) {
    const { resetKeys = [], resetOnPropsChange = false } = this.props;
    const hasResetKeysChanged = resetKeys.some(
      (key, idx) => key !== this.previousResetKeys[idx],
    );

    if (hasResetKeysChanged && this.state.hasError) {
      this.resetErrorBoundary();
    }

    this.previousResetKeys = resetKeys;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('❌ [ERROR BOUNDARY] Component error caught');
    console.error('Error object:', error);
    console.error('Error info:', errorInfo);
    console.groupEnd();

    // Update state with error info
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log comprehensive error details
    const errorDetails = {
      errorId: this.state.errorId,
      errorCount: this.state.errorCount + 1,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        toString: error.toString()
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      environment: {
        pathname: window.location.pathname,
        href: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      component: {
        isolate: this.props.isolate,
        hasCustomFallback: !!this.props.fallback,
        hasErrorHandler: !!this.props.onError
      }
    };

    console.error('🔍 [ERROR BOUNDARY] Detailed error information:', errorDetails);

    // Store error in window for debugging
    (window as any).__LAST_ERROR__ = errorDetails;
    console.log('💾 [ERROR BOUNDARY] Error details saved to window.__LAST_ERROR__');

    // Call custom error handler if provided
    if (this.props.onError) {
      console.log('🔔 [ERROR BOUNDARY] Calling custom error handler');
      this.props.onError(error, errorInfo);
    }

    // Auto-reset after 3 consecutive errors to prevent infinite loops
    if (this.state.errorCount >= 2) {
      console.warn('⚠️ [ERROR BOUNDARY] Multiple errors detected, scheduling auto-reset in 5 seconds');
      this.scheduleAutoReset();
    }
  }

  private scheduleAutoReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 5000);
  };

  private resetErrorBoundary = () => {
    console.log('🔄 [ERROR BOUNDARY] Resetting error boundary');
    
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      errorId: "",
    });
    
    console.log('✅ [ERROR BOUNDARY] Error boundary reset complete');
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Isolated error boundary for component-level errors
      if (this.props.isolate) {
        return (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Component Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This component encountered an error and cannot be displayed.
                </p>
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                      Show details
                    </summary>
                    <pre className="mt-1 text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <button
                  onClick={this.resetErrorBoundary}
                  className="mt-3 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Full page error boundary
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              We encountered an unexpected error. Please try refreshing the page
              or contact support if the problem persists.
            </p>

            {/* Error details in development */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-gray-600 dark:text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                      Component stack
                    </summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Error ID: {this.state.errorId}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {this.state.errorCount > 1 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
                Error occurred {this.state.errorCount} times
                {this.state.errorCount >= 3 && " - Auto-reset in 5 seconds"}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// HOC for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
