import { logger } from './logger';
import { apiClient } from '@services/api/enhanced-client';

interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

interface PageView {
  path: string;
  title: string;
  referrer: string;
  timestamp: string;
  duration?: number;
  sessionId: string;
  userId?: string;
}

interface UserProperties {
  id: string;
  email?: string;
  role?: string;
  plan?: string;
  createdAt?: string;
  [key: string]: any;
}

interface AnalyticsConfig {
  enabled: boolean;
  apiEndpoint: string;
  batchSize: number;
  flushInterval: number;
  sessionTimeout: number;
  trackPageViews: boolean;
  trackClicks: boolean;
  trackScrollDepth: boolean;
  trackFormInteractions: boolean;
  trackErrors: boolean;
  anonymizeIp: boolean;
  respectDoNotTrack: boolean;
}

class Analytics {
  private config: AnalyticsConfig;
  private eventBuffer: AnalyticsEvent[] = [];
  private pageViewBuffer: PageView[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private pageStartTime: number = Date.now();
  private scrollDepth: number = 0;
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private clickHandlers = new WeakMap<Element, EventListener>();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      apiEndpoint: '/api/analytics',
      batchSize: 20,
      flushInterval: 30000, // 30 seconds
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      trackPageViews: true,
      trackClicks: true,
      trackScrollDepth: true,
      trackFormInteractions: true,
      trackErrors: true,
      anonymizeIp: true,
      respectDoNotTrack: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled && !this.shouldRespectDoNotTrack()) {
      this.initialize();
    }
  }

  private initialize() {
    this.startFlushTimer();
    this.startSessionTimer();
    this.setupEventListeners();
    
    if (this.config.trackPageViews) {
      this.trackPageView();
    }
  }

  // Track custom events
  track(name: string, properties: Record<string, any> = {}) {
    if (!this.isEnabled()) return;

    const { category = 'custom', action = 'event', label, value, ...metadata } = properties;

    const event: AnalyticsEvent = {
      name,
      category,
      action,
      label,
      value,
      metadata,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.eventBuffer.push(event);
    logger.debug('Analytics event tracked', event);

    if (this.eventBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Track page views
  trackPageView(path?: string, title?: string) {
    if (!this.isEnabled() || !this.config.trackPageViews) return;

    // Calculate duration of previous page
    const duration = Date.now() - this.pageStartTime;
    this.pageStartTime = Date.now();

    const pageView: PageView = {
      path: path || window.location.pathname,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      duration,
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.pageViewBuffer.push(pageView);
    logger.debug('Page view tracked', pageView);

    // Reset scroll depth for new page
    this.scrollDepth = 0;

    if (this.pageViewBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Identify user
  identify(userId: string, properties?: UserProperties) {
    if (!this.isEnabled()) return;

    this.userId = userId;
    logger.setUser(userId);

    this.track('user_identified', {
      category: 'user',
      action: 'identify',
      ...properties,
    });

    if (properties) {
      this.updateUserProperties(properties);
    }
  }

  // Update user properties
  updateUserProperties(properties: Partial<UserProperties>) {
    if (!this.isEnabled()) return;

    this.track('user_properties_updated', {
      category: 'user',
      action: 'update',
      ...properties,
    });
  }

  // Track timing
  timing(category: string, variable: string, time: number, label?: string) {
    if (!this.isEnabled()) return;

    this.track('timing', {
      category,
      action: 'timing',
      label: label || variable,
      value: time,
      timingCategory: category,
      timingVar: variable,
    });
  }

  // Track exceptions
  exception(description: string, fatal = false) {
    if (!this.isEnabled() || !this.config.trackErrors) return;

    this.track('exception', {
      category: 'error',
      action: 'exception',
      label: description,
      fatal,
      stack: new Error().stack,
    });
  }

  // Track social interactions
  social(network: string, action: string, target?: string) {
    if (!this.isEnabled()) return;

    this.track('social', {
      category: 'social',
      action,
      label: network,
      socialNetwork: network,
      socialAction: action,
      socialTarget: target,
    });
  }

  // Track e-commerce
  ecommerce(action: string, data: any) {
    if (!this.isEnabled()) return;

    this.track('ecommerce', {
      category: 'ecommerce',
      action,
      ...data,
    });
  }

  // Reset session
  resetSession() {
    this.sessionId = this.generateSessionId();
    this.startSessionTimer();
    logger.info('Analytics session reset');
  }

  // Setup event listeners
  private setupEventListeners() {
    // Track clicks
    if (this.config.trackClicks) {
      document.addEventListener('click', this.handleClick.bind(this), true);
    }

    // Track scroll depth
    if (this.config.trackScrollDepth) {
      let scrollTimer: NodeJS.Timeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => this.trackScrollDepth(), 500);
      });
    }

    // Track form interactions
    if (this.config.trackFormInteractions) {
      document.addEventListener('submit', this.handleFormSubmit.bind(this), true);
      document.addEventListener('change', this.handleFormChange.bind(this), true);
    }

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', {
          category: 'engagement',
          action: 'visibility',
          duration: Date.now() - this.pageStartTime,
        });
        this.flush();
      } else {
        this.track('page_visible', {
          category: 'engagement',
          action: 'visibility',
        });
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    const data: any = {
      category: 'interaction',
      action: 'click',
      label: this.getElementIdentifier(target),
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      text: target.textContent?.substring(0, 100),
    };

    // Special handling for links
    if (target.tagName === 'A') {
      const link = target as HTMLAnchorElement;
      data.href = link.href;
      data.isExternal = link.hostname !== window.location.hostname;
    }

    // Special handling for buttons
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      data.buttonType = target.getAttribute('type') || 'button';
    }

    this.track('element_click', data);
  }

  private handleFormSubmit(event: Event) {
    const form = event.target as HTMLFormElement;
    if (!form || form.tagName !== 'FORM') return;

    this.track('form_submit', {
      category: 'form',
      action: 'submit',
      label: this.getElementIdentifier(form),
      formId: form.id,
      formName: form.name,
      formAction: form.action,
      formMethod: form.method,
    });
  }

  private handleFormChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input || !['INPUT', 'SELECT', 'TEXTAREA'].includes(input.tagName)) return;

    this.track('form_interaction', {
      category: 'form',
      action: 'change',
      label: this.getElementIdentifier(input),
      fieldName: input.name,
      fieldType: input.type,
      fieldId: input.id,
    });
  }

  private trackScrollDepth() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercentage = Math.round(
      ((scrollTop + windowHeight) / documentHeight) * 100
    );

    // Track milestones
    const milestones = [25, 50, 75, 90, 100];
    for (const milestone of milestones) {
      if (scrollPercentage >= milestone && this.scrollDepth < milestone) {
        this.track('scroll_depth', {
          category: 'engagement',
          action: 'scroll',
          label: `${milestone}%`,
          value: milestone,
        });
        this.scrollDepth = milestone;
        break;
      }
    }
  }

  private getElementIdentifier(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private async flush() {
    if (this.eventBuffer.length === 0 && this.pageViewBuffer.length === 0) {
      return;
    }

    const events = [...this.eventBuffer];
    const pageViews = [...this.pageViewBuffer];
    
    this.eventBuffer = [];
    this.pageViewBuffer = [];

    try {
      await apiClient.post(this.config.apiEndpoint, {
        events,
        pageViews,
        sessionId: this.sessionId,
        userId: this.userId,
      });
      
      logger.debug('Analytics data flushed', {
        eventCount: events.length,
        pageViewCount: pageViews.length,
      });
    } catch (error) {
      // Re-add to buffers if failed
      this.eventBuffer.unshift(...events);
      this.pageViewBuffer.unshift(...pageViews);
      logger.error('Failed to flush analytics', error);
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private startSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.resetSession();
    }, this.config.sessionTimeout);
  }

  private generateSessionId(): string {
    return `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isEnabled(): boolean {
    return this.config.enabled && !this.shouldRespectDoNotTrack();
  }

  private shouldRespectDoNotTrack(): boolean {
    if (!this.config.respectDoNotTrack) return false;
    
    return (
      navigator.doNotTrack === '1' ||
      (window as any).doNotTrack === '1' ||
      (navigator as any).msDoNotTrack === '1'
    );
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    this.flush();
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export types
export type { AnalyticsEvent, PageView, UserProperties, AnalyticsConfig };