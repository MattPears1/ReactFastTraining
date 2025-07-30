import { injectable } from '@loopback/core';
import { db } from '../../db';
import { payments } from '../../db/schema';
import { like } from 'drizzle-orm';

@injectable()
export class PaymentReferenceService {
  /**
   * Generate unique payment reference
   */
  async generatePaymentReference(): Promise<string> {
    const prefix = 'PAY';
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Find the highest reference number for this month
    const pattern = `${prefix}-${year}${month}-%`;
    const lastPayment = await db
      .select()
      .from(payments)
      .where(like(payments.paymentReference, pattern))
      .orderBy(payments.paymentReference)
      .limit(1);

    let sequence = 1;
    if (lastPayment.length > 0) {
      const lastRef = lastPayment[0].paymentReference;
      const lastSequence = parseInt(lastRef.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}${month}-${sequence.toString().padStart(5, '0')}`;
  }

  /**
   * Generate unique refund reference
   */
  async generateRefundReference(): Promise<string> {
    const prefix = 'RFD';
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${prefix}-${year}${month}${day}-${random}`;
  }

  /**
   * Validate payment reference format
   */
  validatePaymentReference(reference: string): boolean {
    const pattern = /^PAY-\d{4}-\d{5}$/;
    return pattern.test(reference);
  }

  /**
   * Validate refund reference format
   */
  validateRefundReference(reference: string): boolean {
    const pattern = /^RFD-\d{6}-\d{4}$/;
    return pattern.test(reference);
  }
}