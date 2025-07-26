export interface IPaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingAddress?: IBillingAddress;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  CRYPTO = 'crypto'
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  RAZORPAY = 'razorpay',
  CRYPTO_PROCESSOR = 'crypto_processor'
}

export interface IBillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface IPayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerPaymentId: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
  failureReason?: string;
  refundedAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export interface ISubscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  provider: PaymentProvider;
  providerSubscriptionId: string;
  paymentMethodId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  PAUSED = 'paused'
}

export interface ISubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: PlanInterval;
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum PlanInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

export interface IInvoice {
  id: string;
  userId: string;
  subscriptionId?: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  dueDate?: Date;
  paidAt?: Date;
  items: IInvoiceItem[];
  billingAddress?: IBillingAddress;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible'
}

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  tax?: number;
  metadata?: Record<string, any>;
}

export interface IRefund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: RefundStatus;
  provider: PaymentProvider;
  providerRefundId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum RefundStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

export interface IPaymentIntent {
  amount: number;
  currency: string;
  paymentMethodTypes?: PaymentMethodType[];
  description?: string;
  metadata?: Record<string, any>;
  setupFutureUsage?: boolean;
  captureMethod?: 'automatic' | 'manual';
}

export interface ICheckoutSession {
  id: string;
  url: string;
  successUrl: string;
  cancelUrl: string;
  lineItems: ILineItem[];
  mode: 'payment' | 'subscription';
  expiresAt: Date;
}

export interface ILineItem {
  name: string;
  description?: string;
  images?: string[];
  amount: number;
  currency: string;
  quantity: number;
}

export interface IPaymentProvider {
  createPaymentIntent(intent: IPaymentIntent): Promise<any>;
  confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<IPayment>;
  createRefund(paymentId: string, amount?: number, reason?: string): Promise<IRefund>;
  createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<ISubscription>;
  cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<ISubscription>;
  updateSubscription(subscriptionId: string, planId: string): Promise<ISubscription>;
  createCheckoutSession(options: any): Promise<ICheckoutSession>;
  handleWebhook(payload: any, signature: string): Promise<any>;
}