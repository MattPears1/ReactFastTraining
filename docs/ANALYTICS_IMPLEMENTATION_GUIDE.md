# Analytics Implementation Guide

Last updated: 2025-01-26

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Frontend Analytics](#frontend-analytics)
4. [Backend Analytics](#backend-analytics)
5. [E-commerce Tracking](#e-commerce-tracking)
6. [Conversion Tracking](#conversion-tracking)
7. [Privacy & GDPR Compliance](#privacy--gdpr-compliance)
8. [Analytics Dashboard](#analytics-dashboard)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

This application implements a comprehensive analytics solution with:

- **Google Analytics 4 (GA4)** integration
- **Custom internal analytics** for detailed tracking
- **Privacy-compliant tracking** with GDPR support
- **Real-time analytics dashboard**
- **E-commerce and conversion tracking**
- **Server-side API analytics**

## Setup

### 1. Environment Configuration

Add the following to your `.env` file:

```env
# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=your-ga-api-secret

# Analytics Settings
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_SAMPLING_RATE=1.0
```

### 2. Installation

The analytics system is automatically initialized when the application starts. No additional packages need to be installed as all dependencies are already included.

## Frontend Analytics

### Automatic Tracking

The following events are automatically tracked:

- **Page Views**: Every route change
- **Errors**: JavaScript errors and unhandled promise rejections
- **Performance Metrics**: Core Web Vitals (LCP, FID, CLS, TTFB)
- **User Engagement**: Time on page, scroll depth
- **Session Duration**: Active time spent on the site

### Manual Event Tracking

#### Using the Analytics Hook

```tsx
import { useAnalytics } from '@/hooks/useAnalytics'

function MyComponent() {
  const { trackEvent } = useAnalytics()

  const handleButtonClick = () => {
    trackEvent({
      category: 'engagement',
      action: 'button_click',
      label: 'cta_hero',
      value: 1
    })
  }

  return <button onClick={handleButtonClick}>Click Me</button>
}
```

#### Using Tracked Components

```tsx
import { TrackedButton } from '@/components/analytics/TrackedButton'
import { TrackedLink } from '@/components/analytics/TrackedLink'
import { TrackedForm } from '@/components/analytics/TrackedForm'

// Tracked Button
<TrackedButton
  eventCategory="cta"
  eventAction="click"
  eventLabel="signup"
  variant="primary"
>
  Sign Up Now
</TrackedButton>

// Tracked Link
<TrackedLink
  to="/products"
  eventCategory="navigation"
  eventAction="click"
  eventLabel="products_nav"
>
  View Products
</TrackedLink>

// Tracked Form
<TrackedForm
  formName="contact_form"
  onSubmitSuccess={() => console.log('Form submitted')}
>
  {/* Form fields */}
</TrackedForm>
```

### Performance Tracking

Performance metrics are automatically collected:

```tsx
// Automatic performance tracking is enabled by default
// Access performance data in the analytics dashboard
```

### User Tracking

Track authenticated users:

```tsx
import { UserTracking } from '@/components/providers/AnalyticsProvider'

function App() {
  const user = useAuth()

  return (
    <>
      {user && (
        <UserTracking
          userId={user.id}
          userProperties={{
            email: user.email,
            plan: user.subscription?.plan,
            signUpDate: user.createdAt
          }}
        />
      )}
      {/* Rest of your app */}
    </>
  )
}
```

## Backend Analytics

### API Request Tracking

All API requests are automatically tracked with:
- Response time
- Status code
- User ID (if authenticated)
- Endpoint path
- HTTP method

### Custom Backend Events

```typescript
import { Container } from 'typedi'
import { AnalyticsService } from '@/services/analytics/analytics.service'

const analyticsService = Container.get(AnalyticsService)

// Track custom event
await analyticsService.track({
  userId: user.id,
  event: 'subscription_upgraded',
  category: EventCategory.BUSINESS,
  properties: {
    fromPlan: 'basic',
    toPlan: 'pro',
    revenue: 99.99
  }
})

// Track conversion
await analyticsService.trackConversion({
  userId: user.id,
  sessionId: session.id,
  type: 'purchase',
  value: 199.99,
  orderId: order.id
})
```

## E-commerce Tracking

### Product Interactions

```tsx
import { useEcommerceTracking } from '@/hooks/useEcommerceTracking'

function ProductPage({ product }) {
  const {
    trackProductView,
    trackAddToCart,
    trackAddToWishlist
  } = useEcommerceTracking()

  useEffect(() => {
    trackProductView(product, 'product_detail')
  }, [product])

  const handleAddToCart = () => {
    trackAddToCart(product, 1)
    // Add to cart logic
  }

  const handleAddToWishlist = () => {
    trackAddToWishlist(product)
    // Wishlist logic
  }

  return (
    // Product UI
  )
}
```

### Checkout Process

```tsx
function Checkout() {
  const { 
    trackBeginCheckout,
    trackAddPaymentInfo,
    trackAddShippingInfo,
    trackPurchase 
  } = useEcommerceTracking()

  // Track checkout start
  useEffect(() => {
    trackBeginCheckout(couponCode)
  }, [])

  // Track payment info
  const handlePaymentSubmit = (paymentMethod) => {
    trackAddPaymentInfo(paymentMethod)
  }

  // Track shipping info
  const handleShippingSubmit = (shippingMethod, cost) => {
    trackAddShippingInfo(shippingMethod, cost)
  }

  // Track purchase completion
  const handlePurchaseComplete = (order) => {
    trackPurchase({
      id: order.id,
      items: order.items,
      revenue: order.total,
      tax: order.tax,
      shipping: order.shipping,
      currency: 'USD',
      coupon: order.couponCode
    })
  }
}
```

## Conversion Tracking

### Setting Up Goals

```typescript
import { conversionTracking } from '@/services/analytics/conversion.service'

// Add custom conversion goal
conversionTracking.addGoal({
  id: 'demo_request',
  name: 'Demo Request',
  type: 'event',
  value: 100,
  conditions: [
    { type: 'event', operator: 'equals', value: 'demo_form_submit' }
  ]
})

// Track goal completion
conversionTracking.trackConversion('demo_request', 150, 'DEMO-123')
```

### Funnel Tracking

```typescript
// Define a conversion funnel
conversionTracking.addFunnel({
  id: 'purchase_funnel',
  name: 'Purchase Funnel',
  steps: [
    { name: 'View Product', event: 'product_view' },
    { name: 'Add to Cart', event: 'add_to_cart' },
    { name: 'Begin Checkout', event: 'begin_checkout' },
    { name: 'Complete Purchase', event: 'purchase', required: true }
  ],
  goalValue: 100
})

// Track funnel steps
conversionTracking.trackFunnelStep('purchase_funnel', 0) // View Product
conversionTracking.trackFunnelStep('purchase_funnel', 1) // Add to Cart
```

## Privacy & GDPR Compliance

### Cookie Consent

The analytics system respects user consent choices:

```tsx
// Cookie consent is automatically handled by the CookieConsent component
// Analytics only tracks when user has given consent for 'analytics' cookies
```

### User Data Rights

```typescript
// Export user data
const userData = await analytics.exportUserData(userId)

// Delete user data
await analytics.deleteUserData(userId)

// Update consent preferences
await analytics.setUserConsent(userId, {
  analytics: false,
  marketing: false,
  preferences: true
})
```

### Data Anonymization

- IP addresses are automatically anonymized
- Personal data is filtered from tracking
- Sensitive fields are excluded from properties

## Analytics Dashboard

### Accessing the Dashboard

The analytics dashboard is available at `/admin/analytics` for authorized users.

### Available Metrics

- **Real-time users**: Currently active users
- **Traffic metrics**: Users, sessions, page views
- **Engagement**: Bounce rate, session duration, pages per session
- **Conversions**: Goal completions and revenue
- **Top content**: Most viewed pages and popular events

### Using the Dashboard Component

```tsx
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

function AdminPanel() {
  return (
    <div>
      <h1>Analytics Overview</h1>
      <AnalyticsDashboard />
    </div>
  )
}
```

## Best Practices

### 1. Event Naming Convention

Use consistent naming for events:
- **Category**: High-level grouping (e.g., 'ecommerce', 'engagement', 'navigation')
- **Action**: Specific action (e.g., 'click', 'submit', 'view')
- **Label**: Detailed identifier (e.g., 'header_cta', 'product_123')

### 2. Data Sampling

For high-traffic sites, implement sampling:

```typescript
// Only track 10% of events
if (Math.random() < 0.1) {
  trackEvent({ ... })
}
```

### 3. Batch Events

For multiple related events:

```typescript
// Instead of multiple calls
trackEvent({ action: 'form_start' })
trackEvent({ action: 'form_field_1' })
trackEvent({ action: 'form_field_2' })

// Use a single call with properties
trackEvent({
  action: 'form_interaction',
  properties: {
    stage: 'start',
    fields_completed: ['field_1', 'field_2']
  }
})
```

### 4. Avoid PII

Never track personally identifiable information:

```typescript
// Bad
trackEvent({
  properties: {
    email: user.email,
    ssn: user.ssn
  }
})

// Good
trackEvent({
  properties: {
    userId: user.id,
    userType: user.role
  }
})
```

## Troubleshooting

### Analytics Not Working

1. Check cookie consent:
```javascript
console.log(localStorage.getItem('cookie-consent'))
```

2. Verify GA4 configuration:
```javascript
console.log(import.meta.env.VITE_GA_MEASUREMENT_ID)
```

3. Check for errors:
```javascript
// Enable debug mode
analytics.debug()
```

### Events Not Appearing in GA4

1. GA4 has a 24-48 hour delay for non-realtime reports
2. Check DebugView in GA4 for real-time testing
3. Ensure events are properly formatted for GA4

### Performance Issues

1. Implement event throttling for high-frequency events
2. Use `requestIdleCallback` for non-critical tracking
3. Consider server-side tracking for critical events

### Data Discrepancies

1. Check sampling rates
2. Verify timezone settings
3. Ensure consistent session handling
4. Check for ad blockers affecting GA4

## API Reference

### Frontend Services

- `analytics.trackEvent()` - Track custom events
- `analytics.trackPageView()` - Track page views
- `analytics.setUser()` - Set user properties
- `analytics.trackError()` - Track errors
- `ecommerceAnalytics.*` - E-commerce tracking
- `conversionTracking.*` - Conversion tracking

### Backend Services

- `AnalyticsService` - Main analytics service
- `AnalyticsController` - API endpoints
- `analyticsMiddleware` - Express middleware

### React Hooks

- `useAnalytics()` - General analytics
- `usePageTracking()` - Automatic page tracking
- `useEcommerceTracking()` - E-commerce events
- `useFormTracking()` - Form interactions
- `useEngagementTracking()` - User engagement

## Security Considerations

1. **API Security**: Analytics endpoints are rate-limited
2. **Data Validation**: All tracking data is validated
3. **XSS Prevention**: Properties are sanitized
4. **CSRF Protection**: Session validation for authenticated events

## Performance Impact

The analytics implementation has minimal performance impact:
- Async tracking doesn't block UI
- Events are batched when offline
- Lazy loading of GA4 script
- Efficient event queuing

## Future Enhancements

Consider implementing:
- Custom dimensions in GA4
- Enhanced e-commerce data layer
- Server-side tracking for critical events
- A/B testing integration
- Heat mapping
- Session recordings (with consent)
- Custom attribution models