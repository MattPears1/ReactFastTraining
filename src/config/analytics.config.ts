export const analyticsConfig = {
  // Google Analytics 4
  ga4: {
    measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    enabled: import.meta.env.VITE_GA_ENABLED !== 'false',
    debugMode: import.meta.env.DEV,
    anonymizeIp: true,
    cookieFlags: 'SameSite=None;Secure'
  },

  // Internal Analytics
  internal: {
    enabled: true,
    apiEndpoint: '/api/v1/analytics',
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Privacy Settings
  privacy: {
    anonymizeIp: true,
    respectDoNotTrack: true,
    cookieExpiry: 365, // days
    defaultConsent: {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    }
  },

  // Sampling Configuration
  sampling: {
    enabled: false,
    rate: 1.0, // 100% sampling by default
    rules: [
      { event: 'page_view', rate: 1.0 },
      { event: 'error', rate: 1.0 }, // Always track errors
      { event: 'purchase', rate: 1.0 } // Always track purchases
    ]
  },

  // Event Configuration
  events: {
    // Automatic tracking settings
    autoTrack: {
      pageViews: true,
      errors: true,
      performance: true,
      engagement: true,
      scrollDepth: true,
      outboundLinks: true
    },

    // Event throttling (ms)
    throttle: {
      scroll: 500,
      resize: 1000,
      input: 300
    },

    // Custom event mappings for GA4
    customDimensions: {
      user_type: 'dimension1',
      content_group: 'dimension2',
      ab_test_variant: 'dimension3'
    }
  },

  // E-commerce Settings
  ecommerce: {
    currency: 'USD',
    enhanced: true,
    dataLayer: true,
    trackingId: import.meta.env.VITE_GA_ECOMMERCE_ID
  },

  // Performance Monitoring
  performance: {
    enabled: true,
    sampleRate: 1.0,
    metrics: ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'],
    slowPageThreshold: 3000, // ms
    reportInterval: 60000 // 1 minute
  },

  // Session Configuration
  session: {
    timeout: 30 * 60 * 1000, // 30 minutes
    cookieName: 'analytics_session',
    trackingCookieName: 'analytics_uid'
  },

  // Dashboard Settings
  dashboard: {
    refreshInterval: 30000, // 30 seconds
    maxDataPoints: 100,
    defaultTimeRange: 'week',
    enableRealtime: true
  },

  // Debug Settings
  debug: {
    enabled: import.meta.env.DEV,
    logEvents: import.meta.env.DEV,
    validateEvents: true,
    showWarnings: true
  },

  // Feature Flags
  features: {
    heatmaps: false,
    sessionRecording: false,
    customAlerts: true,
    predictiveAnalytics: false,
    cohortAnalysis: true
  }
}

// Conversion Goals Configuration
export const conversionGoals = [
  {
    id: 'signup',
    name: 'User Sign Up',
    value: 50,
    type: 'event',
    conditions: { event: 'user_signup' }
  },
  {
    id: 'purchase',
    name: 'Purchase Complete',
    value: 0, // Dynamic
    type: 'event',
    conditions: { event: 'purchase' }
  },
  {
    id: 'newsletter',
    name: 'Newsletter Subscription',
    value: 10,
    type: 'event',
    conditions: { event: 'newsletter_subscribe' }
  },
  {
    id: 'contact',
    name: 'Contact Form',
    value: 25,
    type: 'event',
    conditions: { event: 'contact_form_submit' }
  },
  {
    id: 'demo_request',
    name: 'Demo Request',
    value: 100,
    type: 'event',
    conditions: { event: 'demo_request' }
  },
  {
    id: 'high_engagement',
    name: 'High Engagement',
    value: 5,
    type: 'engagement',
    conditions: { duration: 300000, pages: 5 } // 5 min, 5 pages
  }
]

// Custom Events Configuration
export const customEvents = {
  // UI Interactions
  ui: {
    modal_open: { category: 'ui', action: 'modal_open' },
    modal_close: { category: 'ui', action: 'modal_close' },
    tab_switch: { category: 'ui', action: 'tab_switch' },
    accordion_toggle: { category: 'ui', action: 'accordion_toggle' },
    tooltip_show: { category: 'ui', action: 'tooltip_show' }
  },

  // Content Interactions
  content: {
    video_play: { category: 'content', action: 'video_play' },
    video_pause: { category: 'content', action: 'video_pause' },
    video_complete: { category: 'content', action: 'video_complete' },
    download: { category: 'content', action: 'download' },
    share: { category: 'content', action: 'share' },
    print: { category: 'content', action: 'print' }
  },

  // Form Interactions
  form: {
    start: { category: 'form', action: 'start' },
    field_focus: { category: 'form', action: 'field_focus' },
    field_blur: { category: 'form', action: 'field_blur' },
    field_error: { category: 'form', action: 'field_error' },
    submit: { category: 'form', action: 'submit' },
    abandon: { category: 'form', action: 'abandon' }
  },

  // Search
  search: {
    search_submit: { category: 'search', action: 'submit' },
    search_clear: { category: 'search', action: 'clear' },
    search_filter: { category: 'search', action: 'filter' },
    search_sort: { category: 'search', action: 'sort' },
    search_paginate: { category: 'search', action: 'paginate' }
  }
}

// Regex patterns for PII detection
export const piiPatterns = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\d{3}-?\d{2}-?\d{4}/g,
  creditCard: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  ipAddress: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g
}