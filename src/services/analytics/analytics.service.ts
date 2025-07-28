import {
  getCookieConsent,
  hasCookieConsent,
} from "@/components/ui/CookieConsent";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    _gaq?: any[];
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
  properties?: Record<string, any>;
}

export interface PageViewEvent {
  url: string;
  title: string;
  referrer?: string;
  sessionId?: string;
  userId?: string;
}

export interface EcommerceEvent {
  event:
    | "purchase"
    | "add_to_cart"
    | "remove_from_cart"
    | "view_item"
    | "begin_checkout";
  currency?: string;
  value?: number;
  items?: EcommerceItem[];
  transaction_id?: string;
  shipping?: number;
  tax?: number;
  coupon?: string;
}

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  currency?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  company?: string;
  role?: string;
  signUpDate?: string;
  [key: string]: any;
}

export interface ConversionEvent {
  conversionId: string;
  value?: number;
  currency?: string;
  transactionId?: string;
}

class AnalyticsService {
  private initialized = false;
  private measurementId: string | null = null;
  private apiEndpoint = "/api/analytics";
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: any[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupOfflineHandling();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupOfflineHandling() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flushEventQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private async flushEventQueue() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      await this.sendToServer(event);
    }
  }

  initialize(measurementId: string) {
    if (this.initialized || !hasCookieConsent("analytics")) {
      return;
    }

    this.measurementId = measurementId;
    this.loadGoogleAnalytics();
    this.initialized = true;
  }

  private loadGoogleAnalytics() {
    if (!this.measurementId) return;

    // Load gtag.js script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", this.measurementId, {
      anonymize_ip: true,
      cookie_flags: "SameSite=None;Secure",
      send_page_view: false, // We'll send manually
    });

    // Set default consent state
    window.gtag("consent", "default", {
      analytics_storage: hasCookieConsent("analytics") ? "granted" : "denied",
      ad_storage: hasCookieConsent("marketing") ? "granted" : "denied",
      functionality_storage: hasCookieConsent("preferences")
        ? "granted"
        : "denied",
      personalization_storage: hasCookieConsent("preferences")
        ? "granted"
        : "denied",
      security_storage: "granted",
    });
  }

  updateConsent() {
    if (!window.gtag) return;

    window.gtag("consent", "update", {
      analytics_storage: hasCookieConsent("analytics") ? "granted" : "denied",
      ad_storage: hasCookieConsent("marketing") ? "granted" : "denied",
      functionality_storage: hasCookieConsent("preferences")
        ? "granted"
        : "denied",
      personalization_storage: hasCookieConsent("preferences")
        ? "granted"
        : "denied",
    });
  }

  setUser(userId: string, properties?: UserProperties) {
    this.userId = userId;

    if (window.gtag && hasCookieConsent("analytics")) {
      window.gtag("set", { user_id: userId });

      if (properties) {
        window.gtag(
          "set",
          "user_properties",
          this.sanitizeProperties(properties),
        );
      }
    }

    // Send to internal analytics
    this.sendToServer({
      type: "identify",
      userId,
      properties,
      timestamp: new Date().toISOString(),
    });
  }

  clearUser() {
    this.userId = null;

    if (window.gtag) {
      window.gtag("set", { user_id: null });
    }
  }

  trackEvent(event: AnalyticsEvent) {
    if (!hasCookieConsent("analytics")) {
      return;
    }

    const eventData = {
      ...event,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...this.sanitizeProperties(event.properties || {}),
      });
    }

    // Send to internal analytics
    this.sendToServer({
      type: "event",
      ...eventData,
    });
  }

  trackPageView(pageView: PageViewEvent) {
    if (!hasCookieConsent("analytics")) {
      return;
    }

    const pageData = {
      ...pageView,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_title: pageView.title,
        page_location: pageView.url,
        page_referrer: pageView.referrer,
      });
    }

    // Send to internal analytics
    this.sendToServer({
      type: "pageview",
      ...pageData,
    });
  }

  trackEcommerce(event: EcommerceEvent) {
    if (!hasCookieConsent("analytics")) {
      return;
    }

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", event.event, {
        currency: event.currency || "USD",
        value: event.value,
        items: event.items,
        transaction_id: event.transaction_id,
        shipping: event.shipping,
        tax: event.tax,
        coupon: event.coupon,
      });
    }

    // Send to internal analytics
    this.sendToServer({
      type: "ecommerce",
      ...event,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
    });
  }

  trackConversion(conversion: ConversionEvent) {
    if (!hasCookieConsent("analytics")) {
      return;
    }

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", "conversion", {
        send_to: `${this.measurementId}/${conversion.conversionId}`,
        value: conversion.value,
        currency: conversion.currency || "USD",
        transaction_id: conversion.transactionId,
      });
    }

    // Send to internal analytics
    this.sendToServer({
      type: "conversion",
      ...conversion,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
    });
  }

  trackTiming(
    category: string,
    variable: string,
    value: number,
    label?: string,
  ) {
    if (!hasCookieConsent("analytics")) {
      return;
    }

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", "timing_complete", {
        name: variable,
        value: Math.round(value),
        event_category: category,
        event_label: label,
      });
    }

    // Send to internal analytics
    this.sendToServer({
      type: "timing",
      category,
      variable,
      value,
      label,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
    });
  }

  trackError(error: Error, fatal: boolean = false) {
    // Always track errors for debugging
    const errorData = {
      type: "error",
      message: error.message,
      stack: error.stack,
      fatal,
      url: window.location.href,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Send to Google Analytics if consented
    if (window.gtag && hasCookieConsent("analytics")) {
      window.gtag("event", "exception", {
        description: error.message,
        fatal: fatal,
      });
    }

    // Always send errors to internal analytics for debugging
    this.sendToServer(errorData);
  }

  trackSocialInteraction(network: string, action: string, target?: string) {
    if (!hasCookieConsent("analytics")) {
      return;
    }

    this.trackEvent({
      category: "social",
      action: `${network}_${action}`,
      label: target,
    });
  }

  trackSearch(searchTerm: string, resultsCount?: number) {
    if (!hasCookieConsent("analytics")) {
      return;
    }

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", "search", {
        search_term: searchTerm,
      });
    }

    // Send to internal analytics
    this.trackEvent({
      category: "search",
      action: "search",
      label: searchTerm,
      value: resultsCount,
      properties: {
        search_term: searchTerm,
        results_count: resultsCount,
      },
    });
  }

  private sanitizeProperties(
    properties: Record<string, any>,
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      // Remove sensitive data
      if (this.isSensitiveField(key)) {
        continue;
      }

      // Ensure valid types for GA4
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        sanitized[key] = value;
      } else if (value instanceof Date) {
        sanitized[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.join(",");
      }
    }

    return sanitized;
  }

  private isSensitiveField(field: string): boolean {
    const sensitiveFields = [
      "password",
      "ssn",
      "social_security",
      "credit_card",
      "cvv",
      "pin",
      "api_key",
      "secret",
      "token",
    ];

    const fieldLower = field.toLowerCase();
    return sensitiveFields.some((sensitive) => fieldLower.includes(sensitive));
  }

  private async sendToServer(data: any) {
    try {
      if (!this.isOnline) {
        this.eventQueue.push(data);
        return;
      }

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to send analytics data:", error);
      // Queue for retry
      this.eventQueue.push(data);
    }
  }

  // Debug method
  debug() {
    console.log("Analytics Debug Info:", {
      initialized: this.initialized,
      measurementId: this.measurementId,
      sessionId: this.sessionId,
      userId: this.userId,
      consent: getCookieConsent(),
      queueLength: this.eventQueue.length,
      isOnline: this.isOnline,
    });
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();
