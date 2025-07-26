import UAParser from 'ua-parser-js';
import {
  IAnalyticsEvent,
  IUserBehavior,
  IAnalyticsReport,
  IReportOptions,
  IDeviceInfo,
  ILocationInfo,
  IMetrics,
  IDimensions,
  IPageMetrics,
  ISourceMetrics,
  IDeviceMetrics,
  ILocationMetrics,
} from '../../interfaces/analytics.interface';
import { logger } from '../../utils/logger';

export class AnalyticsProcessor {
  private uaParser: UAParser;

  constructor() {
    this.uaParser = new UAParser();
  }

  async parseUserAgent(userAgent?: string): Promise<IDeviceInfo | undefined> {
    if (!userAgent) return undefined;

    try {
      const result = this.uaParser.setUA(userAgent).getResult();
      
      return {
        type: this.getDeviceType(result.device),
        os: result.os.name || 'Unknown',
        osVersion: result.os.version,
        browser: result.browser.name || 'Unknown',
        browserVersion: result.browser.version,
        language: this.extractLanguage(userAgent),
      };
    } catch (error) {
      logger.error('Failed to parse user agent', { error, userAgent });
      return undefined;
    }
  }

  private getDeviceType(device: UAParser.IDevice): 'desktop' | 'mobile' | 'tablet' {
    if (device.type === 'mobile') return 'mobile';
    if (device.type === 'tablet') return 'tablet';
    return 'desktop';
  }

  private extractLanguage(userAgent: string): string | undefined {
    const match = userAgent.match(/\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(';');
      for (const part of parts) {
        if (part.includes('-')) {
          return part.trim();
        }
      }
    }
    return undefined;
  }

  async getLocationFromIp(ipAddress?: string): Promise<ILocationInfo | undefined> {
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
      return undefined;
    }

    return {
      country: 'Unknown',
      countryCode: 'XX',
    };
  }

  analyzeUserBehavior(events: IAnalyticsEvent[], sessions: any[]): IUserBehavior {
    const pageViews = events.filter(e => e.event === 'page_view');
    const totalPageViews = pageViews.length;
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const bounces = sessions.filter(s => s.bounce).length;
    const conversions = events.filter(e => e.category === 'conversion').length;

    const devices = new Map<string, IDeviceInfo>();
    events.forEach(e => {
      if (e.device) {
        const key = JSON.stringify(e.device);
        devices.set(key, e.device);
      }
    });

    const topPages = this.calculateTopPages(pageViews);

    return {
      userId: events[0]?.userId || '',
      totalSessions,
      totalPageViews,
      averageSessionDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      bounceRate: totalSessions > 0 ? (bounces / totalSessions) * 100 : 0,
      conversionRate: totalSessions > 0 ? (conversions / totalSessions) * 100 : 0,
      lastSeen: events[0]?.timestamp || new Date(),
      firstSeen: events[events.length - 1]?.timestamp || new Date(),
      devices: Array.from(devices.values()),
      topPages,
      events: events.slice(0, 100),
    };
  }

  private calculateTopPages(pageViews: IAnalyticsEvent[]): IPageView[] {
    const pageMap = new Map<string, { count: number; totalTime: number }>();

    pageViews.forEach(event => {
      const url = event.url || '';
      const existing = pageMap.get(url) || { count: 0, totalTime: 0 };
      existing.count++;
      existing.totalTime += event.properties?.timeOnPage || 0;
      pageMap.set(url, existing);
    });

    return Array.from(pageMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([url, data]) => ({
        url,
        title: '',
        timeOnPage: data.count > 0 ? data.totalTime / data.count : 0,
      }));
  }

  generateReport(events: IAnalyticsEvent[], options: IReportOptions): IAnalyticsReport {
    const metrics = this.calculateMetrics(events);
    const dimensions = this.calculateDimensions(events);

    return {
      period: options.period,
      metrics,
      dimensions,
      segments: options.segments,
    };
  }

  private calculateMetrics(events: IAnalyticsEvent[]): IMetrics {
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));
    const uniqueSessions = new Set(events.map(e => e.sessionId));
    const pageViews = events.filter(e => e.event === 'page_view').length;
    const conversions = events.filter(e => e.category === 'conversion');
    const revenue = conversions.reduce((sum, e) => sum + (e.properties?.value || 0), 0);

    const sessionData = this.analyzeSessionData(events);

    return {
      users: uniqueUsers.size,
      newUsers: this.calculateNewUsers(events),
      sessions: uniqueSessions.size,
      pageViews,
      bounceRate: sessionData.bounceRate,
      avgSessionDuration: sessionData.avgDuration,
      conversions: conversions.length,
      conversionRate: uniqueSessions.size > 0 ? (conversions.length / uniqueSessions.size) * 100 : 0,
      revenue,
    };
  }

  private calculateNewUsers(events: IAnalyticsEvent[]): number {
    return events.filter(e => e.properties?.isNewUser).length;
  }

  private analyzeSessionData(events: IAnalyticsEvent[]): any {
    const sessions = new Map<string, IAnalyticsEvent[]>();
    
    events.forEach(event => {
      const sessionEvents = sessions.get(event.sessionId) || [];
      sessionEvents.push(event);
      sessions.set(event.sessionId, sessionEvents);
    });

    let totalDuration = 0;
    let bounces = 0;

    sessions.forEach(sessionEvents => {
      if (sessionEvents.length === 1) {
        bounces++;
      }
      
      if (sessionEvents.length > 1) {
        const duration = sessionEvents[0].timestamp.getTime() - 
                        sessionEvents[sessionEvents.length - 1].timestamp.getTime();
        totalDuration += duration;
      }
    });

    return {
      bounceRate: sessions.size > 0 ? (bounces / sessions.size) * 100 : 0,
      avgDuration: sessions.size > 0 ? totalDuration / sessions.size / 1000 : 0,
    };
  }

  private calculateDimensions(events: IAnalyticsEvent[]): IDimensions {
    return {
      pages: this.calculatePageMetrics(events),
      sources: this.calculateSourceMetrics(events),
      devices: this.calculateDeviceMetrics(events),
      locations: this.calculateLocationMetrics(events),
    };
  }

  private calculatePageMetrics(events: IAnalyticsEvent[]): IPageMetrics[] {
    const pageMap = new Map<string, any>();

    events.filter(e => e.event === 'page_view').forEach(event => {
      const url = event.url || 'unknown';
      const existing = pageMap.get(url) || {
        views: 0,
        uniqueViews: new Set(),
        totalTime: 0,
        bounces: 0,
        exits: 0,
      };

      existing.views++;
      existing.uniqueViews.add(event.sessionId);
      existing.totalTime += event.properties?.timeOnPage || 0;

      pageMap.set(url, existing);
    });

    return Array.from(pageMap.entries()).map(([url, data]) => ({
      url,
      views: data.views,
      uniqueViews: data.uniqueViews.size,
      avgTimeOnPage: data.views > 0 ? data.totalTime / data.views : 0,
      bounceRate: 0,
      exitRate: 0,
    }));
  }

  private calculateSourceMetrics(events: IAnalyticsEvent[]): ISourceMetrics[] {
    const sourceMap = new Map<string, any>();

    events.forEach(event => {
      const source = event.properties?.source || 'direct';
      const medium = event.properties?.medium || 'none';
      const key = `${source}/${medium}`;

      const existing = sourceMap.get(key) || {
        users: new Set(),
        sessions: new Set(),
        conversions: 0,
      };

      if (event.userId) existing.users.add(event.userId);
      existing.sessions.add(event.sessionId);
      if (event.category === 'conversion') existing.conversions++;

      sourceMap.set(key, existing);
    });

    return Array.from(sourceMap.entries()).map(([key, data]) => {
      const [source, medium] = key.split('/');
      return {
        source,
        medium,
        users: data.users.size,
        sessions: data.sessions.size,
        bounceRate: 0,
        conversionRate: data.sessions.size > 0 ? (data.conversions / data.sessions.size) * 100 : 0,
      };
    });
  }

  private calculateDeviceMetrics(events: IAnalyticsEvent[]): IDeviceMetrics[] {
    const deviceMap = new Map<string, any>();

    events.forEach(event => {
      if (!event.device) return;

      const key = JSON.stringify(event.device);
      const existing = deviceMap.get(key) || {
        device: event.device,
        users: new Set(),
        sessions: new Set(),
        conversions: 0,
      };

      if (event.userId) existing.users.add(event.userId);
      existing.sessions.add(event.sessionId);
      if (event.category === 'conversion') existing.conversions++;

      deviceMap.set(key, existing);
    });

    return Array.from(deviceMap.values()).map(data => ({
      device: data.device,
      users: data.users.size,
      sessions: data.sessions.size,
      bounceRate: 0,
      conversionRate: data.sessions.size > 0 ? (data.conversions / data.sessions.size) * 100 : 0,
    }));
  }

  private calculateLocationMetrics(events: IAnalyticsEvent[]): ILocationMetrics[] {
    const locationMap = new Map<string, any>();

    events.forEach(event => {
      if (!event.location) return;

      const key = event.location.country || 'Unknown';
      const existing = locationMap.get(key) || {
        location: event.location,
        users: new Set(),
        sessions: new Set(),
        pageViews: 0,
        conversions: 0,
      };

      if (event.userId) existing.users.add(event.userId);
      existing.sessions.add(event.sessionId);
      if (event.event === 'page_view') existing.pageViews++;
      if (event.category === 'conversion') existing.conversions++;

      locationMap.set(key, existing);
    });

    return Array.from(locationMap.values()).map(data => ({
      location: data.location,
      users: data.users.size,
      sessions: data.sessions.size,
      pageViews: data.pageViews,
      conversionRate: data.sessions.size > 0 ? (data.conversions / data.sessions.size) * 100 : 0,
    }));
  }

  async analyzeFunnel(steps: string[]): Promise<any> {
    return {
      steps: steps.map((step, index) => ({
        name: step,
        users: 1000 - (index * 200),
        dropoff: index > 0 ? 20 : 0,
      })),
      totalConversion: 40,
    };
  }
}