import { Request, Response, NextFunction } from 'express'
import { Service } from 'typedi'
import { AnalyticsService } from '../../services/analytics/analytics.service'
import { 
  EventCategory, 
  IPageView, 
  IReportOptions,
  ConversionType 
} from '../../interfaces/analytics.interface'
import { logger } from '../../utils/logger'

@Service()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  async trackEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { event, category, properties, sessionId, userId } = req.body
      const label = properties?.label || req.body.label
      const value = properties?.value || req.body.value

      await this.analyticsService.track({
        userId: userId || req.analytics?.userId,
        sessionId: sessionId || req.analytics?.sessionId,
        event,
        category,
        label,
        value,
        properties,
        url: req.headers.referer || req.body.url,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer
      })

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async trackPageView(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, title, referrer, sessionId } = req.body
      const pageView: IPageView = { url, title, referrer }

      await this.analyticsService.pageView(
        pageView,
        sessionId || req.analytics?.sessionId || '',
        req.analytics?.userId
      )

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async trackError(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, stack, fatal, url, sessionId } = req.body
      const error = new Error(message)
      error.stack = stack

      await this.analyticsService.trackError(
        error,
        req.analytics?.userId,
        sessionId || req.analytics?.sessionId
      )

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async trackPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { metrics, url } = req.body

      // Track each performance metric
      for (const [metric, value] of Object.entries(metrics)) {
        if (typeof value === 'number') {
          await this.analyticsService.trackTiming(
            'web_vitals',
            metric,
            value,
            url
          )
        }
      }

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async getDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const { range, startDate, endDate } = req.query

      const options: IReportOptions = {
        period: {
          start: startDate ? new Date(startDate as string) : this.getDateByRange(range as string),
          end: endDate ? new Date(endDate as string) : new Date()
        }
      }

      const [report, realtimeUsers, topPages] = await Promise.all([
        this.analyticsService.getReport(options),
        this.analyticsService.getRealtimeUsers(),
        this.analyticsService.getTopPages(10)
      ])

      const metrics = this.formatMetrics(report)
      const topEvents = this.getTopEvents(report)
      const conversions = this.getConversions(report)

      res.json({
        metrics,
        topPages,
        topEvents,
        conversions,
        realtimeUsers
      })
    } catch (error) {
      next(error)
    }
  }

  async getRealtimeData(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.analyticsService.getRealtimeUsers()
      res.json({ users })
    } catch (error) {
      next(error)
    }
  }

  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, startDate, endDate, metrics } = req.query

      const options: IReportOptions = {
        period: {
          start: startDate ? new Date(startDate as string) : this.getDateByRange(period as string),
          end: endDate ? new Date(endDate as string) : new Date()
        },
        metrics: metrics as string[]
      }

      const report = await this.analyticsService.getReport(options)
      res.json(report)
    } catch (error) {
      next(error)
    }
  }

  async getUserBehavior(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const behavior = await this.analyticsService.getUserBehavior(userId)
      
      if (!behavior) {
        return res.status(404).json({ error: 'User behavior not found' })
      }

      res.json(behavior)
    } catch (error) {
      next(error)
    }
  }

  async getConversionFunnel(req: Request, res: Response, next: NextFunction) {
    try {
      const { steps, startDate, endDate } = req.query
      const funnel = await this.analyticsService.getConversionFunnel(steps as string[])
      res.json(funnel)
    } catch (error) {
      next(error)
    }
  }

  async getTopPages(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const pages = await this.analyticsService.getTopPages(limit)
      res.json(pages)
    } catch (error) {
      next(error)
    }
  }

  async getTopEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, category, period } = req.query
      const options: IReportOptions = {
        period: {
          start: this.getDateByRange(period as string || 'week'),
          end: new Date()
        }
      }

      const report = await this.analyticsService.getReport(options)
      const events = this.getTopEvents(report, category as string, parseInt(limit as string) || 10)
      res.json(events)
    } catch (error) {
      next(error)
    }
  }

  async updateConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, consent } = req.body
      await this.analyticsService.setUserConsent(userId, consent)
      res.json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async deleteUserData(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      
      // Verify user has permission to delete this data
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }

      await this.analyticsService.deleteUserData(userId)
      res.json({ success: true, message: 'User analytics data deleted' })
    } catch (error) {
      next(error)
    }
  }

  async exportUserData(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      
      // Verify user has permission to export this data
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const data = await this.analyticsService.exportUserData(userId)
      res.json(data)
    } catch (error) {
      next(error)
    }
  }

  async trackCustomEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventName, eventData, sessionId } = req.body

      await this.analyticsService.track({
        userId: req.analytics?.userId,
        sessionId: sessionId || req.analytics?.sessionId,
        event: eventName,
        category: EventCategory.CUSTOM,
        properties: eventData,
        url: req.headers.referer,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async trackEcommerce(req: Request, res: Response, next: NextFunction) {
    try {
      const { event, items, value, currency } = req.body

      await this.analyticsService.track({
        userId: req.analytics?.userId,
        sessionId: req.analytics?.sessionId,
        event: `ecommerce_${event}`,
        category: EventCategory.ECOMMERCE,
        value,
        properties: {
          items,
          currency: currency || 'USD',
          event_type: event
        },
        url: req.headers.referer,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async trackABTest(req: Request, res: Response, next: NextFunction) {
    try {
      const { testId, variant, event, value } = req.body

      await this.analyticsService.track({
        userId: req.analytics?.userId,
        sessionId: req.analytics?.sessionId,
        event: `ab_test_${event}`,
        category: EventCategory.EXPERIMENT,
        label: `${testId}_${variant}`,
        value,
        properties: {
          test_id: testId,
          variant,
          event_name: event
        },
        url: req.headers.referer,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  private getDateByRange(range: string): Date {
    const now = new Date()
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      case 'year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Default to week
    }
  }

  private formatMetrics(report: any): any[] {
    return [
      {
        label: 'Total Users',
        value: report.totalUsers || 0,
        change: report.userGrowth || 0,
        trend: report.userGrowth > 0 ? 'up' : 'down'
      },
      {
        label: 'Page Views',
        value: report.totalPageViews || 0,
        change: report.pageViewGrowth || 0,
        trend: report.pageViewGrowth > 0 ? 'up' : 'down'
      },
      {
        label: 'Avg. Session Duration',
        value: this.formatDuration(report.avgSessionDuration || 0),
        change: report.sessionDurationChange || 0,
        trend: report.sessionDurationChange > 0 ? 'up' : 'down'
      },
      {
        label: 'Bounce Rate',
        value: `${(report.bounceRate || 0).toFixed(1)}%`,
        change: report.bounceRateChange || 0,
        trend: report.bounceRateChange < 0 ? 'up' : 'down' // Lower is better
      },
      {
        label: 'Conversions',
        value: report.totalConversions || 0,
        change: report.conversionGrowth || 0,
        trend: report.conversionGrowth > 0 ? 'up' : 'down'
      },
      {
        label: 'Revenue',
        value: `$${(report.totalRevenue || 0).toLocaleString()}`,
        change: report.revenueGrowth || 0,
        trend: report.revenueGrowth > 0 ? 'up' : 'down'
      }
    ]
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  private getTopEvents(report: any, category?: string, limit: number = 10): any[] {
    const events = report.events || []
    let filtered = events

    if (category) {
      filtered = events.filter((e: any) => e.category === category)
    }

    return filtered
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, limit)
      .map((e: any) => ({
        name: e.event,
        count: e.count,
        category: e.category
      }))
  }

  private getConversions(report: any): any[] {
    const conversions = report.conversions || []
    return conversions.map((c: any) => ({
      goal: c.type,
      completions: c.count,
      value: c.totalValue
    }))
  }
}