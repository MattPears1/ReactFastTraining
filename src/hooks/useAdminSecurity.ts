import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@store/adminStore';
import { useAuditTrail } from './useAuditTrail';
import { useToast } from '@contexts/ToastContext';

interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  idleTimeout: number; // minutes
  requireMFA: boolean;
  ipWhitelist: string[];
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
  };
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  sessionTimeout: 30,
  idleTimeout: 15,
  requireMFA: true,
  ipWhitelist: [],
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90
  }
};

export const useAdminSecurity = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { logSecurityEvent } = useAuditTrail();
  const {
    currentUser,
    sessionToken,
    sessionExpiresAt,
    updateSession,
    clearUser,
    addNotification
  } = useAdminStore();
  
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [idleWarningShown, setIdleWarningShown] = useState(false);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const [securityConfig] = useState<SecurityConfig>(DEFAULT_SECURITY_CONFIG);

  // Monitor user activity
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
      setIdleWarningShown(false);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, []);

  // Check for idle timeout
  useEffect(() => {
    const checkIdleTimeout = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      const idleThreshold = securityConfig.idleTimeout * 60 * 1000;
      const warningThreshold = (securityConfig.idleTimeout - 5) * 60 * 1000;

      if (idleTime > idleThreshold) {
        handleIdleTimeout();
      } else if (idleTime > warningThreshold && !idleWarningShown) {
        showIdleWarning();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkIdleTimeout);
  }, [lastActivity, idleWarningShown, securityConfig.idleTimeout]);

  // Check session expiry
  useEffect(() => {
    if (!sessionExpiresAt) return;

    const checkSessionExpiry = setInterval(() => {
      const expiryTime = new Date(sessionExpiresAt).getTime();
      const timeUntilExpiry = expiryTime - Date.now();
      const warningThreshold = 5 * 60 * 1000; // 5 minutes

      if (timeUntilExpiry <= 0) {
        handleSessionExpiry();
      } else if (timeUntilExpiry <= warningThreshold && !sessionWarningShown) {
        showSessionWarning(timeUntilExpiry);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkSessionExpiry);
  }, [sessionExpiresAt, sessionWarningShown]);

  const handleIdleTimeout = useCallback(async () => {
    await logSecurityEvent('idle_timeout', 'warning', {
      idleDuration: Date.now() - lastActivity,
      threshold: securityConfig.idleTimeout
    });
    
    clearUser();
    showToast('Session expired due to inactivity', 'warning');
    navigate('/login');
  }, [lastActivity, securityConfig.idleTimeout, clearUser, navigate, showToast, logSecurityEvent]);

  const handleSessionExpiry = useCallback(async () => {
    await logSecurityEvent('session_expired', 'info');
    
    clearUser();
    showToast('Session expired. Please login again.', 'info');
    navigate('/login');
  }, [clearUser, navigate, showToast, logSecurityEvent]);

  const showIdleWarning = useCallback(() => {
    setIdleWarningShown(true);
    addNotification({
      type: 'warning',
      title: 'Idle Warning',
      message: 'You will be logged out in 5 minutes due to inactivity.'
    });
  }, [addNotification]);

  const showSessionWarning = useCallback((timeRemaining: number) => {
    setSessionWarningShown(true);
    const minutes = Math.ceil(timeRemaining / 60000);
    
    addNotification({
      type: 'warning',
      title: 'Session Expiring',
      message: `Your session will expire in ${minutes} minute${minutes > 1 ? 's' : ''}.`
    });
  }, [addNotification]);

  // Validate password strength
  const validatePassword = useCallback((password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const { passwordPolicy } = securityConfig;

    if (password.length < passwordPolicy.minLength) {
      errors.push(`Password must be at least ${passwordPolicy.minLength} characters`);
    }

    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain special characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, [securityConfig]);

  // Check IP whitelist
  const checkIPWhitelist = useCallback(async (ip: string): Promise<boolean> => {
    if (securityConfig.ipWhitelist.length === 0) return true;
    
    const isWhitelisted = securityConfig.ipWhitelist.includes(ip);
    
    if (!isWhitelisted) {
      await logSecurityEvent('ip_blocked', 'error', { 
        blockedIP: ip,
        whitelist: securityConfig.ipWhitelist 
      });
    }
    
    return isWhitelisted;
  }, [securityConfig.ipWhitelist, logSecurityEvent]);

  // Refresh session token
  const refreshSession = useCallback(async () => {
    if (!sessionToken || !currentUser) return;

    try {
      // In production, this would call the API to refresh the token
      const newExpiryTime = new Date(Date.now() + securityConfig.sessionTimeout * 60 * 1000);
      
      updateSession(
        sessionToken, // In production, this would be a new token
        sessionToken, // In production, this would be a new refresh token
        newExpiryTime.toISOString()
      );
      
      setSessionWarningShown(false);
      
      await logSecurityEvent('session_refreshed', 'info');
    } catch (error) {
      console.error('Failed to refresh session:', error);
      handleSessionExpiry();
    }
  }, [sessionToken, currentUser, securityConfig.sessionTimeout, updateSession, logSecurityEvent, handleSessionExpiry]);

  // Validate CSRF token
  const validateCSRFToken = useCallback((token: string): boolean => {
    const storedToken = sessionStorage.getItem('csrfToken');
    return token === storedToken;
  }, []);

  // Generate CSRF token
  const generateCSRFToken = useCallback((): string => {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem('csrfToken', token);
    return token;
  }, []);

  return {
    validatePassword,
    checkIPWhitelist,
    refreshSession,
    validateCSRFToken,
    generateCSRFToken,
    securityConfig,
    isSessionExpiring: sessionWarningShown,
    isIdle: idleWarningShown
  };
};

// Rate limiting hook
export const useRateLimit = (key: string, maxAttempts: number, windowMs: number) => {
  const [attempts, setAttempts] = useState<number[]>([]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    setAttempts([...recentAttempts, now]);
    return true;
  }, [attempts, maxAttempts, windowMs]);

  const resetRateLimit = useCallback(() => {
    setAttempts([]);
  }, []);

  return { checkRateLimit, resetRateLimit };
};