import { IAnalyticsProvider, IAnalyticsEvent, IPageView } from '../../../interfaces/analytics.interface';
import { logger } from '../../../utils/logger';
import axios from 'axios';

export class GoogleAnalyticsProvider implements IAnalyticsProvider {
  private measurementId: string;
  private apiSecret: string;
  private endpoint = 'https://www.google-analytics.com/mp/collect';

  constructor(private config: any) {
    this.measurementId = config.measurementId;
    this.apiSecret = config.apiSecret || process.env.GA_API_SECRET || '';
  }

  async track(event: IAnalyticsEvent): Promise<void> {
    try {
      const payload = {
        client_id: event.sessionId,
        user_id: event.userId,
        events: [{
          name: this.mapEventName(event.event),
          params: {
            ...event.properties,
            category: event.category,
            session_id: event.sessionId,
            engagement_time_msec: 100,
          },
        }],
      };

      await this.send(payload);
    } catch (error) {
      logger.error('Failed to track event in Google Analytics', { error, event });
    }
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    try {
      const payload = {
        client_id: userId,
        user_id: userId,
        user_properties: this.mapUserProperties(traits),
      };

      await this.send(payload);
    } catch (error) {
      logger.error('Failed to identify user in Google Analytics', { error, userId });
    }
  }

  async page(pageView: IPageView): Promise<void> {
    try {
      const payload = {
        client_id: 'anonymous',
        events: [{
          name: 'page_view',
          params: {
            page_location: pageView.url,
            page_title: pageView.title,
            page_referrer: pageView.referrer,
            engagement_time_msec: pageView.timeOnPage || 100,
          },
        }],
      };

      await this.send(payload);
    } catch (error) {
      logger.error('Failed to track page view in Google Analytics', { error, pageView });
    }
  }

  async getReport(options: any): Promise<any> {
    throw new Error('Google Analytics reporting not implemented');
  }

  private async send(payload: any): Promise<void> {
    const url = `${this.endpoint}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }

  private mapEventName(eventName: string): string {
    const eventMap: Record<string, string> = {
      'page_view': 'page_view',
      'user_signup': 'sign_up',
      'user_login': 'login',
      'purchase': 'purchase',
      'add_to_cart': 'add_to_cart',
      'remove_from_cart': 'remove_from_cart',
      'begin_checkout': 'begin_checkout',
      'search': 'search',
      'view_item': 'view_item',
      'select_content': 'select_content',
      'share': 'share',
    };

    return eventMap[eventName] || eventName.replace(/\s+/g, '_').toLowerCase();
  }

  private mapUserProperties(traits?: Record<string, any>): Record<string, any> {
    if (!traits) return {};

    const properties: Record<string, any> = {};

    Object.entries(traits).forEach(([key, value]) => {
      const mappedKey = key.replace(/\s+/g, '_').toLowerCase();
      
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        properties[mappedKey] = { value };
      }
    });

    return properties;
  }
}