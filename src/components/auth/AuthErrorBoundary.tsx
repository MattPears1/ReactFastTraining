import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class AuthErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const { errorCount } = this.state;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth Error Boundary caught:', error, errorInfo);
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state
    this.setState({
      errorInfo,
      errorCount: errorCount + 1,
    });

    // Report to error tracking service
    this.reportError(error, errorInfo);

    // Auto-reset after 3 errors to prevent infinite loops
    if (errorCount >= 2) {
      this.scheduleReset();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry or other error tracking service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.withScope((scope: any) => {
        scope.setContext('errorBoundary', {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'AuthErrorBoundary',
        });
        (window as any).Sentry.captureException(error);
      });
    }

    // Log to audit service
    const event = new CustomEvent('auth:error-boundary', {
      detail: {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });
    window.dispatchEvent(event);
  }

  private scheduleReset = () => {
    this.resetTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorCount: 0,
      });
    }, 5000);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: this.state.errorCount + 1,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private renderErrorDetails() {
    const { error, errorInfo } = this.state;
    
    if (process.env.NODE_ENV !== 'development' || !error || !errorInfo) {
      return null;
    }

    return (
      <details className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          Error Details (Development Only)
        </summary>
        <div className="mt-2 space-y-2">
          <div className="text-xs text-gray-600">
            <strong>Error:</strong> {error.toString()}
          </div>
          <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
            {error.stack}
          </pre>
          <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
            {errorInfo.componentStack}
          </pre>
        </div>
      </details>
    );
  }

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Authentication Error</CardTitle>
              <CardDescription>
                {error?.message === 'ChunkLoadError' || error?.message?.includes('Loading chunk')
                  ? 'There was a problem loading the authentication module. This might be due to a network issue.'
                  : 'Something went wrong with the authentication process. Please try again.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                  disabled={errorCount > 2}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                  {errorCount > 0 && ` (${3 - errorCount} attempts left)`}
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="default"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {errorCount > 2 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  Multiple errors detected. The page will automatically reset in a few seconds.
                </div>
              )}

              {this.renderErrorDetails()}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for wrapping auth components
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return (props: P) => (
    <AuthErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AuthErrorBoundary>
  );
}

// Hook for error handling in functional components
export function useAuthErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // Log error
    console.error('Auth error:', error, errorInfo);

    // Report to error tracking
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: errorInfo,
        },
      });
    }

    // Dispatch error event
    const event = new CustomEvent('auth:error', {
      detail: { error, errorInfo },
    });
    window.dispatchEvent(event);
  };
}