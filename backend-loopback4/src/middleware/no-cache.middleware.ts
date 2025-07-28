import { Middleware, MiddlewareContext } from '@loopback/rest';

/**
 * Middleware to disable all caching on API responses
 */
export const noCacheMiddleware: Middleware = async (
  ctx: MiddlewareContext,
  next: () => Promise<void>,
) => {
  await next();
  
  // Set headers to prevent any caching
  const { response } = ctx;
  response.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.set('Pragma', 'no-cache');
  response.set('Expires', '0');
  response.set('Surrogate-Control', 'no-store');
  
  // Additional headers to ensure no caching
  response.set('X-Cache-Control', 'no-cache');
  response.set('Vary', '*');
  
  return;
};