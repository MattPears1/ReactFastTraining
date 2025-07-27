import {
  Middleware,
  MiddlewareContext,
  Next,
  RestMiddlewareGroups,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {LoggingBindings, WinstonLogger} from '@loopback/logging';

export interface ErrorResponse {
  error: {
    statusCode: number;
    name: string;
    message: string;
    code?: string;
    details?: any;
    stack?: string;
  };
}

export const errorHandlerMiddleware: Middleware = async (
  ctx: MiddlewareContext,
  next: Next,
) => {
  try {
    return await next();
  } catch (error: any) {
    const {request, response} = ctx;
    
    // Log error details
    console.error('Request error:', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      error: error.message,
      stack: error.stack,
    });

    // Prepare error response
    const statusCode = error.statusCode || error.status || 500;
    const errorResponse: ErrorResponse = {
      error: {
        statusCode,
        name: error.name || 'Error',
        message: error.message || 'An unexpected error occurred',
      },
    };

    // Add code if available
    if (error.code) {
      errorResponse.error.code = error.code;
    }

    // Add details for validation errors
    if (error.details) {
      errorResponse.error.details = error.details;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
      errorResponse.error.stack = error.stack;
    }

    // Special handling for specific error types
    if (error.name === 'UnauthorizedError') {
      errorResponse.error.statusCode = 401;
      errorResponse.error.message = 'Authentication required';
    } else if (error.name === 'ForbiddenError') {
      errorResponse.error.statusCode = 403;
      errorResponse.error.message = 'Access denied';
    } else if (error.name === 'ValidationError') {
      errorResponse.error.statusCode = 400;
      errorResponse.error.message = 'Validation failed';
    } else if (error.name === 'EntityNotFoundError') {
      errorResponse.error.statusCode = 404;
      errorResponse.error.message = 'Resource not found';
    }

    // Set response
    response.status(statusCode);
    response.json(errorResponse);
  }
};

export const errorHandlerOptions = {
  group: RestMiddlewareGroups.SEND_RESPONSE,
  upstreamGroups: [
    RestMiddlewareGroups.CORS,
    RestMiddlewareGroups.API_SPEC,
    RestMiddlewareGroups.MIDDLEWARE,
    'routes',
    RestMiddlewareGroups.ROUTE_HANDLER,
    RestMiddlewareGroups.INVOKE_METHOD,
  ],
  downstreamGroups: [RestMiddlewareGroups.SEND_RESPONSE],
};