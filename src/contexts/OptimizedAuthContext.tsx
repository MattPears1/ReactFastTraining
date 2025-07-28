import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/services/api/auth";
import { tokenService } from "@/services/auth/token.service";
import { AuthErrorService } from "@/services/auth/error.service";
import { csrfService } from "@/services/auth/csrf.service";
import { logAuthEvent } from "@/services/auth/audit-log.service";
import {
  User,
  LoginCredentials,
  SignupData,
  AuthContextState,
  AuthContextActions,
  ApiError,
} from "@/types/auth.types";

// Performance monitoring
const perfMark = (name: string) => {
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(name);
  }
};

interface AuthContextType extends AuthContextState, AuthContextActions {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Memoized hook to prevent unnecessary re-renders
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Selective auth state hook for components that only need specific data
export const useAuthUser = () => {
  const { user } = useAuth();
  return user;
};

export const useAuthStatus = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const navigate = useNavigate();

  // Use refs to prevent unnecessary effect triggers
  const sessionCheckInterval = useRef<NodeJS.Timeout>();
  const tokenRefreshTimeout = useRef<NodeJS.Timeout>();
  const isCheckingAuth = useRef(false);

  // Optimized auth check with debouncing
  const checkAuth = useCallback(async () => {
    if (isCheckingAuth.current) return;

    try {
      isCheckingAuth.current = true;
      perfMark("auth-check-start");

      const token = tokenService.getAccessToken();

      if (token) {
        // Implement token validation with backend
        try {
          const response = await authApi.validateToken();
          if (response.user) {
            setUser(response.user);
          }
        } catch {
          tokenService.clearTokens();
          setUser(null);
        }
      }

      perfMark("auth-check-end");
      performance.measure?.("auth-check", "auth-check-start", "auth-check-end");
    } finally {
      isCheckingAuth.current = false;
      setIsLoading(false);
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Optimized session monitoring with exponential backoff
  useEffect(() => {
    let backoffMultiplier = 1;

    const checkSession = () => {
      const expiry = tokenService.getTokenExpiry();
      if (!expiry || !user) return;

      const now = Date.now();
      const expiryTime = expiry.getTime();
      const timeLeft = expiryTime - now;

      // Implement exponential backoff for checks
      const checkInterval = Math.min(60000 * backoffMultiplier, 300000); // Max 5 min

      if (timeLeft <= 5 * 60 * 1000 && timeLeft > 0) {
        window.dispatchEvent(
          new CustomEvent("auth:session-expiring-soon", {
            detail: { minutesLeft: Math.floor(timeLeft / 60000) },
          }),
        );
        backoffMultiplier = 1; // Reset backoff when nearing expiry
      } else {
        backoffMultiplier = Math.min(backoffMultiplier * 1.5, 5);
      }

      sessionCheckInterval.current = setTimeout(checkSession, checkInterval);
    };

    checkSession();

    return () => {
      if (sessionCheckInterval.current) {
        clearTimeout(sessionCheckInterval.current);
      }
    };
  }, [user]);

  // Optimized token refresh handler
  useEffect(() => {
    const handleTokenRefresh = async () => {
      try {
        const response = await authApi.refreshToken();
        tokenService.setTokens(response.token, response.expiresAt);

        // Schedule next refresh
        const expiry = new Date(response.expiresAt).getTime();
        const now = Date.now();
        const refreshIn = (expiry - now) * 0.8; // Refresh at 80% of lifetime

        tokenRefreshTimeout.current = setTimeout(handleTokenRefresh, refreshIn);
      } catch (error) {
        // Token refresh failed, logout user
        logout();
      }
    };

    const expiry = tokenService.getTokenExpiry();
    if (expiry && user) {
      const now = Date.now();
      const expiryTime = expiry.getTime();
      const refreshIn = (expiryTime - now) * 0.8;

      if (refreshIn > 0) {
        tokenRefreshTimeout.current = setTimeout(handleTokenRefresh, refreshIn);
      }
    }

    return () => {
      if (tokenRefreshTimeout.current) {
        clearTimeout(tokenRefreshTimeout.current);
      }
    };
  }, [user]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const loginAbortController = new AbortController();

      try {
        perfMark("login-start");
        setError(null);
        setIsLoading(true);

        logAuthEvent.loginAttempt(credentials.email);

        const response = await authApi.login(credentials, {
          signal: loginAbortController.signal,
        });

        tokenService.setTokens(response.token, response.expiresAt);
        setUser(response.user);

        // Regenerate CSRF token
        await csrfService.regenerateToken();

        logAuthEvent.loginSuccess(response.user);

        perfMark("login-end");
        performance.measure?.("login", "login-start", "login-end");

        // Use requestIdleCallback for non-critical navigation
        if ("requestIdleCallback" in window) {
          requestIdleCallback(() => navigate("/dashboard"));
        } else {
          navigate("/dashboard");
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;

        const authError = AuthErrorService.parseError(error);
        setError(authError);
        logAuthEvent.loginFailed(credentials.email, authError.code);
        throw authError;
      } finally {
        setIsLoading(false);
      }

      return () => loginAbortController.abort();
    },
    [navigate],
  );

  const signup = useCallback(async (data: SignupData) => {
    try {
      perfMark("signup-start");
      setError(null);
      setIsLoading(true);

      logAuthEvent.signupAttempt(data.email);

      await authApi.signup(data);

      logAuthEvent.signupSuccess({
        id: "pending",
        email: data.email,
        name: data.name,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      perfMark("signup-end");
      performance.measure?.("signup", "signup-start", "signup-end");
    } catch (error: any) {
      const authError = AuthErrorService.parseError(error);
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const currentUser = user;

    try {
      setIsLoading(true);

      // Cancel any pending requests
      if (sessionCheckInterval.current)
        clearTimeout(sessionCheckInterval.current);
      if (tokenRefreshTimeout.current)
        clearTimeout(tokenRefreshTimeout.current);

      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (currentUser) {
        logAuthEvent.logout(currentUser.id);
      }

      tokenService.clearTokens();
      csrfService.clearToken();

      setUser(null);
      setError(null);
      setIsLoading(false);

      // Use replace to prevent back navigation to protected routes
      navigate("/login", { replace: true });
    }
  }, [navigate, user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize authentication state
  const isAuthenticated = useMemo(() => {
    return tokenService.isAuthenticated() && !!user;
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      error,
      login,
      signup,
      logout,
      clearError,
      checkAuth,
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      error,
      login,
      signup,
      logout,
      clearError,
      checkAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
