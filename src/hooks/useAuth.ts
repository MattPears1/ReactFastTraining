import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext';

/**
 * Custom hook for authentication
 * Provides easier access to auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook to check if user has specific permissions
 */
export function usePermissions() {
  const { user } = useAuth();
  
  return {
    isAdmin: user?.role === 'admin',
    isInstructor: user?.role === 'instructor' || user?.role === 'admin',
    canManageSessions: user?.role === 'admin' || user?.role === 'instructor',
    canViewReports: user?.role === 'admin',
  };
}

/**
 * Hook for session management
 */
export function useSession() {
  const { user, isAuthenticated, logout } = useAuth();
  
  const extendSession = async () => {
    // TODO: Implement session extension when refresh tokens are available
    window.location.reload();
  };
  
  return {
    user,
    isAuthenticated,
    logout,
    extendSession,
  };
}