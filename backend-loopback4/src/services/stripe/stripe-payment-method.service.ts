import Stripe from 'stripe';
import { StripeErrorService } from './stripe-error.service';
import { StripeRetryService } from './stripe-retry.service';

export interface PaymentMethodDetails {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  bankAccount?: {
    last4: string;
    bankName: string;
  };
}

export class StripePaymentMethodService {
  constructor(
    private stripe: Stripe,
    private errorService: StripeErrorService,
    private retryService: StripeRetryService
  ) {}

  /**
   * Create a payment method
   */
  async createPaymentMethod(
    params: Stripe.PaymentMethodCreateParams
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.retryService.executeWithRetry(() =>
        this.stripe.paymentMethods.create(params)
      );
    } catch (error) {
      throw this.errorService.handleError(error, 'create_payment_method');
    }
  }

  /**
   * Retrieve payment method details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethodDetails> {
    try {
      const paymentMethod = await this.retryService.executeWithRetry(() =>
        this.stripe.paymentMethods.retrieve(paymentMethodId)
      );

      const details: PaymentMethodDetails = {
        id: paymentMethod.id,
        type: paymentMethod.type,
      };

      if (paymentMethod.card) {
        details.card = {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        };
      }

      if (paymentMethod.us_bank_account) {
        details.bankAccount = {
          last4: paymentMethod.us_bank_account.last4,
          bankName: paymentMethod.us_bank_account.bank_name,
        };
      }

      return details;
    } catch (error) {
      throw this.errorService.handleError(error, 'get_payment_method');
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    params: Stripe.PaymentMethodUpdateParams
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.retryService.executeWithRetry(() =>
        this.stripe.paymentMethods.update(paymentMethodId, params)
      );
    } catch (error) {
      throw this.errorService.handleError(error, 'update_payment_method');
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this.retryService.executeWithRetry(() =>
        this.stripe.paymentMethods.detach(paymentMethodId)
      );
    } catch (error) {
      throw this.errorService.handleError(error, 'detach_payment_method');
    }
  }

  /**
   * Validate payment method for specific amount
   */
  async validatePaymentMethod(
    paymentMethodId: string,
    amount: number,
    currency: string = 'gbp'
  ): Promise<boolean> {
    try {
      // Create a test payment intent to validate the payment method
      const intent = await this.stripe.paymentIntents.create({
        amount: 100, // £1.00 test charge
        currency,
        payment_method: paymentMethodId,
        confirm: false,
        setup_future_usage: 'off_session',
        metadata: {
          validation_test: 'true',
        },
      });

      // Cancel the test intent immediately
      await this.stripe.paymentIntents.cancel(intent.id);

      return intent.status !== 'requires_payment_method';
    } catch (error) {
      console.error('Payment method validation failed:', error);
      return false;
    }
  }

  /**
   * Clone payment method for another customer
   */
  async clonePaymentMethod(
    paymentMethodId: string,
    targetCustomerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const originalMethod = await this.getPaymentMethod(paymentMethodId);
      
      if (originalMethod.type !== 'card') {
        throw new Error('Only card payment methods can be cloned');
      }

      // Create new payment method with same details
      const clonedMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: await this.createTokenFromPaymentMethod(paymentMethodId),
        },
      });

      // Attach to target customer
      await this.stripe.paymentMethods.attach(clonedMethod.id, {
        customer: targetCustomerId,
      });

      return clonedMethod;
    } catch (error) {
      throw this.errorService.handleError(error, 'clone_payment_method');
    }
  }

  /**
   * Create token from payment method (helper for cloning)
   */
  private async createTokenFromPaymentMethod(paymentMethodId: string): Promise<string> {
    // This is a placeholder - actual implementation would require
    // additional Stripe configuration for tokenization
    throw new Error('Token creation not implemented');
  }
}