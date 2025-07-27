import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import { RestBindings, Request } from '@loopback/rest';
import { inject } from '@loopback/core';

/**
 * Middleware to handle raw body parsing for Stripe webhooks
 * This is critical for webhook signature verification
 */
@injectable({ tags: { key: StripeWebhookMiddleware.BINDING_KEY } })
export class StripeWebhookMiddleware implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${StripeWebhookMiddleware.name}`;

  constructor() {}

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<InvocationResult> {
    const request = await invocationCtx.get<Request>(RestBindings.Http.REQUEST);
    
    // Only apply to Stripe webhook endpoint
    if (request.path === '/api/webhooks/stripe' && request.method === 'POST') {
      // Store raw body for signature verification
      let rawBody = '';
      
      request.on('data', (chunk) => {
        rawBody += chunk.toString();
      });
      
      await new Promise((resolve) => {
        request.on('end', resolve);
      });
      
      // Store raw body in request for later use
      (request as any).rawBody = rawBody;
    }
    
    const result = await next();
    return result;
  }
}

/**
 * Configuration for raw body parsing on specific routes
 */
export function configureWebhookRoutes(app: any) {
  // Configure express to parse raw body for webhook endpoint
  app.expressServer.use('/api/webhooks/stripe', (req: any, res: any, next: any) => {
    if (req.method === 'POST') {
      let rawBody = '';
      
      req.on('data', (chunk: any) => {
        rawBody += chunk.toString('utf8');
      });
      
      req.on('end', () => {
        req.rawBody = rawBody;
        // Parse JSON for regular body access
        try {
          req.body = JSON.parse(rawBody);
        } catch (e) {
          // If JSON parsing fails, leave body as is
        }
        next();
      });
    } else {
      next();
    }
  });
}