import { db } from '../../config/database.config';
import { paymentLogs, PaymentEventType, NewPaymentLog } from '../../db/schema';

export class StripePaymentLoggerService {
  static async logPaymentEvent(
    paymentId: string | null,
    eventType: PaymentEventType,
    eventData: any,
    eventSource: string = 'system'
  ): Promise<void> {
    try {
      const logData: NewPaymentLog = {
        paymentId,
        eventType,
        eventSource,
        eventData: {
          ...eventData,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
      };

      await db.insert(paymentLogs).values(logData);
    } catch (error) {
      console.error('Failed to log payment event:', error);
      // Don't throw - logging failures shouldn't break payment processing
    }
  }
}