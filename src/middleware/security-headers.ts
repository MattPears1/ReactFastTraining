/**
 * Security Headers Middleware
 * Implements comprehensive security headers for auth routes
 */

interface SecurityHeaders {
  [key: string]: string;
}

interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-ancestors': string[];
  'form-action': string[];
  'base-uri': string[];
  'object-src': string[];
}

export class SecurityHeadersMiddleware {
  private static instance: SecurityHeadersMiddleware;
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  
  private constructor() {}
  
  static getInstance(): SecurityHeadersMiddleware {
    if (!SecurityHeadersMiddleware.instance) {
      SecurityHeadersMiddleware.instance = new SecurityHeadersMiddleware();
    }
    return SecurityHeadersMiddleware.instance;
  }
  
  /**
   * Apply security headers to response
   */
  applyHeaders(response: Response): Response {
    const headers = this.getSecurityHeaders();
    
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  /**
   * Get all security headers
   */
  private getSecurityHeaders(): SecurityHeaders {
    return {
      // Content Security Policy
      'Content-Security-Policy': this.buildCSP(),
      
      // Prevent XSS attacks
      'X-XSS-Protection': '1; mode=block',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Referrer policy for privacy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy (formerly Feature Policy)
      'Permissions-Policy': this.buildPermissionsPolicy(),
      
      // HSTS for HTTPS enforcement
      'Strict-Transport-Security': this.isDevelopment 
        ? 'max-age=86400' 
        : 'max-age=31536000; includeSubDomains; preload',
      
      // Prevent IE from executing downloads
      'X-Download-Options': 'noopen',
      
      // DNS prefetch control
      'X-DNS-Prefetch-Control': 'on',
      
      // Permitted cross-domain policies
      'X-Permitted-Cross-Domain-Policies': 'none',
    };
  }
  
  /**
   * Build Content Security Policy
   */
  private buildCSP(): string {
    const directives: CSPDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for React
        "'unsafe-eval'", // Remove in production
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      'connect-src': [
        "'self'",
        'https://api.reactfasttraining.co.uk',
        'wss://api.reactfasttraining.co.uk',
        'https://www.google-analytics.com',
      ],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
    };
    
    // Add development sources
    if (this.isDevelopment) {
      directives['script-src'].push('http://localhost:*');
      directives['connect-src'].push('http://localhost:*', 'ws://localhost:*');
    }
    
    // Build CSP string
    return Object.entries(directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }
  
  /**
   * Build Permissions Policy
   */
  private buildPermissionsPolicy(): string {
    const policies = {
      'accelerometer': '()',
      'ambient-light-sensor': '()',
      'autoplay': '(self)',
      'battery': '()',
      'camera': '()',
      'cross-origin-isolated': '()',
      'display-capture': '()',
      'document-domain': '()',
      'encrypted-media': '()',
      'execution-while-not-rendered': '()',
      'execution-while-out-of-viewport': '()',
      'fullscreen': '(self)',
      'geolocation': '()',
      'gyroscope': '()',
      'keyboard-map': '()',
      'magnetometer': '()',
      'microphone': '()',
      'midi': '()',
      'navigation-override': '()',
      'payment': '()',
      'picture-in-picture': '()',
      'publickey-credentials-get': '()',
      'screen-wake-lock': '()',
      'sync-xhr': '()',
      'usb': '()',
      'web-share': '()',
      'xr-spatial-tracking': '()',
    };
    
    return Object.entries(policies)
      .map(([feature, allowlist]) => `${feature}=${allowlist}`)
      .join(', ');
  }
  
  /**
   * Middleware for Express/LoopBack
   */
  expressMiddleware() {
    return (req: any, res: any, next: any) => {
      // Apply security headers
      const headers = this.getSecurityHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Add nonce for inline scripts if needed
      if (req.url.includes('/auth/')) {
        res.locals.nonce = this.generateNonce();
      }
      
      next();
    };
  }
  
  /**
   * Generate CSP nonce
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('base64');
  }
  
  /**
   * Apply auth-specific headers
   */
  applyAuthHeaders(response: Response, options?: {
    allowFraming?: boolean;
    requireHTTPS?: boolean;
  }): Response {
    // Base security headers
    this.applyHeaders(response);
    
    // Auth-specific headers
    if (!options?.allowFraming) {
      response.headers.set('X-Frame-Options', 'DENY');
    }
    
    // Cache control for auth pages
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Additional auth security
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    
    return response;
  }
  
  /**
   * Validate request headers
   */
  validateRequestHeaders(request: Request): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check for required headers
    if (!request.headers.get('User-Agent')) {
      errors.push('Missing User-Agent header');
    }
    
    // Validate content type for POST requests
    if (request.method === 'POST' || request.method === 'PUT') {
      const contentType = request.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        errors.push('Invalid Content-Type for JSON request');
      }
    }
    
    // Check for suspicious headers
    const suspiciousHeaders = [
      'X-Forwarded-Host',
      'X-Original-URL',
      'X-Rewrite-URL',
    ];
    
    suspiciousHeaders.forEach(header => {
      if (request.headers.get(header)) {
        errors.push(`Suspicious header detected: ${header}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * React component wrapper for security headers
   */
  SecureRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    React.useEffect(() => {
      // Apply client-side security measures
      
      // Prevent right-click on auth pages
      const preventRightClick = (e: MouseEvent) => {
        if (window.location.pathname.includes('/auth')) {
          e.preventDefault();
        }
      };
      
      // Prevent text selection on sensitive elements
      const preventSelection = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('sensitive-data')) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('contextmenu', preventRightClick);
      document.addEventListener('selectstart', preventSelection);
      
      return () => {
        document.removeEventListener('contextmenu', preventRightClick);
        document.removeEventListener('selectstart', preventSelection);
      };
    }, []);
    
    return <>{children}</>;
  };
}

// Export singleton instance
export const securityHeaders = SecurityHeadersMiddleware.getInstance();

// Export Express middleware
export const securityHeadersMiddleware = securityHeaders.expressMiddleware();

// Export React component
export const SecureRoute = securityHeaders.SecureRoute;