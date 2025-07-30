import { IAnalyticsEvent } from '../../interfaces/analytics.interface';
import { servicesConfig } from '../../config/services.config';
import { logger } from '../../utils/logger';

export class PrivacyManager {
  private userConsents: Map<string, Record<string, boolean>> = new Map();

  shouldTrack(event: Partial<IAnalyticsEvent>): boolean {
    const privacyConfig = servicesConfig.analytics.privacy;

    if (privacyConfig.respectDoNotTrack && this.hasDoNotTrack()) {
      return false;
    }

    if (privacyConfig.cookieConsent && event.userId) {
      const consent = this.userConsents.get(event.userId);
      if (!consent?.analytics) {
        return false;
      }
    }

    if (this.isBot(event.userAgent)) {
      return false;
    }

    return true;
  }

  anonymizeIp(ipAddress?: string): string | undefined {
    if (!ipAddress || !servicesConfig.analytics.privacy.anonymizeIp) {
      return ipAddress;
    }

    try {
      if (ipAddress.includes(':')) {
        const parts = ipAddress.split(':');
        return parts.slice(0, 4).join(':') + '::';
      } else {
        const parts = ipAddress.split('.');
        parts[3] = '0';
        return parts.join('.');
      }
    } catch (error) {
      logger.error('Failed to anonymize IP address', { error, ipAddress });
      return ipAddress;
    }
  }

  private hasDoNotTrack(): boolean {
    if (typeof window !== 'undefined' && window.navigator) {
      return window.navigator.doNotTrack === '1' ||
             (window as any).doNotTrack === '1' ||
             window.navigator.doNotTrack === 'yes';
    }
    return false;
  }

  private isBot(userAgent?: string): boolean {
    if (!userAgent) return false;

    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
      /whatsapp/i,
      /slackbot/i,
      /telegrambot/i,
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  async setUserConsent(userId: string, consent: Record<string, boolean>): Promise<void> {
    this.userConsents.set(userId, consent);
  }

  getUserConsent(userId: string): Record<string, boolean> | undefined {
    return this.userConsents.get(userId);
  }

  removePersonalData(event: IAnalyticsEvent): Partial<IAnalyticsEvent> {
    const sanitized: Partial<IAnalyticsEvent> = { ...event };

    delete sanitized.userId;
    delete sanitized.ipAddress;
    delete sanitized.userAgent;

    if (sanitized.properties) {
      delete sanitized.properties.email;
      delete sanitized.properties.phone;
      delete sanitized.properties.name;
      delete sanitized.properties.address;
    }

    if (sanitized.location) {
      delete sanitized.location.city;
      delete sanitized.location.postalCode;
      delete sanitized.location.latitude;
      delete sanitized.location.longitude;
    }

    return sanitized;
  }

  hashUserId(userId: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(userId).digest('hex');
  }

  isDataRetentionExpired(timestamp: Date): boolean {
    const retentionDays = servicesConfig.analytics.privacy.dataRetention;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    return timestamp < cutoffDate;
  }

  sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      const sensitiveParams = [
        'email', 'token', 'key', 'password', 'secret',
        'api_key', 'access_token', 'refresh_token',
        'session', 'auth', 'credit_card', 'ssn',
      ];

      sensitiveParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  sanitizeEvent(event: IAnalyticsEvent): IAnalyticsEvent {
    const sanitized = { ...event };

    if (sanitized.url) {
      sanitized.url = this.sanitizeUrl(sanitized.url);
    }

    if (sanitized.referrer) {
      sanitized.referrer = this.sanitizeUrl(sanitized.referrer);
    }

    if (sanitized.properties) {
      sanitized.properties = this.sanitizeProperties(sanitized.properties);
    }

    return sanitized;
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized = { ...properties };
    const sensitiveKeys = [
      'password', 'credit_card', 'ssn', 'secret',
      'token', 'api_key', 'private_key',
    ];

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}