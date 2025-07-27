import { EventEmitter } from 'events';

interface TokenInfo {
  accessToken: string;
  expiresAt: Date;
  refreshToken?: string;
  tokenType: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

/**
 * Secure token management service
 * Uses a hybrid approach: access token in memory, refresh token in HTTP-only cookie
 */
class SecureTokenService extends EventEmitter {
  private static instance: SecureTokenService;
  private tokenInfo: TokenInfo | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    super();
    this.setupEventListeners();
  }

  static getInstance(): SecureTokenService {
    if (!SecureTokenService.instance) {
      SecureTokenService.instance = new SecureTokenService();
    }
    return SecureTokenService.instance;
  }

  private setupEventListeners(): void {
    // Listen for storage events to sync across tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'auth:logout' && event.newValue === 'true') {
      // Another tab logged out, clear our tokens
      this.clearTokens();
      this.emit('logout');
    }
  }

  /**
   * Securely decode JWT without verification (verification happens server-side)
   */
  private decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Store tokens securely
   */
  setTokens(accessToken: string, expiresAt: string, refreshToken?: string): void {
    const payload = this.decodeToken(accessToken);
    if (!payload) {
      throw new Error('Invalid access token');
    }

    this.tokenInfo = {
      accessToken,
      expiresAt: new Date(expiresAt),
      refreshToken,
      tokenType: 'Bearer',
    };

    // Schedule token refresh
    this.scheduleTokenRefresh();

    // Emit login event
    this.emit('login', { user: payload });

    // If refresh token provided, signal backend to set HTTP-only cookie
    if (refreshToken) {
      // This would be handled by the backend setting an HTTP-only cookie
      // The refresh token should never be accessible via JavaScript
    }
  }

  /**
   * Get current access token if valid
   */
  getAccessToken(): string | null {
    if (!this.tokenInfo) return null;

    // Check if token is expired
    if (new Date() >= this.tokenInfo.expiresAt) {
      this.clearTokens();
      return null;
    }

    return this.tokenInfo.accessToken;
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(): Date | null {
    return this.tokenInfo?.expiresAt || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  /**
   * Get user info from token
   */
  getUserInfo(): Partial<JWTPayload> | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    if (!payload) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.tokenInfo) return;

    const now = Date.now();
    const expiry = this.tokenInfo.expiresAt.getTime();
    const refreshTime = expiry - now - this.TOKEN_REFRESH_BUFFER;

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.emit('token:refresh-needed');
      }, refreshTime);
    }
  }

  /**
   * Clear all tokens and emit logout event
   */
  clearTokens(): void {
    this.tokenInfo = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Signal logout across tabs
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth:logout', 'true');
      // Remove the flag after a short delay
      setTimeout(() => localStorage.removeItem('auth:logout'), 100);
    }

    this.emit('logout');
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      // The refresh token is in an HTTP-only cookie, so the backend
      // will handle it automatically
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.expiresAt);
      
      this.emit('token:refreshed');
      return true;
    } catch (error) {
      this.clearTokens();
      this.emit('token:refresh-failed', error);
      return false;
    }
  }

  /**
   * Add event listener
   */
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }
}

export const secureTokenService = SecureTokenService.getInstance();

// Token service events
export type TokenServiceEvents = {
  'login': { user: Partial<JWTPayload> };
  'logout': void;
  'token:refresh-needed': void;
  'token:refreshed': void;
  'token:refresh-failed': Error;
};