import {
  post,
  requestBody,
  Request,
  Response,
  RestBindings,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { StripeWebhookService } from '../services/stripe-webhook.service';

export class StripeWebhookController {
  constructor(
    @inject('services.StripeWebhookService')
    private stripeWebhookService: StripeWebhookService,
  ) {}

  /**
   * Handle Stripe webhook events
   * 
   * This endpoint receives webhook events from Stripe for payment processing
   * It handles events like payment confirmation, refunds, disputes, etc.
   */
  @post('/api/webhooks/stripe', {
    responses: {
      '200': {
        description: 'Webhook processed successfully',
      },
      '400': {
        description: 'Bad request - invalid webhook signature',
      },
      '500': {
        description: 'Internal server error',
      },
    },
  })
  async handleStripeWebhook(
    @inject(RestBindings.Http.REQUEST) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @requestBody({
      content: {
        'application/json': {
          'x-parser': 'raw',
        },
      },
    })
    body: Buffer,
  ): Promise<void> {
    try {
      // Get the webhook signature from headers
      const signature = request.headers['stripe-signature'] as string;
      
      if (!signature) {
        response.status(400).send({ error: 'Missing stripe-signature header' });
        return;
      }

      // Convert body buffer to string
      const bodyString = body.toString('utf8');

      // Process the webhook
      await this.stripeWebhookService.handleWebhook(bodyString, signature);

      // Send success response
      response.status(200).send({ received: true });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      
      if (error.message.includes('signature verification failed')) {
        response.status(400).send({ error: 'Invalid signature' });
      } else {
        response.status(500).send({ error: 'Webhook processing failed' });
      }
    }
  }

  /**
   * Manually retry failed webhooks (admin only)
   * 
   * This endpoint allows admins to manually trigger a retry of failed webhook events
   */
  @post('/api/admin/webhooks/retry', {
    responses: {
      '200': {
        description: 'Retry initiated successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                processed: { type: 'number' },
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized',
      },
      '500': {
        description: 'Internal server error',
      },
    },
  })
  async retryFailedWebhooks(): Promise<{message: string; processed: number}> {
    try {
      // TODO: Add authentication/authorization check here
      
      await this.stripeWebhookService.retryFailedWebhooks();
      
      return {
        message: 'Failed webhooks retry initiated',
        processed: 0, // TODO: Return actual count
      };
    } catch (error) {
      console.error('Failed to retry webhooks:', error);
      throw error;
    }
  }
}

// Register raw body parser for Stripe webhooks
export function setupStripeWebhookParser(app: any) {
  // Store the raw body for Stripe signature verification
  app.use('/api/webhooks/stripe', (req: any, res: any, next: any) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  });
}