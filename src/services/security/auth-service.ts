import { apiClient } from "@services/api/enhanced-client";
import { Result } from "@types/advanced";
import { jwtDecode } from "jwt-decode";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  tokenRefreshThreshold: number; // in seconds
  sessionTimeout: number; // in minutes
}

class AuthService {
  private readonly TOKEN_KEY = "auth_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly SESSION_KEY = "auth_session";
  private refreshTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private loginAttempts = new Map<
    string,
    { count: number; lastAttempt: Date }
  >();

  private config: SecurityConfig = {
    maxLoginAttempts: 3,
    lockoutDuration: 15,
    tokenRefreshThreshold: 300, // 5 minutes before expiry
    sessionTimeout: 30,
  };

  /**
   * Initialize auth service
   */
  async initialize(): Promise<void> {
    // Check for existing session
    const token = this.getStoredToken();
    if (token) {
      await this.validateAndRefreshToken(token);
    }

    // Setup activity monitoring
    this.setupActivityMonitoring();

    // Setup secure storage event listener
    this.setupStorageListener();
  }

  /**
   * Login with enhanced security
   */
  async login(
    email: string,
    password: string,
  ): Promise<Result<AuthTokens, Error>> {
    try {
      // Check for account lockout
      if (this.isAccountLocked(email)) {
        return Result.err(
          new Error(
            "Account is temporarily locked due to multiple failed attempts",
          ),
        );
      }

      // Hash password client-side (additional server-side hashing should also be done)
      const hashedPassword = await this.hashPassword(password);

      // Get device fingerprint
      const deviceFingerprint = await this.getDeviceFingerprint();

      const result = await apiClient.post<AuthTokens>("/api/auth/login", {
        email,
        password: hashedPassword,
        deviceFingerprint,
        timestamp: new Date().toISOString(),
      });

      if (!result.success) {
        this.recordFailedAttempt(email);
        return Result.err(new Error(result.error.message));
      }

      // Clear failed attempts on successful login
      this.loginAttempts.delete(email);

      // Store tokens securely
      await this.storeTokens(result.data.data, false);

      // Setup auto-refresh
      this.setupTokenRefresh(result.data.data.accessToken);

      // Log successful login
      await this.logSecurityEvent("login_success", { email });

      return Result.ok(result.data.data);
    } catch (error) {
      this.recordFailedAttempt(email);
      return Result.err(error as Error);
    }
  }

  /**
   * Logout with cleanup
   */
  async logout(): Promise<void> {
    try {
      const token = this.getStoredToken();

      // Notify server
      if (token) {
        await apiClient.post("/api/auth/logout", {
          token,
          timestamp: new Date().toISOString(),
        });
      }

      // Clear local storage
      this.clearTokens();

      // Clear timers
      this.clearTimers();

      // Clear session data
      sessionStorage.clear();

      // Log logout
      await this.logSecurityEvent("logout", {});
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local data even if server call fails
      this.clearTokens();
      this.clearTimers();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<Result<AuthTokens, Error>> {
    try {
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        return Result.err(new Error("No refresh token available"));
      }

      const result = await apiClient.post<AuthTokens>("/api/auth/refresh", {
        refreshToken,
        deviceFingerprint: await this.getDeviceFingerprint(),
      });

      if (!result.success) {
        this.clearTokens();
        return Result.err(new Error(result.error.message));
      }

      await this.storeTokens(result.data.data, true);
      this.setupTokenRefresh(result.data.data.accessToken);

      return Result.ok(result.data.data);
    } catch (error) {
      this.clearTokens();
      return Result.err(error as Error);
    }
  }

  /**
   * Validate current token
   */
  async validateToken(token?: string): Promise<boolean> {
    try {
      const tokenToValidate = token || this.getStoredToken();

      if (!tokenToValidate) {
        return false;
      }

      const payload = this.decodeToken(tokenToValidate);

      // Check expiration
      if (payload.exp * 1000 < Date.now()) {
        return false;
      }

      // Verify with server
      const result = await apiClient.post("/api/auth/validate", {
        token: tokenToValidate,
      });

      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user from token
   */
  getCurrentUser(): TokenPayload | null {
    try {
      const token = this.getStoredToken();
      if (!token) return null;

      return this.decodeToken(token);
    } catch {
      return null;
    }
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || false;
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Private methods
   */
  private async hashPassword(password: string): Promise<string> {
    // Use Web Crypto API for client-side hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private async getDeviceFingerprint(): Promise<string> {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator.hardwareConcurrency,
    };

    return btoa(JSON.stringify(fingerprint));
  }

  private decodeToken(token: string): TokenPayload {
    return jwtDecode<TokenPayload>(token);
  }

  private getStoredToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  private async storeTokens(
    tokens: AuthTokens,
    persistent: boolean,
  ): Promise<void> {
    const storage = persistent ? localStorage : sessionStorage;

    storage.setItem(this.TOKEN_KEY, tokens.accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    storage.setItem(
      this.SESSION_KEY,
      JSON.stringify({
        startTime: Date.now(),
        lastActivity: Date.now(),
      }),
    );
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  private clearTimers(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private setupTokenRefresh(token: string): void {
    try {
      const payload = this.decodeToken(token);
      const expiresIn = payload.exp * 1000 - Date.now();
      const refreshTime = expiresIn - this.config.tokenRefreshThreshold * 1000;

      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, refreshTime);
      }
    } catch (error) {
      console.error("Failed to setup token refresh:", error);
    }
  }

  private setupActivityMonitoring(): void {
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
      const session = this.getSession();
      if (session) {
        session.lastActivity = lastActivity;
        this.updateSession(session);
      }
    };

    // Monitor user activity
    ["mousedown", "keydown", "scroll", "touchstart"].forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for inactivity
    this.activityTimer = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > this.config.sessionTimeout * 60 * 1000) {
        this.logout();
      }
    }, 60000); // Check every minute
  }

  private setupStorageListener(): void {
    // Listen for storage changes (multi-tab support)
    window.addEventListener("storage", (e) => {
      if (e.key === this.TOKEN_KEY) {
        if (!e.newValue) {
          // Token removed in another tab
          this.clearTimers();
          window.location.href = "/login";
        } else if (e.oldValue !== e.newValue) {
          // Token changed in another tab
          this.validateAndRefreshToken(e.newValue);
        }
      }
    });
  }

  private async validateAndRefreshToken(token: string): Promise<void> {
    const isValid = await this.validateToken(token);
    if (!isValid) {
      const refreshResult = await this.refreshToken();
      if (!refreshResult.success) {
        this.clearTokens();
        window.location.href = "/login";
      }
    }
  }

  private isAccountLocked(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    const lockoutTime = this.config.lockoutDuration * 60 * 1000;

    if (
      attempts.count >= this.config.maxLoginAttempts &&
      timeSinceLastAttempt < lockoutTime
    ) {
      return true;
    }

    // Clear old attempts
    if (timeSinceLastAttempt > lockoutTime) {
      this.loginAttempts.delete(email);
    }

    return false;
  }

  private recordFailedAttempt(email: string): void {
    const attempts = this.loginAttempts.get(email) || {
      count: 0,
      lastAttempt: new Date(),
    };
    attempts.count++;
    attempts.lastAttempt = new Date();
    this.loginAttempts.set(email, attempts);
  }

  private getSession(): any {
    const sessionStr = sessionStorage.getItem(this.SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  private updateSession(session: any): void {
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private async logSecurityEvent(event: string, data: any): Promise<void> {
    try {
      await apiClient.post("/api/security/events", {
        event,
        data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export types
export type { AuthTokens, TokenPayload, SecurityConfig };
