import { IAnalyticsProvider, IAnalyticsEvent, IPageView, IAnalyticsReport } from '../../../interfaces/analytics.interface';
import { logger } from '../../../utils/logger';

export class InternalAnalyticsProvider implements IAnalyticsProvider {
  async track(event: IAnalyticsEvent): Promise<void> {
    logger.debug('Internal analytics track', { event });
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    logger.debug('Internal analytics identify', { userId, traits });
  }

  async page(pageView: IPageView): Promise<void> {
    logger.debug('Internal analytics page view', { pageView });
  }

  async getReport(options: any): Promise<IAnalyticsReport> {
    throw new Error('Report generation handled by main analytics service');
  }
}