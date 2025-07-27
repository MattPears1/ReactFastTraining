import React, { ReactNode } from 'react';
import { AuthProvider as BaseAuthProvider } from '@/contexts/AuthContext';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { SecureRoute } from '@/middleware/security-headers';
import { useAuthErrorHandler } from './AuthErrorBoundary';

interface AuthProviderProps {
  children: ReactNode;
  enableErrorBoundary?: boolean;
  enableSecurityHeaders?: boolean;
  onAuthError?: (error: Error) => void;
}

/**
 * Enhanced Auth Provider with error boundary and security features
 */
export function AuthProvider({
  children,
  enableErrorBoundary = true,
  enableSecurityHeaders = true,
  onAuthError,
}: AuthProviderProps) {
  const handleAuthError = useAuthErrorHandler();

  const handleError = (error: Error, errorInfo: any) => {
    // Use custom handler if provided
    if (onAuthError) {
      onAuthError(error);
    }
    
    // Always use default handler as well
    handleAuthError(error, errorInfo);
  };

  // Wrap with error boundary if enabled
  const content = enableErrorBoundary ? (
    <AuthErrorBoundary onError={handleError}>
      <BaseAuthProvider>{children}</BaseAuthProvider>
    </AuthErrorBoundary>
  ) : (
    <BaseAuthProvider>{children}</BaseAuthProvider>
  );

  // Wrap with security headers if enabled
  return enableSecurityHeaders ? (
    <SecureRoute>{content}</SecureRoute>
  ) : (
    content
  );
}

// Re-export auth hooks and components for convenience
export { useAuth } from '@/contexts/AuthContext';
export { AuthErrorBoundary, withAuthErrorBoundary, useAuthErrorHandler } from './AuthErrorBoundary';
export { SecureRoute } from '@/middleware/security-headers';