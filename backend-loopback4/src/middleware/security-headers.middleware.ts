import { Middleware, MiddlewareContext } from '@loopback/rest';
import crypto from 'crypto';

/**
 * Enhanced security headers middleware for production
 */
export const securityHeadersMiddleware: Middleware = async (
  ctx: MiddlewareContext,
  next: () => Promise<unknown>
) => {
  const { response } = ctx;
  
  // Generate nonce for inline scripts
  const nonce = crypto.randomBytes(16).toString('base64');
  ctx.bind('csp.nonce').to(nonce);
  
  // Content Security Policy
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: https: blob:`,
    `connect-src 'self' https://api.stripe.com https://www.google-analytics.com wss://*.reactfasttraining.co.uk`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
    `block-all-mixed-content`,
    `report-uri /api/security/csp-report`
  ].join('; ');
  
  response.setHeader('Content-Security-Policy', cspDirectives);
  
  // Strict Transport Security
  response.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Additional Security Headers
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-XSS-Protection', '1; mode=block');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=*, usb=()'
  );
  
  // Remove sensitive headers
  response.removeHeader('X-Powered-By');
  response.removeHeader('Server');
  
  await next();
};

/**
 * Subresource Integrity generator for static assets
 */
export class SubresourceIntegrityService {
  private static cache = new Map<string, string>();
  
  static generateHash(content: string): string {
    const cached = this.cache.get(content);
    if (cached) return cached;
    
    const hash = crypto
      .createHash('sha384')
      .update(content, 'utf8')
      .digest('base64');
    
    const sri = `sha384-${hash}`;
    this.cache.set(content, sri);
    
    return sri;
  }
  
  static injectSRI(html: string): string {
    // Inject SRI for script tags
    html = html.replace(
      /<script([^>]*?)src="([^"]+)"([^>]*?)>/g,
      (match, before, src, after) => {
        if (src.startsWith('/') || src.startsWith('./')) {
          // Generate SRI for local scripts
          const sri = this.generateHash(src);
          return `<script${before}src="${src}" integrity="${sri}" crossorigin="anonymous"${after}>`;
        }
        return match;
      }
    );
    
    // Inject SRI for link tags
    html = html.replace(
      /<link([^>]*?)href="([^"]+\.css)"([^>]*?)>/g,
      (match, before, href, after) => {
        if (href.startsWith('/') || href.startsWith('./')) {
          const sri = this.generateHash(href);
          return `<link${before}href="${href}" integrity="${sri}" crossorigin="anonymous"${after}>`;
        }
        return match;
      }
    );
    
    return html;
  }
}