import Stripe from 'stripe';
import { db } from '../../config/database.config';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { StripeErrorService } from './stripe-error.service';
import { StripeRetryService } from './stripe-retry.service';

export class StripeCustomerService {
  constructor(
    private stripe: Stripe,
    private errorService: StripeErrorService,
    private retryService: StripeRetryService
  ) {}

  /**
   * Create or retrieve a Stripe customer
   */
  async getOrCreateCustomer(
    userId: number,
    email: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      // Check if user already has a Stripe customer ID
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (user?.stripeCustomerId) {
        // Verify customer still exists in Stripe
        try {
          await this.retryService.executeWithRetry(
            () => this.stripe.customers.retrieve(user.stripeCustomerId!)
          );
          return user.stripeCustomerId;
        } catch (error) {
          // Customer doesn't exist in Stripe, create new one
          console.warn(`Stripe customer ${user.stripeCustomerId} not found, creating new`);
        }
      }

      // Create new customer
      const customer = await this.retryService.executeWithRetry(() =>
        this.stripe.customers.create({
          email,
          metadata: {
            userId: userId.toString(),
            ...metadata,
          },
        })
      );

      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId: customer.id })
        .where(eq(users.id, userId));

      return customer.id;
    } catch (error) {
      throw this.errorService.handleError(error, 'customer_creation');
    }
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerId: string,
    updates: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    try {
      return await this.retryService.executeWithRetry(() =>
        this.stripe.customers.update(customerId, updates)
      );
    } catch (error) {
      throw this.errorService.handleError(error, 'customer_update');
    }
  }

  /**
   * List customer's payment methods
   */
  async listPaymentMethods(
    customerId: string,
    type: 'card' | 'bank_account' = 'card'
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const response = await this.retryService.executeWithRetry(() =>
        this.stripe.paymentMethods.list({
          customer: customerId,
          type,
        })
      );
      return response.data;
    } catch (error) {
      throw this.errorService.handleError(error, 'list_payment_methods');
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.retryService.executeWithRetry(() =>
        this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        })
      );
    } catch (error) {
      throw this.errorService.handleError(error, 'attach_payment_method');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await this.retryService.executeWithRetry(() =>
        this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })
      );
    } catch (error) {
      throw this.errorService.handleError(error, 'set_default_payment_method');
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.retryService.executeWithRetry(() =>
        this.stripe.customers.del(customerId)
      );
    } catch (error) {
      throw this.errorService.handleError(error, 'delete_customer');
    }
  }
}