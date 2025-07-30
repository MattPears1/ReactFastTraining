import { db } from '../../config/database.config';
import { paymentLogs } from '../../db/schema';

export class PaymentActivityLoggerService {
  static async logActivity(
    request: any,
    action: string,
    data: any
  ): Promise<void> {
    try {
      // Log to payment logs if payment ID available
      if (data.paymentId) {
        await db.insert(paymentLogs).values({
          paymentId: data.paymentId,
          eventType: action,
          eventSource: 'api',
          eventData: {
            ...data,
            userId: request.user?.id,
            timestamp: new Date().toISOString(),
          },
          ipAddress: this.getClientIP(request),
          userAgent: request.headers['user-agent'] as string,
          adminUserId: request.user?.roles?.includes('admin') ? request.user.id : undefined,
        });
      }
      
      // Also log to general activity log if available
      // TODO: Implement general activity logging
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging should not break the main flow
    }
  }

  private static getClientIP(request: any): string {
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