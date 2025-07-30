// Sentry configuration with graceful fallback
let Sentry: any;
let BrowserTracing: any;

try {
  Sentry = require("@sentry/react");
  BrowserTracing = require("@sentry/tracing").BrowserTracing;
} catch (error) {
  console.log("[Sentry] Module not available, using stub implementation");
  // Stub implementation for when Sentry is not available
  Sentry = {
    init: () => {},
    captureException: () => {},
    captureMessage: () => {},
    setUser: () => {},
    addBreadcrumb: () => {},
    withScope: (callback: any) => callback({ setContext: () => {} }),
    Replay: class {
      constructor() {}
    },
    SeverityLevel: {
      info: "info",
      warning: "warning",
      error: "error",
    },
  };
}

export const initSentry = () => {
  // Skip Sentry initialization if no DSN provided to prevent errors
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log("[Sentry] DSN not provided, skipping initialization");
    return;
  }

  try {
    if (Sentry && Sentry.init) {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_ENV || "development",
        integrations: BrowserTracing ? [
          new BrowserTracing(),
          new Sentry.Replay({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ] : [],
        tracesSampleRate: import.meta.env.VITE_ENV === "production" ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event: any, hint: any) {
          // Filter out known non-critical errors
          if (event.exception?.values?.[0]?.type === "NetworkError") {
            return null;
          }

          // Add user context if available
          const user = localStorage.getItem("user");
          if (user) {
            try {
              const userData = JSON.parse(user);
              event.user = {
                id: userData.id,
                email: userData.email,
              };
            } catch (e) {
              console.error("[Sentry] Failed to parse user data:", e);
            }
          }

          return event;
        },
      });
      console.log("[Sentry] Initialized successfully");
    }
  } catch (error) {
    console.error("[Sentry] Failed to initialize:", error);
  }
};

export const captureException = (
  error: Error,
  context?: Record<string, any>,
) => {
  console.error(error);

  if (import.meta.env.VITE_SENTRY_DSN && Sentry && Sentry.captureException) {
    try {
      Sentry.withScope((scope: any) => {
        if (context) {
          scope.setContext("additional", context);
        }
        Sentry.captureException(error);
      });
    } catch (e) {
      console.error("[Sentry] Failed to capture exception:", e);
    }
  }
};

export const captureMessage = (
  message: string,
  level: string = "info",
) => {
  if (import.meta.env.VITE_SENTRY_DSN && Sentry && Sentry.captureMessage) {
    try {
      Sentry.captureMessage(message, level);
    } catch (e) {
      console.error("[Sentry] Failed to capture message:", e);
    }
  }
};

export const setUserContext = (user: {
  id: string;
  email: string;
  name?: string;
}) => {
  if (Sentry && Sentry.setUser) {
    try {
      Sentry.setUser(user);
    } catch (e) {
      console.error("[Sentry] Failed to set user context:", e);
    }
  }
};

export const addBreadcrumb = (breadcrumb: any) => {
  if (Sentry && Sentry.addBreadcrumb) {
    try {
      Sentry.addBreadcrumb(breadcrumb);
    } catch (e) {
      console.error("[Sentry] Failed to add breadcrumb:", e);
    }
  }
};