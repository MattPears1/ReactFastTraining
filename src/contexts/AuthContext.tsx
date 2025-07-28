import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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

interface AuthContextType extends AuthContextState, AuthContextActions {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const navigate = useNavigate();

  // Check for existing auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up session timeout warning
  useEffect(() => {
    const handleSessionWarning = () => {
      const expiry = tokenService.getTokenExpiry();
      if (!expiry) return;

      const now = new Date().getTime();
      const expiryTime = expiry.getTime();
      const timeLeft = expiryTime - now;

      // Show warning 5 minutes before expiry
      if (timeLeft <= 5 * 60 * 1000 && timeLeft > 0) {
        // Dispatch custom event for UI to handle
        window.dispatchEvent(
          new CustomEvent("auth:session-expiring-soon", {
            detail: { minutesLeft: Math.floor(timeLeft / 60000) },
          }),
        );
      }
    };

    const interval = setInterval(handleSessionWarning, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = tokenService.getAccessToken();

      if (token) {
        // TODO: Validate token with backend when endpoint is available
        // For now, decode JWT to get user info (insecure, replace with API call)
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.user) {
            setUser(payload.user);
          }
        } catch {
          tokenService.clearTokens();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setError(null);
        setIsLoading(true);

        // Log login attempt
        logAuthEvent.loginAttempt(credentials.email);

        const response = await authApi.login(credentials);

        // Store tokens securely
        tokenService.setTokens(response.token, response.expiresAt);
        setUser(response.user);

        // Regenerate CSRF token after login
        csrfService.regenerateToken();

        // Log successful login
        logAuthEvent.loginSuccess(response.user);

        navigate("/dashboard");
      } catch (error: any) {
        const authError = AuthErrorService.parseError(error);
        setError(authError);

        // Log failed login
        logAuthEvent.loginFailed(credentials.email, authError.code);

        throw authError;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const signup = useCallback(async (data: SignupData) => {
    try {
      setError(null);
      setIsLoading(true);

      // Log signup attempt
      logAuthEvent.signupAttempt(data.email);

      await authApi.signup(data);

      // Log successful signup (user created but not verified)
      logAuthEvent.signupSuccess({
        id: "pending",
        email: data.email,
        name: data.name,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Don't auto-login after signup - user needs to verify email
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
      await authApi.logout();
    } catch (error) {
      // Log error but don't throw - we still want to clear local state
      console.error("Logout error:", error);
    } finally {
      // Log logout event
      if (currentUser) {
        logAuthEvent.logout(currentUser.id);
      }

      // Clear tokens and CSRF
      tokenService.clearTokens();
      csrfService.clearToken();

      setUser(null);
      setError(null);
      setIsLoading(false);
      navigate("/login");
    }
  }, [navigate, user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAuthenticated = useMemo(() => {
    return tokenService.isAuthenticated() && !!user;
  }, [user]);

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
