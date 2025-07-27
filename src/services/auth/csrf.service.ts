/**
 * CSRF Protection Service
 * Implements double-submit cookie pattern for CSRF protection
 */
class CSRFService {
  private static instance: CSRFService;
  private csrfToken: string | null = null;
  private readonly CSRF_HEADER = 'X-CSRF-Token';
  private readonly CSRF_COOKIE = 'csrf-token';

  private constructor() {
    this.initializeToken();
  }

  static getInstance(): CSRFService {
    if (!CSRFService.instance) {
      CSRFService.instance = new CSRFService();
    }
    return CSRFService.instance;
  }

  /**
   * Initialize CSRF token from cookie or generate new one
   */
  private initializeToken(): void {
    // Try to get existing token from cookie
    const existingToken = this.getTokenFromCookie();
    
    if (existingToken) {
      this.csrfToken = existingToken;
    } else {
      // Generate new token
      this.csrfToken = this.generateToken();
      this.setTokenCookie(this.csrfToken);
    }
  }

  /**
   * Generate cryptographically secure random token
   */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get CSRF token from cookie
   */
  private getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.CSRF_COOKIE) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Set CSRF token in cookie
   */
  private setTokenCookie(token: string): void {
    // Set as httpOnly=false so JavaScript can read it (required for double-submit pattern)
    // The actual session cookie should be httpOnly=true
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${this.CSRF_COOKIE}=${encodeURIComponent(token)}; SameSite=Strict${secure}; Path=/`;
  }

  /**
   * Get current CSRF token
   */
  getToken(): string {
    if (!this.csrfToken) {
      this.initializeToken();
    }
    return this.csrfToken!;
  }

  /**
   * Add CSRF token to request headers
   */
  addToHeaders(headers: Record<string, string>): Record<string, string> {
    return {
      ...headers,
      [this.CSRF_HEADER]: this.getToken(),
    };
  }

  /**
   * Regenerate CSRF token (call after login/logout)
   */
  regenerateToken(): void {
    this.csrfToken = this.generateToken();
    this.setTokenCookie(this.csrfToken);
  }

  /**
   * Clear CSRF token (call on logout)
   */
  clearToken(): void {
    this.csrfToken = null;
    // Clear cookie
    document.cookie = `${this.CSRF_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

export const csrfService = CSRFService.getInstance();