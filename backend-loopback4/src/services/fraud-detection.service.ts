import { MonitoringService } from './monitoring.service';
import { db } from '../config/database.config';
import { sql } from 'drizzle-orm';
import * as crypto from 'crypto';

export interface TransactionData {
  userId: string;
  email: string;
  amount: number;
  currency: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  cardFingerprint?: string;
  billingCountry?: string;
  shippingCountry?: string;
  metadata?: Record<string, any>;
}

export interface RiskSignal {
  type: string;
  risk: 'low' | 'medium' | 'high';
  score: number;
  reason: string;
}

export interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  signals: RiskSignal[];
  recommendation: string;
  requiresManualReview: boolean;
  blocked: boolean;
}

export interface FraudRule {
  id: string;
  name: string;
  enabled: boolean;
  weight: number;
  check: (data: TransactionData) => Promise<RiskSignal | null>;
}

export class FraudDetectionService {
  private static rules: Map<string, FraudRule> = new Map();
  private static blacklists = {
    emails: new Set<string>(),
    ips: new Set<string>(),
    cards: new Set<string>(),
    devices: new Set<string>(),
  };

  static {
    // Initialize default fraud rules
    this.initializeDefaultRules();
    // Load blacklists from database
    this.loadBlacklists();
  }

  static async analyzeTransaction(data: TransactionData): Promise<RiskScore> {
    const startTime = Date.now();
    
    try {
      // Run all enabled rules in parallel
      const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled);
      const signalPromises = enabledRules.map(rule => 
        rule.check(data).catch(error => {
          MonitoringService.error(`Fraud rule ${rule.name} failed`, error);
          return null;
        })
      );
      
      const signals = (await Promise.all(signalPromises))
        .filter((signal): signal is RiskSignal => signal !== null);
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(signals, enabledRules);
      
      // Log analysis result
      MonitoringService.info('Fraud analysis completed', {
        transactionId: data.metadata?.transactionId,
        score: riskScore.score,
        level: riskScore.level,
        duration: Date.now() - startTime,
      });
      
      // Record metrics
      MonitoringService.recordCounter('fraud_analysis_total', 1, {
        level: riskScore.level,
      });
      
      return riskScore;
    } catch (error) {
      MonitoringService.error('Fraud detection failed', error);
      // Return permissive score on error to avoid blocking legitimate transactions
      return {
        score: 0,
        level: 'low',
        signals: [],
        recommendation: 'Fraud detection error - proceeding with caution',
        requiresManualReview: true,
        blocked: false,
      };
    }
  }

  private static calculateRiskScore(
    signals: RiskSignal[],
    rules: FraudRule[]
  ): RiskScore {
    if (signals.length === 0) {
      return {
        score: 0,
        level: 'low',
        signals: [],
        recommendation: 'No risk signals detected',
        requiresManualReview: false,
        blocked: false,
      };
    }

    // Calculate weighted score
    const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
    const weightedScore = signals.reduce((sum, signal) => {
      const rule = rules.find(r => r.name === signal.type);
      const weight = rule?.weight || 1;
      return sum + (signal.score * weight);
    }, 0) / totalWeight;

    // Determine risk level
    let level: RiskScore['level'];
    let requiresManualReview = false;
    let blocked = false;
    let recommendation: string;

    if (weightedScore >= 80) {
      level = 'critical';
      blocked = true;
      recommendation = 'Transaction blocked due to high fraud risk';
    } else if (weightedScore >= 60) {
      level = 'high';
      requiresManualReview = true;
      recommendation = 'Manual review required before processing';
    } else if (weightedScore >= 40) {
      level = 'medium';
      requiresManualReview = true;
      recommendation = 'Additional verification recommended';
    } else {
      level = 'low';
      recommendation = 'Transaction appears legitimate';
    }

    // Check for immediate block signals
    const hasBlockingSignal = signals.some(s => s.score >= 90);
    if (hasBlockingSignal) {
      blocked = true;
      level = 'critical';
      recommendation = 'Transaction blocked due to critical risk signal';
    }

    return {
      score: Math.round(weightedScore),
      level,
      signals,
      recommendation,
      requiresManualReview,
      blocked,
    };
  }

  private static initializeDefaultRules() {
    // Velocity check
    this.addRule({
      id: 'velocity',
      name: 'Transaction Velocity',
      enabled: true,
      weight: 2,
      check: async (data) => {
        const recentTransactions = await this.getRecentTransactions(data.userId, 3600); // 1 hour
        
        if (recentTransactions.length >= 10) {
          return {
            type: 'velocity',
            risk: 'high',
            score: 80,
            reason: `${recentTransactions.length} transactions in the last hour`,
          };
        } else if (recentTransactions.length >= 5) {
          return {
            type: 'velocity',
            risk: 'medium',
            score: 50,
            reason: `${recentTransactions.length} transactions in the last hour`,
          };
        }
        
        return null;
      },
    });

    // Amount anomaly detection
    this.addRule({
      id: 'amount_anomaly',
      name: 'Amount Anomaly',
      enabled: true,
      weight: 3,
      check: async (data) => {
        const avgAmount = await this.getUserAverageTransactionAmount(data.userId);
        
        if (avgAmount > 0) {
          const deviation = Math.abs(data.amount - avgAmount) / avgAmount;
          
          if (deviation > 5) {
            return {
              type: 'amount_anomaly',
              risk: 'high',
              score: 70,
              reason: `Amount is ${deviation.toFixed(1)}x the user's average`,
            };
          } else if (deviation > 3) {
            return {
              type: 'amount_anomaly',
              risk: 'medium',
              score: 40,
              reason: `Amount is ${deviation.toFixed(1)}x the user's average`,
            };
          }
        }
        
        // High amount for new user
        if (!avgAmount && data.amount > 50000) { // £500
          return {
            type: 'amount_anomaly',
            risk: 'high',
            score: 60,
            reason: 'High amount for first transaction',
          };
        }
        
        return null;
      },
    });

    // Geolocation check
    this.addRule({
      id: 'geolocation',
      name: 'Geolocation Risk',
      enabled: true,
      weight: 2,
      check: async (data) => {
        if (data.billingCountry && data.shippingCountry) {
          if (data.billingCountry !== data.shippingCountry) {
            return {
              type: 'geolocation',
              risk: 'medium',
              score: 40,
              reason: 'Billing and shipping countries differ',
            };
          }
        }
        
        // Check for high-risk countries
        const highRiskCountries = ['NG', 'PK', 'ID', 'BD', 'VN'];
        if (data.billingCountry && highRiskCountries.includes(data.billingCountry)) {
          return {
            type: 'geolocation',
            risk: 'high',
            score: 60,
            reason: 'Transaction from high-risk country',
          };
        }
        
        return null;
      },
    });

    // Blacklist check
    this.addRule({
      id: 'blacklist',
      name: 'Blacklist Check',
      enabled: true,
      weight: 5,
      check: async (data) => {
        const checks = [
          { type: 'email', value: data.email, list: this.blacklists.emails },
          { type: 'ip', value: data.ipAddress, list: this.blacklists.ips },
          { type: 'card', value: data.cardFingerprint, list: this.blacklists.cards },
          { type: 'device', value: data.deviceId, list: this.blacklists.devices },
        ];
        
        for (const check of checks) {
          if (check.value && check.list.has(check.value)) {
            return {
              type: 'blacklist',
              risk: 'high',
              score: 90,
              reason: `${check.type} is blacklisted`,
            };
          }
        }
        
        return null;
      },
    });

    // Email pattern check
    this.addRule({
      id: 'email_pattern',
      name: 'Email Pattern',
      enabled: true,
      weight: 1,
      check: async (data) => {
        const email = data.email.toLowerCase();
        
        // Disposable email domains
        const disposableDomains = [
          'tempmail.com', 'throwaway.email', '10minutemail.com',
          'guerrillamail.com', 'maildrop.cc', 'trashmail.com',
        ];
        
        const domain = email.split('@')[1];
        if (disposableDomains.includes(domain)) {
          return {
            type: 'email_pattern',
            risk: 'high',
            score: 70,
            reason: 'Disposable email address detected',
          };
        }
        
        // Suspicious patterns
        if (/\d{5,}/.test(email.split('@')[0])) {
          return {
            type: 'email_pattern',
            risk: 'medium',
            score: 30,
            reason: 'Suspicious email pattern',
          };
        }
        
        return null;
      },
    });

    // Device fingerprint check
    this.addRule({
      id: 'device_fingerprint',
      name: 'Device Analysis',
      enabled: true,
      weight: 2,
      check: async (data) => {
        if (!data.deviceId) return null;
        
        // Check device usage across multiple accounts
        const deviceUsage = await this.getDeviceUsage(data.deviceId);
        
        if (deviceUsage.userCount > 5) {
          return {
            type: 'device_fingerprint',
            risk: 'high',
            score: 70,
            reason: `Device used by ${deviceUsage.userCount} different users`,
          };
        } else if (deviceUsage.userCount > 2) {
          return {
            type: 'device_fingerprint',
            risk: 'medium',
            score: 40,
            reason: `Device used by ${deviceUsage.userCount} different users`,
          };
        }
        
        return null;
      },
    });

    // Time-based patterns
    this.addRule({
      id: 'time_pattern',
      name: 'Time Pattern Analysis',
      enabled: true,
      weight: 1,
      check: async (data) => {
        const hour = new Date().getHours();
        
        // Unusual hours (2 AM - 5 AM)
        if (hour >= 2 && hour <= 5) {
          return {
            type: 'time_pattern',
            risk: 'low',
            score: 20,
            reason: 'Transaction during unusual hours',
          };
        }
        
        return null;
      },
    });
  }

  static addRule(rule: FraudRule) {
    this.rules.set(rule.id, rule);
  }

  static enableRule(ruleId: string) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  static disableRule(ruleId: string) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  static async addToBlacklist(
    type: 'email' | 'ip' | 'card' | 'device',
    value: string,
    reason: string
  ) {
    this.blacklists[type + 's' as keyof typeof this.blacklists].add(value);
    
    // Persist to database
    await db.insert('fraud_blacklist').values({
      type,
      value,
      reason,
      addedAt: new Date(),
    });
    
    MonitoringService.logSecurityEvent({
      type: 'blacklist_addition',
      details: `Added ${type} to blacklist: ${value}`,
      severity: 'high',
      metadata: { type, value, reason },
    });
  }

  static async removeFromBlacklist(
    type: 'email' | 'ip' | 'card' | 'device',
    value: string
  ) {
    this.blacklists[type + 's' as keyof typeof this.blacklists].delete(value);
    
    // Remove from database
    await db.delete('fraud_blacklist')
      .where(sql`type = ${type} AND value = ${value}`);
    
    MonitoringService.info('Removed from blacklist', { type, value });
  }

  private static async loadBlacklists() {
    try {
      const blacklistEntries = await db
        .select()
        .from('fraud_blacklist')
        .where(sql`active = true`);
      
      for (const entry of blacklistEntries) {
        const listKey = entry.type + 's' as keyof typeof this.blacklists;
        if (listKey in this.blacklists) {
          this.blacklists[listKey].add(entry.value);
        }
      }
      
      MonitoringService.info('Blacklists loaded', {
        emails: this.blacklists.emails.size,
        ips: this.blacklists.ips.size,
        cards: this.blacklists.cards.size,
        devices: this.blacklists.devices.size,
      });
    } catch (error) {
      MonitoringService.error('Failed to load blacklists', error);
    }
  }

  private static async getRecentTransactions(
    userId: string,
    secondsAgo: number
  ): Promise<any[]> {
    const since = new Date(Date.now() - secondsAgo * 1000);
    
    return db
      .select()
      .from('payments')
      .where(sql`
        customer_id = ${userId} 
        AND created_at >= ${since}
        AND status IN ('succeeded', 'processing')
      `)
      .orderBy(sql`created_at DESC`);
  }

  private static async getUserAverageTransactionAmount(
    userId: string
  ): Promise<number> {
    const result = await db
      .select({
        avg: sql<number>`AVG(amount)`,
      })
      .from('payments')
      .where(sql`
        customer_id = ${userId}
        AND status = 'succeeded'
        AND created_at >= ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
      `);
    
    return result[0]?.avg || 0;
  }

  private static async getDeviceUsage(
    deviceId: string
  ): Promise<{ userCount: number; transactionCount: number }> {
    const result = await db
      .select({
        userCount: sql<number>`COUNT(DISTINCT customer_id)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from('payments')
      .where(sql`
        metadata->>'deviceId' = ${deviceId}
        AND created_at >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      `);
    
    return {
      userCount: result[0]?.userCount || 0,
      transactionCount: result[0]?.transactionCount || 0,
    };
  }

  static generateDeviceFingerprint(data: {
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
  }): string {
    const fingerprint = [
      data.userAgent || '',
      data.screenResolution || '',
      data.timezone || '',
      data.language || '',
      data.platform || '',
    ].join('|');
    
    return crypto
      .createHash('sha256')
      .update(fingerprint)
      .digest('hex')
      .substring(0, 16);
  }

  static async recordFraudAttempt(data: {
    transactionId: string;
    userId: string;
    riskScore: RiskScore;
    blocked: boolean;
  }) {
    await db.insert('fraud_attempts').values({
      transactionId: data.transactionId,
      userId: data.userId,
      riskScore: data.riskScore.score,
      riskLevel: data.riskScore.level,
      signals: JSON.stringify(data.riskScore.signals),
      blocked: data.blocked,
      createdAt: new Date(),
    });
    
    if (data.blocked) {
      MonitoringService.logSecurityEvent({
        type: 'fraud_blocked',
        details: `Blocked transaction due to fraud risk`,
        severity: 'high',
        metadata: {
          transactionId: data.transactionId,
          score: data.riskScore.score,
          signals: data.riskScore.signals.map(s => s.type),
        },
      });
    }
  }
}