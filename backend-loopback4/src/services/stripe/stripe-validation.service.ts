import { PaymentError } from './stripe-error.service';
import * as crypto from 'crypto';

export interface CreatePaymentIntentData {
  amount: number; // in pounds
  bookingId: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, string>;
  statementDescriptor?: string;
  description?: string;
  setupFutureUsage?: 'on_session' | 'off_session';
  savePaymentMethod?: boolean;
}

export class StripeValidationService {
  static validatePaymentData(data: CreatePaymentIntentData): void {
    if (!data.amount || data.amount <= 0) {
      throw new PaymentError('Invalid payment amount', 'INVALID_AMOUNT', 400);
    }

    if (!data.bookingId) {
      throw new PaymentError('Booking ID is required', 'MISSING_BOOKING_ID', 400);
    }

    if (!data.customerEmail || !this.isValidEmail(data.customerEmail)) {
      throw new PaymentError('Valid customer email is required', 'INVALID_EMAIL', 400);
    }

    // Validate amount precision (max 2 decimal places)
    if (Math.round(data.amount * 100) !== data.amount * 100) {
      throw new PaymentError(
        'Amount must have maximum 2 decimal places',
        'INVALID_AMOUNT_PRECISION',
        400
      );
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static generateIdempotencyKey(bookingId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${bookingId}-${timestamp}-${random}`;
  }

  static convertToPence(pounds: number): number {
    return Math.round(pounds * 100);
  }

  static sanitizeStatementDescriptor(descriptor: string): string {
    // Stripe statement descriptor requirements:
    // - Max 22 characters
    // - No special characters except spaces and periods
    return descriptor
      .substring(0, 22)
      .replace(/[^a-zA-Z0-9\s.]/g, '')
      .trim();
  }

  static sanitizeHeaders(headers?: Record<string, string>): any {
    if (!headers) return {};
    
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      'stripe-signature',
      'content-type',
      'user-agent',
      'x-forwarded-for',
      'x-real-ip',
    ];
    
    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}