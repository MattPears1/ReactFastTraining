/**
 * GDPR-compliant visitor tracking utility
 * - No personal data collected
 * - Respects DNT header
 * - Session-based tracking only
 * - Auto-cleanup after session
 */

interface TrackingEvent {
  type: 'pageview' | 'booking_start' | 'booking_complete' | 'booking_cancel';
  page?: string;
  metadata?: Record<string, any>;
}

class VisitorTracker {
  private sessionId: string;
  private apiUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';
  private isTrackingAllowed: boolean;
  
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.isTrackingAllowed = this.checkTrackingPermission();
  }

  /**
   * Check if tracking is allowed (GDPR compliance)
   */
  private checkTrackingPermission(): boolean {
    // Check Do Not Track header
    if (navigator.doNotTrack === '1') {
      console.log('🚫 Visitor tracking disabled - DNT header detected');
      return false;
    }

    // Check if user has opted out via cookie
    const optOut = document.cookie.includes('tracking_opt_out=true');
    if (optOut) {
      console.log('🚫 Visitor tracking disabled - User opted out');
      return false;
    }

    // Check if we have consent (from cookie banner)
    const hasConsent = document.cookie.includes('cookie_consent=accepted');
    if (!hasConsent) {
      console.log('⏸️ Visitor tracking paused - Awaiting consent');
      return false;
    }

    return true;
  }

  /**
   * Get or create anonymous session ID
   */
  private getOrCreateSessionId(): string {
    const storageKey = 'visitor_session_id';
    let sessionId = sessionStorage.getItem(storageKey);
    
    if (!sessionId) {
      // Generate anonymous session ID
      sessionId = `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Track a page view
   */
  trackPageView(page: string): void {
    if (!this.isTrackingAllowed) return;

    this.sendTrackingEvent({
      type: 'pageview',
      page: page,
    });
  }

  /**
   * Track booking funnel events
   */
  trackBookingEvent(event: 'start' | 'complete' | 'cancel', metadata?: any): void {
    if (!this.isTrackingAllowed) return;

    this.sendTrackingEvent({
      type: `booking_${event}` as TrackingEvent['type'],
      metadata: metadata,
    });
  }

  /**
   * Send tracking event to backend
   */
  private async sendTrackingEvent(event: TrackingEvent): Promise<void> {
    try {
      const payload = {
        sessionId: this.sessionId,
        event: event.type,
        page: event.page || window.location.pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        metadata: event.metadata,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        // Anonymous device info
        deviceType: this.getDeviceType(),
      };

      // Send as beacon for reliability
      if ('sendBeacon' in navigator) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`${this.apiUrl}/tracking/event`, blob);
      } else {
        // Fallback to fetch
        fetch(`${this.apiUrl}/tracking/event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {
          // Silently fail - tracking should never break the app
        });
      }
    } catch (error) {
      // Silently fail
      console.debug('Tracking error:', error);
    }
  }

  /**
   * Detect device type
   */
  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Update consent status
   */
  updateConsent(hasConsent: boolean): void {
    this.isTrackingAllowed = hasConsent && this.checkTrackingPermission();
    
    if (hasConsent) {
      console.log('✅ Visitor tracking enabled');
    } else {
      console.log('🚫 Visitor tracking disabled');
    }
  }

  /**
   * Opt out of tracking
   */
  optOut(): void {
    document.cookie = 'tracking_opt_out=true; max-age=31536000; path=/';
    this.isTrackingAllowed = false;
    console.log('🚫 User opted out of tracking');
  }
}

// Create singleton instance
export const visitorTracker = new VisitorTracker();

// Auto-track page views on route change
if (typeof window !== 'undefined') {
  let currentPath = window.location.pathname;
  
  // Track initial page view
  setTimeout(() => {
    visitorTracker.trackPageView(currentPath);
  }, 100);

  // Track route changes (for SPA)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        visitorTracker.trackPageView(currentPath);
      }
    }, 0);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        visitorTracker.trackPageView(currentPath);
      }
    }, 0);
  };

  // Also listen for popstate (back/forward buttons)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        visitorTracker.trackPageView(currentPath);
      }
    }, 0);
  });
}