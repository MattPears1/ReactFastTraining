import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { Express } from 'express';

export const initSentry = (app: Express) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
        new Tracing.Integrations.Postgres(),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request?.data) {
          delete event.request.data.password;
          delete event.request.data.creditCard;
          delete event.request.data.ssn;
        }
        
        // Don't send 404 errors
        if (event.exception?.values?.[0]?.value?.includes('404')) {
          return null;
        }
        
        return event;
      },
    });
  }
};

export const sentryRequestHandler = () => Sentry.Handlers.requestHandler();

export const sentryTracingHandler = () => Sentry.Handlers.tracingHandler();

export const sentryErrorHandler = () => Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture only 4xx and 5xx errors
    if (error.status && error.status >= 400) {
      return true;
    }
    return false;
  },
});

export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error(error);
  
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(error);
    });
  }
};

export const captureMessage = (message: string, level: Sentry.Severity = Sentry.Severity.Info) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};

export const setUserContext = (user: { id: string; email: string; role?: string }) => {
  Sentry.setUser(user);
};

export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op });
};

// Performance monitoring helper
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const transaction = startTransaction(operation, 'function');
  
  try {
    const result = await fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
};