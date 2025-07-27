import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initSentry = () => {
  // Skip Sentry initialization if no DSN provided to prevent errors
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry DSN not provided, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_ENV || 'development',
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: import.meta.env.VITE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
        
        // Add user context if available
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          event.user = {
            id: userData.id,
            email: userData.email,
          };
        }
        
        return event;
      },
    });
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error(error);
  
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(error);
    });
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};

export const setUserContext = (user: { id: string; email: string; name?: string }) => {
  Sentry.setUser(user);
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};