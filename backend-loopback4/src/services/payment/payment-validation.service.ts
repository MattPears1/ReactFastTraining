import { z } from 'zod';

// Enhanced validation schemas
export const CreatePaymentIntentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
  savePaymentMethod: z.boolean().optional(),
  returnUrl: z.string().url().optional(),
});

export const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  paymentMethodId: z.string().optional(),
});

export const ListPaymentsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  status: z.enum([
    'pending',
    'processing',
    'succeeded',
    'failed',
    'canceled',
    'refunded'
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  bookingReference: z.string().optional(),
  customerEmail: z.string().email().optional(),
});

export class PaymentValidationService {
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static validatePagination(limit: number, offset: number) {
    return {
      limit: Math.min(Math.max(1, limit), 100),
      offset: Math.max(0, offset)
    };
  }

  static getClientIP(request: any): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    const socketIP = request.socket?.remoteAddress;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    return socketIP || 'unknown';
  }
}