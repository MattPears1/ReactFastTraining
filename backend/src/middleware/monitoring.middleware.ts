import { Request, Response, NextFunction } from 'express';
import { monitoring } from '../services/monitoring/monitoring.service';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  
  // Track request start
  monitoring.trackEvent('api.request.start', {
    method: req.method,
    path: req.path,
    requestId: req.requestId,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function(data: any) {
    res.locals.responseBody = data;
    return originalJson.call(this, data);
  };

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    
    monitoring.trackApiCall(
      req.path,
      req.method,
      res.statusCode,
      duration
    );

    monitoring.trackEvent('api.request.complete', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: req.requestId,
      responseSize: res.get('content-length'),
    });

    // Log slow requests
    if (duration > 1000) {
      monitoring.trackEvent('api.request.slow', {
        method: req.method,
        path: req.path,
        duration,
        requestId: req.requestId,
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      monitoring.trackEvent('api.request.error', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestId: req.requestId,
        error: res.locals.error || res.locals.responseBody,
      });
    }
  });

  next();
};

export const errorMonitoringMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const context = {
    method: req.method,
    path: req.path,
    requestId: req.requestId,
    query: req.query,
    body: req.body,
    user: (req as any).user,
    statusCode: res.statusCode || 500,
  };

  // Remove sensitive data
  if (context.body) {
    delete context.body.password;
    delete context.body.creditCard;
    delete context.body.ssn;
  }

  monitoring.trackError(error, context);

  // Store error for response logging
  res.locals.error = {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };

  next(error);
};

export const performanceMiddleware = (name: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const timerLabel = `${name}-${req.requestId}`;
    monitoring.startTimer(timerLabel);

    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      monitoring.endTimer(timerLabel, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      });
      return originalEnd.apply(this, args);
    };

    next();
  };
};