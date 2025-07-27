import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super-admin';
  requireReauth?: boolean;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const REAUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes for sensitive operations

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  requiredRole = 'admin',
  requireReauth = false 
}) => {
  const { user, isAuthenticated, checkAdminAccess, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    checkAccess();
  }, [isAuthenticated, user, location]);

  useEffect(() => {
    // Session timeout monitoring
    const checkSessionTimeout = () => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > SESSION_TIMEOUT) {
        showToast('Session expired due to inactivity', 'warning');
        logout();
      }
    };

    const interval = setInterval(checkSessionTimeout, 60000); // Check every minute
    
    // Activity tracking
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [lastActivity, logout, showToast]);

  const checkAccess = async () => {
    try {
      setIsChecking(true);

      if (!isAuthenticated || !user) {
        return;
      }

      // Check if user has admin role
      const hasAdminAccess = await checkAdminAccess();
      if (!hasAdminAccess) {
        showToast('Access denied. Admin privileges required.', 'error');
        return;
      }

      // Check specific role requirement
      if (requiredRole === 'super-admin' && user.role !== 'super-admin') {
        showToast('Access denied. Super admin privileges required.', 'error');
        return;
      }

      // Check if re-authentication is needed for sensitive operations
      if (requireReauth) {
        const lastAuth = sessionStorage.getItem('lastAuthTime');
        const timeSinceAuth = Date.now() - (lastAuth ? parseInt(lastAuth) : 0);
        
        if (timeSinceAuth > REAUTH_TIMEOUT) {
          setNeedsReauth(true);
          return;
        }
      }

      // Log admin access
      logAdminAccess(location.pathname);
    } catch (error) {
      console.error('Admin access check failed:', error);
      showToast('Failed to verify admin access', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const logAdminAccess = async (path: string) => {
    try {
      // This would call an API to log the access
      // await adminApi.logAccess({ path, timestamp: new Date() });
      console.log(`Admin access logged: ${path}`);
    } catch (error) {
      console.error('Failed to log admin access:', error);
    }
  };

  const handleReauth = async (password: string) => {
    try {
      // Verify password
      const verified = await checkAdminAccess(password);
      if (verified) {
        sessionStorage.setItem('lastAuthTime', Date.now().toString());
        setNeedsReauth(false);
        showToast('Re-authentication successful', 'success');
      } else {
        showToast('Invalid password', 'error');
      }
    } catch (error) {
      showToast('Re-authentication failed', 'error');
    }
  };

  if (isChecking) {
    return <AdminLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location, adminRequired: true }} replace />;
  }

  if (user.role !== 'admin' && user.role !== 'super-admin') {
    return <AdminAccessDenied />;
  }

  if (needsReauth) {
    return <AdminReauthScreen onReauth={handleReauth} />;
  }

  return <>{children}</>;
};

const AdminLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-pulse" />
      <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
    </div>
  </div>
);

const AdminAccessDenied: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Access Denied
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        You do not have permission to access the admin dashboard.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Return to Home
      </a>
    </div>
  </div>
);

const AdminReauthScreen: React.FC<{ onReauth: (password: string) => void }> = ({ onReauth }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onReauth(password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Lock className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Re-authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please enter your password to continue with this sensitive operation.
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

// IP Restriction Check
export const checkIPRestriction = async (): Promise<boolean> => {
  try {
    // In production, this would check against a whitelist of allowed IPs
    const response = await fetch('/api/admin/check-ip');
    const data = await response.json();
    return data.allowed;
  } catch (error) {
    console.error('IP check failed:', error);
    return false;
  }
};

// Activity Logger
export const logAdminAction = async (action: string, details?: any) => {
  try {
    const payload = {
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    };
    
    // This would send to audit log API
    console.log('Admin action logged:', payload);
    // await adminApi.logAction(payload);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};