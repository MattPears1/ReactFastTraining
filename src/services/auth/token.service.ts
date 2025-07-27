/**
 * Secure token storage service
 * Provides secure, encapsulated token management
 */
class TokenService {
  private static instance: TokenService;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  setTokens(accessToken: string, expiresAt: string): void {
    this.accessToken = accessToken;
    this.tokenExpiry = new Date(expiresAt);
    
    // Set up auto-refresh timer
    this.scheduleTokenRefresh();
  }

  getAccessToken(): string | null {
    // Check if token is expired
    if (this.tokenExpiry && new Date() >= this.tokenExpiry) {
      this.clearTokens();
      return null;
    }
    return this.accessToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  isAuthenticated(): boolean {
    return !!(this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry);
  }

  getTokenExpiry(): Date | null {
    return this.tokenExpiry;
  }

  private scheduleTokenRefresh(): void {
    if (!this.tokenExpiry) return;

    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Calculate when to refresh (5 minutes before expiry)
    const now = new Date().getTime();
    const expiry = this.tokenExpiry.getTime();
    const refreshTime = expiry - now - (5 * 60 * 1000); // 5 minutes before expiry

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        // Trigger token refresh event
        window.dispatchEvent(new CustomEvent('auth:token-refresh-needed'));
      }, refreshTime);
    }
  }
}

export const tokenService = TokenService.getInstance();