import { Router } from 'express'
import { Container } from 'typedi'
import { AnalyticsController } from '../controllers/analytics/analytics.controller'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { body, query } from 'express-validator'

const router = Router()
const analyticsController = Container.get(AnalyticsController)

// Public endpoint for tracking events
router.post('/track',
  validate([
    body('event').isString().notEmpty(),
    body('category').isString().notEmpty(),
    body('properties').optional().isObject(),
    body('sessionId').optional().isString(),
    body('userId').optional().isString()
  ]),
  analyticsController.trackEvent.bind(analyticsController)
)

// Public endpoint for tracking page views
router.post('/pageview',
  validate([
    body('url').isURL({ require_protocol: false }),
    body('title').isString().notEmpty(),
    body('referrer').optional().isString(),
    body('sessionId').optional().isString()
  ]),
  analyticsController.trackPageView.bind(analyticsController)
)

// Public endpoint for tracking errors
router.post('/error',
  validate([
    body('message').isString().notEmpty(),
    body('stack').optional().isString(),
    body('fatal').optional().isBoolean(),
    body('url').optional().isString(),
    body('sessionId').optional().isString()
  ]),
  analyticsController.trackError.bind(analyticsController)
)

// Public endpoint for performance metrics
router.post('/performance',
  validate([
    body('metrics').isObject().notEmpty(),
    body('metrics.lcp').optional().isNumeric(),
    body('metrics.fid').optional().isNumeric(),
    body('metrics.cls').optional().isNumeric(),
    body('metrics.ttfb').optional().isNumeric(),
    body('url').optional().isString()
  ]),
  analyticsController.trackPerformance.bind(analyticsController)
)

// Protected analytics dashboard endpoints
router.get('/dashboard',
  authenticate,
  authorize(['admin', 'analyst']),
  validate([
    query('range').optional().isIn(['today', 'week', 'month', 'year']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ]),
  analyticsController.getDashboardData.bind(analyticsController)
)

// Real-time analytics
router.get('/realtime',
  authenticate,
  authorize(['admin', 'analyst']),
  analyticsController.getRealtimeData.bind(analyticsController)
)

// Get analytics report
router.get('/report',
  authenticate,
  authorize(['admin', 'analyst']),
  validate([
    query('period').optional().isIn(['day', 'week', 'month', 'year']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('metrics').optional().isArray()
  ]),
  analyticsController.getReport.bind(analyticsController)
)

// Get user behavior analytics
router.get('/user/:userId',
  authenticate,
  authorize(['admin', 'analyst']),
  analyticsController.getUserBehavior.bind(analyticsController)
)

// Get conversion funnel analysis
router.get('/funnel',
  authenticate,
  authorize(['admin', 'analyst']),
  validate([
    query('steps').isArray().notEmpty(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ]),
  analyticsController.getConversionFunnel.bind(analyticsController)
)

// Get top pages
router.get('/top-pages',
  authenticate,
  authorize(['admin', 'analyst']),
  validate([
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('period').optional().isIn(['day', 'week', 'month'])
  ]),
  analyticsController.getTopPages.bind(analyticsController)
)

// Get top events
router.get('/top-events',
  authenticate,
  authorize(['admin', 'analyst']),
  validate([
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('period').optional().isIn(['day', 'week', 'month'])
  ]),
  analyticsController.getTopEvents.bind(analyticsController)
)

// Privacy compliance endpoints
router.post('/consent',
  validate([
    body('userId').isString().notEmpty(),
    body('consent').isObject().notEmpty(),
    body('consent.analytics').isBoolean(),
    body('consent.marketing').isBoolean(),
    body('consent.preferences').isBoolean()
  ]),
  analyticsController.updateConsent.bind(analyticsController)
)

router.delete('/user/:userId',
  authenticate,
  analyticsController.deleteUserData.bind(analyticsController)
)

router.get('/export/:userId',
  authenticate,
  analyticsController.exportUserData.bind(analyticsController)
)

// Custom event tracking
router.post('/custom',
  validate([
    body('eventName').isString().notEmpty(),
    body('eventData').isObject(),
    body('sessionId').optional().isString()
  ]),
  analyticsController.trackCustomEvent.bind(analyticsController)
)

// E-commerce tracking
router.post('/ecommerce',
  validate([
    body('event').isIn(['view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase']),
    body('items').isArray().notEmpty(),
    body('value').optional().isNumeric(),
    body('currency').optional().isString().isLength({ min: 3, max: 3 })
  ]),
  analyticsController.trackEcommerce.bind(analyticsController)
)

// A/B testing analytics
router.post('/ab-test',
  validate([
    body('testId').isString().notEmpty(),
    body('variant').isString().notEmpty(),
    body('event').isString().notEmpty(),
    body('value').optional().isNumeric()
  ]),
  analyticsController.trackABTest.bind(analyticsController)
)

export default router