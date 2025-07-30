import { Service } from 'typedi';
import {
  IAnalyticsEvent,
  IPageView,
  IUserBehavior,
  IConversion,
  IAnalyticsReport,
  IReportOptions,
  EventCategory,
  ConversionType,
} from '../../interfaces/analytics.interface';
import { AnalyticsStore } from './analytics.store';
import { AnalyticsProcessor } from './analytics.processor';
import { PrivacyManager } from './privacy.manager';
import { GoogleAnalyticsProvider } from './providers/google-analytics.provider';
import { InternalAnalyticsProvider } from './providers/internal-analytics.provider';
import { servicesConfig } from '../../config/services.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class AnalyticsService {
  private store: AnalyticsStore;
  private processor: AnalyticsProcessor;
  private privacyManager: PrivacyManager;
  private providers: Map<string, any> = new Map();

  constructor() {
    this.store = new AnalyticsStore();
    this.processor = new AnalyticsProcessor();
    this.privacyManager = new PrivacyManager();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const { providers } = servicesConfig.analytics;

    if (providers.internal.enabled) {
      this.providers.set('internal', new InternalAnalyticsProvider());
    }

    if (providers.googleAnalytics.enabled) {
      this.providers.set('google', new GoogleAnalyticsProvider(providers.googleAnalytics));
    }
  }

  async track(event: Partial<IAnalyticsEvent>): Promise<void> {
    try {
      if (!this.privacyManager.shouldTrack(event)) {
        return;
      }

      const processedEvent: IAnalyticsEvent = {
        id: uuidv4(),
        sessionId: event.sessionId || this.generateSessionId(),
        event: event.event || 'unknown',
        category: event.category || EventCategory.CUSTOM,
        timestamp: new Date(),
        ...event,
      };

      processedEvent.ipAddress = this.privacyManager.anonymizeIp(processedEvent.ipAddress);
      processedEvent.device = await this.processor.parseUserAgent(processedEvent.userAgent);
      processedEvent.location = await this.processor.getLocationFromIp(processedEvent.ipAddress);

      await this.store.saveEvent(processedEvent);

      for (const [name, provider] of this.providers) {
        try {
          await provider.track(processedEvent);
        } catch (error) {
          logger.error(`Failed to track event with ${name} provider`, { error, event: processedEvent });
        }
      }
    } catch (error) {
      logger.error('Failed to track analytics event', { error, event });
    }
  }

  async pageView(pageView: IPageView, sessionId: string, userId?: string): Promise<void> {
    const event: Partial<IAnalyticsEvent> = {
      userId,
      sessionId,
      event: 'page_view',
      category: EventCategory.PAGE_VIEW,
      properties: pageView,
      url: pageView.url,
      referrer: pageView.referrer,
    };

    await this.track(event);

    for (const [, provider] of this.providers) {
      if (provider.page) {
        await provider.page(pageView);
      }
    }
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    try {
      await this.store.saveUserTraits(userId, traits);

      for (const [, provider] of this.providers) {
        if (provider.identify) {
          await provider.identify(userId, traits);
        }
      }
    } catch (error) {
      logger.error('Failed to identify user', { error, userId });
    }
  }

  async trackConversion(conversion: Omit<IConversion, 'id' | 'timestamp'>): Promise<void> {
    const conversionEvent: IConversion = {
      id: uuidv4(),
      timestamp: new Date(),
      ...conversion,
    };

    await this.store.saveConversion(conversionEvent);

    const event: Partial<IAnalyticsEvent> = {
      userId: conversion.userId,
      sessionId: conversion.sessionId,
      event: `conversion_${conversion.type}`,
      category: EventCategory.CONVERSION,
      properties: conversionEvent,
    };

    await this.track(event);
  }

  async getUserBehavior(userId: string): Promise<IUserBehavior | null> {
    try {
      const events = await this.store.getUserEvents(userId);
      const sessions = await this.store.getUserSessions(userId);

      if (events.length === 0) {
        return null;
      }

      const behavior = this.processor.analyzeUserBehavior(events, sessions);
      return behavior;
    } catch (error) {
      logger.error('Failed to get user behavior', { error, userId });
      return null;
    }
  }

  async getReport(options: IReportOptions): Promise<IAnalyticsReport> {
    try {
      const events = await this.store.getEvents(options.period);
      const report = this.processor.generateReport(events, options);
      return report;
    } catch (error) {
      logger.error('Failed to generate analytics report', { error, options });
      throw error;
    }
  }

  async getRealtimeUsers(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeSessions = await this.store.getActiveSessions(fiveMinutesAgo);
    return activeSessions.length;
  }

  async getTopPages(limit: number = 10): Promise<IPageView[]> {
    return this.store.getTopPages(limit);
  }

  async getConversionFunnel(steps: string[]): Promise<any> {
    const funnel = await this.processor.analyzeFunnel(steps);
    return funnel;
  }

  async trackError(error: Error, userId?: string, sessionId?: string): Promise<void> {
    const event: Partial<IAnalyticsEvent> = {
      userId,
      sessionId: sessionId || this.generateSessionId(),
      event: 'error',
      category: EventCategory.ERROR,
      properties: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    };

    await this.track(event);
  }

  async setUserConsent(userId: string, consent: Record<string, boolean>): Promise<void> {
    await this.privacyManager.setUserConsent(userId, consent);
  }

  async deleteUserData(userId: string): Promise<void> {
    await this.store.deleteUserData(userId);
    
    for (const [, provider] of this.providers) {
      if (provider.deleteUserData) {
        await provider.deleteUserData(userId);
      }
    }
  }

  async exportUserData(userId: string): Promise<any> {
    const events = await this.store.getUserEvents(userId);
    const traits = await this.store.getUserTraits(userId);
    const conversions = await this.store.getUserConversions(userId);

    return {
      userId,
      events,
      traits,
      conversions,
      exportedAt: new Date(),
    };
  }

  private generateSessionId(): string {
    return uuidv4();
  }

  async cleanup(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    return this.store.cleanup(cutoffDate);
  }

  async getMetrics(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [todayEvents, yesterdayEvents, totalEvents] = await Promise.all([
      this.store.getEventCount(today, now),
      this.store.getEventCount(yesterday, today),
      this.store.getTotalEventCount(),
    ]);

    return {
      today: todayEvents,
      yesterday: yesterdayEvents,
      total: totalEvents,
      realtimeUsers: await this.getRealtimeUsers(),
    };
  }
}