import { pgTable, uuid, varchar, decimal, boolean, timestamp, text, index, integer, date, jsonb } from 'drizzle-orm/pg-core';
import { bookings } from './bookings';
import { users } from './users';

// Payments table - stores all payment records
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).unique().notNull(),
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('GBP').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  paymentMethodType: varchar('payment_method_type', { length: 50 }),
  paymentMethodLast4: varchar('payment_method_last4', { length: 4 }),
  paymentMethodBrand: varchar('payment_method_brand', { length: 50 }),
  receiptUrl: text('receipt_url'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    bookingIdx: index('idx_payments_booking').on(table.bookingId),
    stripeIntentIdx: index('idx_payments_stripe_intent').on(table.stripePaymentIntentId),
    statusIdx: index('idx_payments_status').on(table.status),
    createdIdx: index('idx_payments_created').on(table.createdAt),
  };
});

// Payment logs table - audit trail for all payment events
export const paymentLogs = pgTable('payment_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventSource: varchar('event_source', { length: 50 }).default('system'),
  eventData: jsonb('event_data').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    paymentIdx: index('idx_payment_logs_payment').on(table.paymentId),
    eventTypeIdx: index('idx_payment_logs_event_type').on(table.eventType),
    createdIdx: index('idx_payment_logs_created').on(table.createdAt),
  };
});

// Refunds table - manages refund requests and processing
export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id),
  paymentId: uuid('payment_id').notNull().references(() => payments.id),
  stripeRefundId: varchar('stripe_refund_id', { length: 255 }).unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  requestedBy: uuid('requested_by').references(() => users.id),
  requestedAt: timestamp('requested_at').defaultNow(),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  processedAt: timestamp('processed_at'),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    bookingIdx: index('idx_refunds_booking').on(table.bookingId),
    paymentIdx: index('idx_refunds_payment').on(table.paymentId),
    statusIdx: index('idx_refunds_status').on(table.status),
    requestedIdx: index('idx_refunds_requested').on(table.requestedAt),
  };
});

// Invoices table - stores invoice records
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: varchar('invoice_number', { length: 20 }).unique().notNull(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  paymentId: uuid('payment_id').references(() => payments.id),
  issueDate: date('issue_date').notNull().defaultNow(),
  dueDate: date('due_date'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('paid').notNull(),
  pdfUrl: text('pdf_url'),
  pdfGeneratedAt: timestamp('pdf_generated_at'),
  sentAt: timestamp('sent_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    numberIdx: index('idx_invoices_number').on(table.invoiceNumber),
    bookingIdx: index('idx_invoices_booking').on(table.bookingId),
    userIdx: index('idx_invoices_user').on(table.userId),
    issueDateIdx: index('idx_invoices_issue_date').on(table.issueDate),
  };
});

// Webhook events table - stores all incoming webhook events
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripeEventId: varchar('stripe_event_id', { length: 255 }).unique().notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    stripeIdIdx: index('idx_webhook_events_stripe_id').on(table.stripeEventId),
    typeIdx: index('idx_webhook_events_type').on(table.eventType),
    processedIdx: index('idx_webhook_events_processed').on(table.processed),
    createdIdx: index('idx_webhook_events_created').on(table.createdAt),
  };
});

// Type exports
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentLog = typeof paymentLogs.$inferSelect;
export type NewPaymentLog = typeof paymentLogs.$inferInsert;
export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;

// Enum types
export enum PaymentStatus {
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  REQUIRES_CAPTURE = 'requires_capture',
  CANCELED = 'canceled',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  REJECTED = 'rejected',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PAID = 'paid',
  VOID = 'void',
  REFUNDED = 'refunded',
}

export enum PaymentEventType {
  CREATED = 'payment.created',
  UPDATED = 'payment.updated',
  SUCCEEDED = 'payment.succeeded',
  FAILED = 'payment.failed',
  REFUND_REQUESTED = 'refund.requested',
  REFUND_APPROVED = 'refund.approved',
  REFUND_PROCESSED = 'refund.processed',
  REFUND_FAILED = 'refund.failed',
  INVOICE_GENERATED = 'invoice.generated',
  INVOICE_SENT = 'invoice.sent',
  WEBHOOK_RECEIVED = 'webhook.received',
  WEBHOOK_PROCESSED = 'webhook.processed',
}