import { Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { AnalyticsService } from '../services/analytics/analytics.service'
import { EventCategory } from '../interfaces/analytics.interface'
import { v4 as uuidv4 } from 'uuid'

declare global {
  namespace Express {
    interface Request {
      analytics?: {
        sessionId: string
        userId?: string
        startTime: number
      }
    }
  }
}

export const analyticsMiddleware = () => {
  const analyticsService = Container.get(AnalyticsService)

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip analytics for health checks and static assets
    if (req.path === '/health' || req.path.startsWith('/static')) {
      return next()
    }

    // Initialize analytics context
    const sessionId = req.cookies?.sessionId || uuidv4()
    const userId = req.user?.id
    const startTime = Date.now()

    req.analytics = {
      sessionId,
      userId,
      startTime
    }

    // Set session cookie if not present
    if (!req.cookies?.sessionId) {
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000 // 30 minutes
      })
    }

    // Track response
    const originalSend = res.send
    res.send = function(data: any) {
      res.send = originalSend

      // Calculate response time
      const responseTime = Date.now() - startTime
      
      // Track API request
      analyticsService.track({
        userId,
        sessionId,
        event: 'api_request',
        category: EventCategory.API,
        url: req.originalUrl,
        method: req.method,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer,
        properties: {
          path: req.path,
          query: req.query,
          statusCode: res.statusCode,
          responseTime,
          contentLength: res.get('content-length'),
          success: res.statusCode < 400
        }
      }).catch(error => {
        console.error('Analytics tracking error:', error)
      })

      return res.send(data)
    }

    next()
  }
}

export const trackApiError = () => {
  const analyticsService = Container.get(AnalyticsService)

  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (req.analytics) {
      analyticsService.track({
        userId: req.analytics.userId,
        sessionId: req.analytics.sessionId,
        event: 'api_error',
        category: EventCategory.ERROR,
        url: req.originalUrl,
        method: req.method,
        properties: {
          error: error.message,
          stack: error.stack,
          statusCode: res.statusCode || 500,
          path: req.path
        }
      }).catch(err => {
        console.error('Error tracking analytics:', err)
      })
    }

    next(error)
  }
}

export const trackApiPerformance = () => {
  const analyticsService = Container.get(AnalyticsService)

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.analytics) {
      return next()
    }

    const { startTime, sessionId, userId } = req.analytics

    // Track slow API requests
    res.on('finish', () => {
      const duration = Date.now() - startTime

      if (duration > 1000) { // Track requests slower than 1 second
        analyticsService.track({
          userId,
          sessionId,
          event: 'slow_api_request',
          category: EventCategory.PERFORMANCE,
          url: req.originalUrl,
          method: req.method,
          properties: {
            duration,
            path: req.path,
            statusCode: res.statusCode
          }
        }).catch(error => {
          console.error('Performance tracking error:', error)
        })
      }
    })

    next()
  }
}

export const trackApiUsage = () => {
  const analyticsService = Container.get(AnalyticsService)

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.analytics || !req.user) {
      return next()
    }

    const endpoint = `${req.method} ${req.route?.path || req.path}`
    
    // Track API usage by endpoint
    analyticsService.track({
      userId: req.user.id,
      sessionId: req.analytics.sessionId,
      event: 'api_usage',
      category: EventCategory.API,
      properties: {
        endpoint,
        method: req.method,
        path: req.path,
        userRole: req.user.role,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      console.error('API usage tracking error:', error)
    })

    next()
  }
}

export const trackAuthentication = (action: 'login' | 'logout' | 'signup' | 'password_reset') => {
  const analyticsService = Container.get(AnalyticsService)

  return async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.analytics?.sessionId || uuidv4()
    const userId = req.user?.id || req.body?.userId

    analyticsService.track({
      userId,
      sessionId,
      event: `auth_${action}`,
      category: EventCategory.AUTH,
      properties: {
        action,
        method: req.body?.method || 'email', // e.g., email, google, facebook
        success: res.statusCode < 400,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      console.error('Auth tracking error:', error)
    })

    next()
  }
}

export const trackBusinessMetrics = () => {
  const analyticsService = Container.get(AnalyticsService)

  return async (req: Request, res: Response, next: NextFunction) => {
    // Track business-specific metrics based on the endpoint
    res.on('finish', async () => {
      if (!req.analytics) return

      const { sessionId, userId } = req.analytics

      // Track order-related metrics
      if (req.path.includes('/orders') && req.method === 'POST' && res.statusCode === 201) {
        const orderData = res.locals.order
        if (orderData) {
          await analyticsService.trackConversion({
            userId,
            sessionId,
            type: 'purchase',
            value: orderData.total,
            currency: orderData.currency || 'USD',
            orderId: orderData.id
          })
        }
      }

      // Track subscription metrics
      if (req.path.includes('/subscriptions') && req.method === 'POST' && res.statusCode === 201) {
        const subscriptionData = res.locals.subscription
        if (subscriptionData) {
          await analyticsService.trackConversion({
            userId,
            sessionId,
            type: 'subscription',
            value: subscriptionData.price,
            currency: subscriptionData.currency || 'USD',
            subscriptionId: subscriptionData.id,
            plan: subscriptionData.plan
          })
        }
      }

      // Track user registration
      if (req.path === '/auth/register' && req.method === 'POST' && res.statusCode === 201) {
        await analyticsService.trackConversion({
          userId: res.locals.userId,
          sessionId,
          type: 'signup',
          value: 0,
          source: req.body?.source || 'organic'
        })
      }
    })

    next()
  }
}