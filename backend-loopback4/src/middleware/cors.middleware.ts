import { Middleware, MiddlewareContext } from '@loopback/rest';

/**
 * CORS middleware to handle cross-origin requests
 */
export const corsMiddleware: Middleware = async (
  ctx: MiddlewareContext,
  next: () => Promise<unknown>
) => {
  const { request, response } = ctx;
  
  // Allowed origins - production and development
  const allowedOrigins = [
    'https://www.reactfasttraining.co.uk',
    'https://reactfasttraining.co.uk',
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // React dev server fallback
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];
  
  const origin = request.headers.origin as string;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key'
    );
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    response.statusCode = 204;
    response.end();
    return;
  }
  
  // Set CORS headers for actual requests
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  await next();
};