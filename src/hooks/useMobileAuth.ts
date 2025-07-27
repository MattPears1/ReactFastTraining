import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Mobile-optimized authentication hook
 * Handles touch interactions, biometric auth, and mobile-specific edge cases
 */
export const useMobileAuth = () => {
  const auth = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [touchId, setTouchId] = useState<string | null>(null);
  const lastActivityTime = useRef<number>(Date.now());
  const inactivityTimer = useRef<NodeJS.Timeout>();
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;
      
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Check biometric support
  useEffect(() => {
    const checkBiometric = async () => {
      if ('credentials' in navigator && 'preventSilentAccess' in navigator.credentials) {
        try {
          // Check for WebAuthn support
          const available = await (window as any).PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable();
          setSupportsBiometric(available || false);
        } catch {
          setSupportsBiometric(false);
        }
      }
    };
    
    if (isMobile) {
      checkBiometric();
    }
  }, [isMobile]);
  
  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Touch-based session activity tracking
  useEffect(() => {
    if (!isMobile || !auth.isAuthenticated) return;
    
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
      
      // Reset inactivity timer
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      
      // Set new inactivity timer (5 minutes for mobile)
      inactivityTimer.current = setTimeout(() => {
        handleInactivityTimeout();
      }, 5 * 60 * 1000);
    };
    
    // Track various touch interactions
    const events = ['touchstart', 'touchmove', 'click', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Initial timer
    updateActivity();
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [isMobile, auth.isAuthenticated]);
  
  /**
   * Handle inactivity timeout
   */
  const handleInactivityTimeout = useCallback(() => {
    // Show warning before auto-logout
    const warning = confirm('Your session will expire due to inactivity. Continue?');
    
    if (!warning) {
      auth.logout();
    } else {
      // Refresh session
      lastActivityTime.current = Date.now();
    }
  }, [auth]);
  
  /**
   * Mobile-optimized login with touch ID
   */
  const mobileLogin = useCallback(async (credentials: LoginCredentials) => {
    try {
      // Generate touch session ID for device tracking
      const touchSessionId = generateTouchSessionId();
      setTouchId(touchSessionId);
      
      // Add mobile metadata
      const mobileCredentials = {
        ...credentials,
        deviceInfo: {
          isMobile: true,
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          touchId: touchSessionId,
          isOffline,
        },
      };
      
      // Check if offline
      if (isOffline) {
        throw new Error('No internet connection. Please check your network.');
      }
      
      await auth.login(mobileCredentials);
      
      // Store for biometric if available
      if (supportsBiometric) {
        await storeBiometricCredentials(credentials.email);
      }
    } catch (error: any) {
      // Handle mobile-specific errors
      if (error.message.includes('Network')) {
        throw new Error('Connection failed. Please check your internet.');
      }
      throw error;
    }
  }, [auth, supportsBiometric, isOffline]);
  
  /**
   * Biometric authentication
   */
  const biometricLogin = useCallback(async () => {
    if (!supportsBiometric) {
      throw new Error('Biometric authentication not supported');
    }
    
    try {
      // Create credential request options
      const credentialRequestOptions = {
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          userVerification: 'required',
          timeout: 60000,
        },
      };
      
      // Request biometric authentication
      const credential = await navigator.credentials.get(credentialRequestOptions);
      
      if (credential) {
        // Use stored credentials for login
        const storedEmail = await retrieveBiometricEmail();
        if (storedEmail) {
          // Implement biometric login flow
          await auth.login({
            email: storedEmail,
            password: '', // Server should handle biometric auth differently
            biometric: true,
          });
        }
      }
    } catch (error) {
      console.error('Biometric auth failed:', error);
      throw new Error('Biometric authentication failed');
    }
  }, [auth, supportsBiometric]);
  
  /**
   * Handle app resume (for mobile web apps)
   */
  useEffect(() => {
    if (!isMobile) return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && auth.isAuthenticated) {
        // App resumed, check session
        const inactiveTime = Date.now() - lastActivityTime.current;
        
        // If inactive for more than 5 minutes, require re-authentication
        if (inactiveTime > 5 * 60 * 1000) {
          auth.logout();
        } else {
          // Refresh token if needed
          auth.checkAuth();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile, auth]);
  
  /**
   * Handle orientation changes
   */
  useEffect(() => {
    if (!isMobile) return;
    
    const handleOrientationChange = () => {
      // Force re-render of auth forms on orientation change
      window.dispatchEvent(new Event('resize'));
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isMobile]);
  
  /**
   * Touch-friendly form validation
   */
  const validateOnTouch = useCallback((value: string, type: 'email' | 'password') => {
    if (type === 'email') {
      // More lenient email validation for mobile keyboards
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    
    if (type === 'password') {
      // Show real-time password strength on mobile
      const strength = calculatePasswordStrength(value);
      return {
        valid: value.length >= 8,
        strength,
        feedback: getPasswordFeedback(strength),
      };
    }
    
    return true;
  }, []);
  
  /**
   * Mobile-specific error handling
   */
  const handleMobileError = useCallback((error: any) => {
    // Vibrate on error (if supported)
    if ('vibrate' in navigator && isMobile) {
      navigator.vibrate(200);
    }
    
    // Show mobile-friendly error messages
    const mobileErrors: Record<string, string> = {
      'Network Error': 'No internet connection',
      'Request timeout': 'Connection too slow',
      'Invalid credentials': 'Wrong email or password',
      'Account locked': 'Too many attempts. Try again later.',
    };
    
    return mobileErrors[error.message] || error.message;
  }, [isMobile]);
  
  return {
    isMobile,
    supportsBiometric,
    isOffline,
    touchId,
    mobileLogin,
    biometricLogin,
    validateOnTouch,
    handleMobileError,
    lastActivityTime: lastActivityTime.current,
  };
};

// Helper functions
function generateTouchSessionId(): string {
  return `touch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function storeBiometricCredentials(email: string): Promise<void> {
  try {
    // Store email securely for biometric auth
    if ('credentials' in navigator && 'preventSilentAccess' in navigator.credentials) {
      const credential = new (window as any).PasswordCredential({
        id: email,
        password: 'biometric',
        name: email,
      });
      
      await navigator.credentials.store(credential);
    }
  } catch (error) {
    console.error('Failed to store biometric credentials:', error);
  }
}

async function retrieveBiometricEmail(): Promise<string | null> {
  try {
    if ('credentials' in navigator) {
      const credential = await navigator.credentials.get({
        password: true,
        mediation: 'silent',
      });
      
      return (credential as any)?.id || null;
    }
  } catch {
    return null;
  }
  return null;
}

function calculatePasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  return Math.min(strength, 5);
}

function getPasswordFeedback(strength: number): string {
  const feedback = [
    'Very weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
    'Very strong',
  ];
  
  return feedback[strength] || feedback[0];
}

// Type extensions
interface LoginCredentials {
  email: string;
  password: string;
  biometric?: boolean;
  deviceInfo?: {
    isMobile: boolean;
    userAgent: string;
    screenSize: string;
    touchId: string;
    isOffline: boolean;
  };
}