import { HttpErrors } from '@loopback/rest';
import * as crypto from 'crypto';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { db } from '../../config/database.config';
import { paymentLogs, PaymentEventType } from '../../db/schema';
import { z } from 'zod';

// Security configuration
interface SecurityConfig {
  maxPaymentAmount: number;
  minPaymentAmount: number;
  suspiciousPatterns: RegExp[];
  blockedCountries: string[];
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

// Fraud detection rules
interface FraudRule {
  name: string;
  weight: number;
  check: (data: any) => Promise<boolean>;
}

export class PaymentSecurityService {
  private static rateLimiters = new Map<string, RateLimiterMemory>();
  
  private static readonly securityConfig: SecurityConfig = {
    maxPaymentAmount: 5000, // £5000 max per transaction
    minPaymentAmount: 1, // £1 minimum
    suspiciousPatterns: [
      /test/i,
      /hack/i,
      /script/i,
      /<[^>]*>/g, // HTML tags
      /[';]--/g, // SQL injection patterns
    ],
    blockedCountries: ['XX'], // Add sanctioned countries
    riskThresholds: {
      low: 30,
      medium: 60,
      high: 80,
    },
  };

  private static readonly fraudRules: FraudRule[] = [
    {
      name: 'velocity_check',
      weight: 30,
      check: async (data) => {
        // Check if user has made multiple payments in short time
        const recentPayments = await db.execute(`
          SELECT COUNT(*) as count
          FROM payments p
          JOIN bookings b ON p.booking_id = b.id
          WHERE b.user_id = $1
          AND p.created_at > NOW() - INTERVAL '1 hour'
          AND p.status = 'succeeded'
        `, [data.userId]);
        
        return recentPayments.rows[0].count > 3;
      },
    },
    {
      name: 'amount_anomaly',
      weight: 20,
      check: async (data) => {
        // Check if amount is significantly different from user's average
        const avgAmount = await db.execute(`
          SELECT AVG(CAST(amount AS DECIMAL)) as avg_amount
          FROM payments p
          JOIN bookings b ON p.booking_id = b.id
          WHERE b.user_id = $1
          AND p.status = 'succeeded'
        `, [data.userId]);
        
        const avg = avgAmount.rows[0].avg_amount || 0;
        if (avg === 0) return false;
        
        const deviation = Math.abs(data.amount - avg) / avg;
        return deviation > 3; // 300% deviation
      },
    },
    {
      name: 'new_user_high_amount',
      weight: 25,
      check: async (data) => {
        // Check if new user making high-value transaction
        const userAge = await db.execute(`
          SELECT created_at
          FROM users
          WHERE id = $1
        `, [data.userId]);
        
        const accountAge = Date.now() - new Date(userAge.rows[0].created_at).getTime();
        const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
        
        return daysSinceCreation < 7 && data.amount > 500;
      },
    },
    {
      name: 'suspicious_email',
      weight: 15,
      check: async (data) => {
        // Check for suspicious email patterns
        const suspiciousPatterns = [
          /\+\d{5,}/,  // Multiple numbers after +
          /test/i,
          /temp/i,
          /disposable/i,
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(data.email));
      },
    },
    {
      name: 'ip_country_mismatch',
      weight: 10,
      check: async (data) => {
        // Check if IP country matches user's registered country
        // This would require IP geolocation service
        // For now, return false
        return false;
      },
    },
  ];

  /**
   * Initialize rate limiters
   */
  static initialize(): void {
    // Per-user rate limiter
    this.rateLimiters.set('user', new RateLimiterMemory({
      points: 10, // 10 requests
      duration: 60 * 60, // per hour
      blockDuration: 60 * 60, // block for 1 hour
    }));

    // Per-IP rate limiter
    this.rateLimiters.set('ip', new RateLimiterMemory({
      points: 20, // 20 requests
      duration: 60 * 60, // per hour
      blockDuration: 60 * 60, // block for 1 hour
    }));

    // Global rate limiter
    this.rateLimiters.set('global', new RateLimiterMemory({
      points: 1000, // 1000 requests
      duration: 60, // per minute
      blockDuration: 60 * 5, // block for 5 minutes
    }));
  }

  /**
   * Check rate limits
   */
  static async checkRateLimit(
    userId: string,
    ipAddress: string
  ): Promise<void> {
    try {
      // Check user rate limit
      const userLimiter = this.rateLimiters.get('user')!;
      await userLimiter.consume(userId);

      // Check IP rate limit
      const ipLimiter = this.rateLimiters.get('ip')!;
      await ipLimiter.consume(ipAddress);

      // Check global rate limit
      const globalLimiter = this.rateLimiters.get('global')!;
      await globalLimiter.consume('global');
    } catch (rateLimiterRes) {
      const res = rateLimiterRes as RateLimiterRes;
      const secondsUntilReset = Math.round(res.msBeforeNext / 1000) || 60;
      
      throw new HttpErrors.TooManyRequests(
        `Rate limit exceeded. Try again in ${secondsUntilReset} seconds`
      );
    }
  }

  /**
   * Validate payment data with enhanced security checks
   */
  static async validatePaymentData(data: {
    amount: number;
    bookingId: string;
    userId: string;
    email: string;
    metadata?: any;
  }): Promise<void> {
    // Amount validation
    if (data.amount < this.securityConfig.minPaymentAmount) {
      throw new HttpErrors.BadRequest(
        `Payment amount must be at least £${this.securityConfig.minPaymentAmount}`
      );
    }

    if (data.amount > this.securityConfig.maxPaymentAmount) {
      throw new HttpErrors.BadRequest(
        `Payment amount exceeds maximum limit of £${this.securityConfig.maxPaymentAmount}`
      );
    }

    // Check for suspicious patterns in metadata
    if (data.metadata) {
      const metadataString = JSON.stringify(data.metadata);
      for (const pattern of this.securityConfig.suspiciousPatterns) {
        if (pattern.test(metadataString)) {
          await this.logSecurityEvent('suspicious_pattern_detected', data);
          throw new HttpErrors.BadRequest('Invalid data detected');
        }
      }
    }

    // Validate email format strictly
    const emailSchema = z.string().email().toLowerCase();
    try {
      emailSchema.parse(data.email);
    } catch (error) {
      throw new HttpErrors.BadRequest('Invalid email format');
    }
  }

  /**
   * Calculate fraud risk score
   */
  static async calculateRiskScore(data: {
    amount: number;
    userId: string;
    email: string;
    ipAddress: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    triggeredRules: string[];
    recommendation: 'allow' | 'review' | 'block';
  }> {
    let totalScore = 0;
    const triggeredRules: string[] = [];

    // Run all fraud rules
    for (const rule of this.fraudRules) {
      try {
        const triggered = await rule.check(data);
        if (triggered) {
          totalScore += rule.weight;
          triggeredRules.push(rule.name);
        }
      } catch (error) {
        console.error(`Fraud rule ${rule.name} failed:`, error);
        // Continue with other rules
      }
    }

    // Additional checks
    // Check if IP is from TOR/VPN (would require external service)
    // Check device fingerprint (would require client-side integration)
    
    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'critical';
    let recommendation: 'allow' | 'review' | 'block';

    if (totalScore >= 90) {
      level = 'critical';
      recommendation = 'block';
    } else if (totalScore >= this.securityConfig.riskThresholds.high) {
      level = 'high';
      recommendation = 'review';
    } else if (totalScore >= this.securityConfig.riskThresholds.medium) {
      level = 'medium';
      recommendation = 'review';
    } else if (totalScore >= this.securityConfig.riskThresholds.low) {
      level = 'low';
      recommendation = 'allow';
    } else {
      level = 'low';
      recommendation = 'allow';
    }

    // Log risk assessment
    await this.logSecurityEvent('risk_assessment', {
      ...data,
      riskScore: totalScore,
      riskLevel: level,
      triggeredRules,
      recommendation,
    });

    return {
      score: totalScore,
      level,
      triggeredRules,
      recommendation,
    };
  }

  /**
   * Encrypt sensitive data
   */
  static encryptSensitiveData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decryptSensitiveData(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate secure tokens
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data (one-way)
   */
  static hashData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data + (process.env.HASH_SALT || ''))
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    // Remove potential XSS
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Remove potential SQL injection
    sanitized = sanitized.replace(/['";\\]/g, '');
    
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }

  /**
   * Check IP reputation (placeholder - would integrate with external service)
   */
  static async checkIPReputation(ipAddress: string): Promise<{
    reputation: 'good' | 'suspicious' | 'bad';
    isVPN: boolean;
    isTOR: boolean;
    country?: string;
  }> {
    // In production, integrate with services like:
    // - IPQualityScore
    // - MaxMind
    // - AbuseIPDB
    
    // For now, return default safe values
    return {
      reputation: 'good',
      isVPN: false,
      isTOR: false,
      country: 'GB',
    };
  }

  /**
   * Log security events
   */
  private static async logSecurityEvent(
    eventType: string,
    data: any
  ): Promise<void> {
    try {
      await db.insert(paymentLogs).values({
        eventType: `security.${eventType}`,
        eventSource: 'security_service',
        eventData: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Validate card details (basic validation only - Stripe handles full validation)
   */
  static validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Check if only digits
    if (!/^\d+$/.test(cleaned)) {
      return false;
    }
    
    // Check length (most cards are 13-19 digits)
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }
    
    // Luhn algorithm validation
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Create security audit trail
   */
  static async createAuditTrail(data: {
    action: string;
    userId: string;
    resourceId: string;
    resourceType: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await db.insert(paymentLogs).values({
      eventType: `audit.${data.action}`,
      eventSource: 'security_audit',
      eventData: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }
}

// Initialize on module load
PaymentSecurityService.initialize();