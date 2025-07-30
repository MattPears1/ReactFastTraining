import { logger } from "./logger";
import { apiClient } from "@services/api/enhanced-client";

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent: string;
  timestamp: string;
  url: string;
  type: "error" | "unhandledRejection" | "componentError";
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, any>;
  breadcrumbs: Breadcrumb[];
  userId?: string;
  sessionId: string;
}

interface Breadcrumb {
  type: "navigation" | "click" | "console" | "xhr" | "custom";
  category: string;
  message: string;
  timestamp: string;
  data?: any;
}

interface ErrorTrackerConfig {
  enabled: boolean;
  apiEndpoint: string;
  maxBreadcrumbs: number;
  ignoredErrors: RegExp[];
  sampleRate: number;
  beforeSend?: (error: ErrorInfo) => ErrorInfo | null;
  enableSourceMaps: boolean;
  enableConsoleLogs: boolean;
}

class ErrorTracker {
  private config: ErrorTrackerConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private errorCount = 0;
  private errorRateLimit = 10; // Max errors per minute
  private errorTimestamps: number[] = [];

  constructor(config: Partial<ErrorTrackerConfig> = {}) {
    this.config = {
      enabled: true,
      apiEndpoint: "/api/errors",
      maxBreadcrumbs: 50,
      ignoredErrors: [
        /ResizeObserver loop limit exceeded/,
        /Non-Error promise rejection captured/,
        /Network request failed/,
      ],
      sampleRate: 1.0,
      enableSourceMaps: true,
      enableConsoleLogs: process.env.NODE_ENV === "development",
      ...config,
    };

    this.sessionId = this.generateSessionId();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize() {
    this.setupErrorHandlers();
    this.setupBreadcrumbTracking();
    this.setupConsoleInterception();
  }

  // Capture error manually
  captureError(error: Error | string, context?: Record<string, any>) {
    if (!this.shouldCaptureError(error)) return;

    const errorInfo = this.createErrorInfo(error, "error", context);
    this.sendError(errorInfo);
  }

  // Capture component error
  captureComponentError(
    error: Error,
    errorInfo: { componentStack: string },
    context?: Record<string, any>,
  ) {
    if (!this.shouldCaptureError(error)) return;

    const info = this.createErrorInfo(error, "componentError", {
      ...context,
      componentStack: errorInfo.componentStack,
    });

    this.sendError(info);
  }

  // Add breadcrumb
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, "timestamp">) {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    });

    // Maintain max breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  // Set user context
  setUser(userId: string | null) {
    this.userId = userId;
  }

  // Setup error handlers
  private setupErrorHandlers() {
    // Global error handler
    window.addEventListener("error", (event) => {
      if (!this.shouldCaptureError(event.error || event.message)) return;

      const errorInfo = this.createErrorInfo(
        event.error || event.message,
        "error",
        {
          fileName: event.filename,
          lineNumber: event.lineno,
          columnNumber: event.colno,
        },
      );

      this.sendError(errorInfo);
    });

    // Unhandled promise rejection
    window.addEventListener("unhandledrejection", (event) => {
      if (!this.shouldCaptureError(event.reason)) return;

      const errorInfo = this.createErrorInfo(
        event.reason,
        "unhandledRejection",
        {
          promise: event.promise,
        },
      );

      this.sendError(errorInfo);
    });
  }

  // Setup breadcrumb tracking
  private setupBreadcrumbTracking() {
    // Navigation
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      this.addBreadcrumb({
        type: "navigation",
        category: "navigation",
        message: `Navigated to ${args[2]}`,
        data: { url: args[2] },
      });
      originalPushState.apply(history, args);
    };

    // Clicks
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target as HTMLElement;
        if (!target) return;

        this.addBreadcrumb({
          type: "click",
          category: "ui",
          message: `Clicked ${this.getElementPath(target)}`,
          data: {
            tagName: target.tagName,
            id: target.id,
            className: target.className,
            text: target.textContent?.substring(0, 100),
          },
        });
      },
      true,
    );

    // XHR/Fetch
    this.interceptXHR();
    this.interceptFetch();
  }

  // Intercept console methods
  private setupConsoleInterception() {
    if (!this.config.enableConsoleLogs) return;

    const methods: Array<keyof Console> = ["log", "warn", "error", "info"];

    methods.forEach((method) => {
      const original = console[method];
      (console as any)[method] = (...args: any[]) => {
        this.addBreadcrumb({
          type: "console",
          category: "console",
          message: args
            .map((arg) =>
              typeof arg === "object" ? JSON.stringify(arg) : String(arg),
            )
            .join(" "),
          data: { level: method },
        });
        original.apply(console, args);
      };
    });
  }

  // Intercept XHR
  private interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      this._errorTrackerMethod = method;
      this._errorTrackerUrl = url;
      originalOpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function (...args) {
      const startTime = Date.now();

      this.addEventListener("load", () => {
        const duration = Date.now() - startTime;
        const tracker = (window as any).errorTracker;

        tracker?.addBreadcrumb({
          type: "xhr",
          category: "network",
          message: `${this._errorTrackerMethod} ${this._errorTrackerUrl}`,
          data: {
            method: this._errorTrackerMethod,
            url: this._errorTrackerUrl,
            status: this.status,
            duration,
          },
        });
      });

      originalSend.apply(this, args);
    };
  }

  // Intercept Fetch
  private interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = Date.now();
      const [resource, config] = args;
      const method = config?.method || "GET";
      const url = typeof resource === "string" ? resource : resource.url;

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        this.addBreadcrumb({
          type: "xhr",
          category: "network",
          message: `${method} ${url}`,
          data: {
            method,
            url,
            status: response.status,
            duration,
          },
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.addBreadcrumb({
          type: "xhr",
          category: "network",
          message: `${method} ${url} (failed)`,
          data: {
            method,
            url,
            error: error instanceof Error ? error.message : "Unknown error",
            duration,
          },
        });

        throw error;
      }
    };
  }

  // Create error info object
  private createErrorInfo(
    error: Error | string,
    type: ErrorInfo["type"],
    context?: any,
  ): ErrorInfo {
    const isError = error instanceof Error;
    const message = isError ? error.message : String(error);
    const stack = isError ? error.stack : undefined;

    return {
      message,
      stack,
      componentStack: context?.componentStack,
      fileName: context?.fileName,
      lineNumber: context?.lineNumber,
      columnNumber: context?.columnNumber,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      type,
      severity: this.calculateSeverity(error, type),
      context,
      breadcrumbs: [...this.breadcrumbs],
      userId: this.userId,
      sessionId: this.sessionId,
    };
  }

  // Calculate error severity
  private calculateSeverity(
    error: Error | string,
    type: ErrorInfo["type"],
  ): ErrorInfo["severity"] {
    // Critical: Security errors, auth failures
    if (/security|auth|permission|forbidden/i.test(String(error))) {
      return "critical";
    }

    // High: Component errors, syntax errors
    if (
      type === "componentError" ||
      /syntax|reference|type/i.test(String(error))
    ) {
      return "high";
    }

    // Medium: Network errors, promise rejections
    if (
      type === "unhandledRejection" ||
      /network|fetch|xhr/i.test(String(error))
    ) {
      return "medium";
    }

    return "low";
  }

  // Check if error should be captured
  private shouldCaptureError(error: Error | string): boolean {
    if (!this.config.enabled) return false;

    // Check sample rate
    if (Math.random() > this.config.sampleRate) return false;

    // Check rate limiting
    if (!this.checkRateLimit()) return false;

    // Check ignored patterns
    const errorString = String(error);
    for (const pattern of this.config.ignoredErrors) {
      if (pattern.test(errorString)) return false;
    }

    return true;
  }

  // Check rate limiting
  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old timestamps
    this.errorTimestamps = this.errorTimestamps.filter(
      (ts) => ts > oneMinuteAgo,
    );

    if (this.errorTimestamps.length >= this.errorRateLimit) {
      logger.warn("Error rate limit exceeded");
      return false;
    }

    this.errorTimestamps.push(now);
    return true;
  }

  // Send error to backend
  private async sendError(errorInfo: ErrorInfo) {
    try {
      // Apply beforeSend hook
      if (this.config.beforeSend) {
        const modified = this.config.beforeSend(errorInfo);
        if (!modified) return;
        errorInfo = modified;
      }

      // Log to console in development
      if (this.config.enableConsoleLogs) {
        console.error("[ErrorTracker]", errorInfo);
      }

      // Send to backend
      await apiClient.post(this.config.apiEndpoint, errorInfo);

      this.errorCount++;
      logger.info("Error tracked", { errorCount: this.errorCount });
    } catch (error) {
      logger.error("Failed to send error", error);
    }
  }

  // Get element path for breadcrumbs
  private getElementPath(element: HTMLElement): string {
    const path = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${current.className.split(" ")[0]}`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  private generateSessionId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Make available globally for interceptors
(window as any).errorTracker = errorTracker;

// Export types
export type { ErrorInfo, Breadcrumb, ErrorTrackerConfig };
