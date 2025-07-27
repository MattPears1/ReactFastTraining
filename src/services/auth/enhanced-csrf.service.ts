import crypto from 'crypto';

/**
 * Enhanced CSRF protection with double-submit cookie pattern
 * and synchronized token pattern support
 */
export class EnhancedCSRFService {
  private static instance: EnhancedCSRFService;
  private csrfToken: string | null = null;
  private csrfSecret: string | null = null;
  private tokenRotationInterval: number = 3600000; // 1 hour
  private lastRotation: number = Date.now();
  
  private constructor() {
    // Initialize with a token
    this.regenerateToken();
    
    // Set up automatic token rotation
    this.setupTokenRotation();
  }
  
  static getInstance(): EnhancedCSRFService {
    if (!EnhancedCSRFService.instance) {
      EnhancedCSRFService.instance = new EnhancedCSRFService();
    }
    return EnhancedCSRFService.instance;
  }
  
  /**
   * Generate a new CSRF token with cryptographic security
   */
  regenerateToken(): void {
    // Generate secret
    this.csrfSecret = crypto.randomBytes(32).toString('base64');
    
    // Generate token with timestamp to prevent replay attacks
    const timestamp = Date.now();
    const payload = `${this.csrfSecret}:${timestamp}`;
    const hash = crypto
      .createHmac('sha256', process.env.CSRF_SECRET || 'default-csrf-secret')
      .update(payload)
      .digest('base64');
    
    this.csrfToken = `${timestamp}.${hash}`;
    this.lastRotation = timestamp;
    
    // Store in secure cookie
    this.setSecureCookie();
  }
  
  /**
   * Validate CSRF token with timing attack protection
   */
  validateToken(token: string): boolean {
    if (!token || !this.csrfToken) return false;
    
    try {
      const [timestamp, hash] = token.split('.');
      const tokenAge = Date.now() - parseInt(timestamp);
      
      // Check token age (max 1 hour)
      if (tokenAge > this.tokenRotationInterval) {
        return false;
      }
      
      // Recreate hash and compare with timing-safe comparison
      const payload = `${this.csrfSecret}:${timestamp}`;
      const expectedHash = crypto
        .createHmac('sha256', process.env.CSRF_SECRET || 'default-csrf-secret')
        .update(payload)
        .digest('base64');
      
      return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(expectedHash)
      );
    } catch {
      return false;
    }
  }
  
  /**
   * Get current CSRF token for forms
   */
  getToken(): string | null {
    // Check if token needs rotation
    if (Date.now() - this.lastRotation > this.tokenRotationInterval) {
      this.regenerateToken();
    }
    return this.csrfToken;
  }
  
  /**
   * Clear CSRF token on logout
   */
  clearToken(): void {
    this.csrfToken = null;
    this.csrfSecret = null;
    this.clearSecureCookie();
  }
  
  /**
   * Set secure CSRF cookie with proper flags
   */
  private setSecureCookie(): void {
    if (typeof document !== 'undefined') {
      const secure = window.location.protocol === 'https:';
      const sameSite = 'strict';
      const expires = new Date(Date.now() + this.tokenRotationInterval);
      
      document.cookie = [
        `csrf-token=${this.csrfToken}`,
        `expires=${expires.toUTCString()}`,
        'path=/',
        secure ? 'secure' : '',
        'httpOnly',
        `samesite=${sameSite}`
      ].filter(Boolean).join('; ');
    }
  }
  
  /**
   * Clear CSRF cookie
   */
  private clearSecureCookie(): void {
    if (typeof document !== 'undefined') {
      document.cookie = 'csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }
  
  /**
   * Set up automatic token rotation
   */
  private setupTokenRotation(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.csrfToken) {
          this.regenerateToken();
          // Notify application of token rotation
          window.dispatchEvent(new CustomEvent('csrf:token-rotated'));
        }
      }, this.tokenRotationInterval);
    }
  }
  
  /**
   * Generate CSRF meta tag for SPA
   */
  generateMetaTag(): string {
    return `<meta name="csrf-token" content="${this.csrfToken}">`;
  }
  
  /**
   * Middleware helper for axios
   */
  axiosInterceptor() {
    return (config: any) => {
      const token = this.getToken();
      if (token && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
        config.headers['X-CSRF-Token'] = token;
      }
      return config;
    };
  }
}

export const enhancedCsrfService = EnhancedCSRFService.getInstance();