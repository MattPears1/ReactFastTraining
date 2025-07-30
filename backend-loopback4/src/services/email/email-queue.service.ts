import { injectable } from '@loopback/core';
import { db } from '../../db';
import { emailQueue, emailLogs } from '../../db/schema';
import { eq, and, isNull, lte } from 'drizzle-orm';
import { EmailOptions } from './email.types';

export interface QueuedEmail {
  id?: number;
  to: string;
  subject: string;
  html: string;
  attachments?: any;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
  attempts?: number;
  lastAttempt?: Date;
  status?: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
}

@injectable()
export class EmailQueueService {
  /**
   * Add email to queue
   */
  async queueEmail(email: QueuedEmail): Promise<number> {
    const [queued] = await db.insert(emailQueue).values({
      to: email.to,
      subject: email.subject,
      html: email.html,
      attachments: email.attachments ? JSON.stringify(email.attachments) : null,
      priority: email.priority || 'normal',
      scheduledFor: email.scheduledFor || new Date(),
      attempts: 0,
      status: 'pending',
      createdAt: new Date(),
    }).returning();

    return queued.id;
  }

  /**
   * Get pending emails from queue
   */
  async getPendingEmails(limit = 10): Promise<QueuedEmail[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'pending'),
          lte(emailQueue.scheduledFor, now),
          lte(emailQueue.attempts, 3)
        )
      )
      .orderBy(emailQueue.priority, emailQueue.scheduledFor)
      .limit(limit);
  }

  /**
   * Mark email as sent
   */
  async markAsSent(id: number, messageId?: string): Promise<void> {
    await db
      .update(emailQueue)
      .set({
        status: 'sent',
        sentAt: new Date(),
        messageId,
      })
      .where(eq(emailQueue.id, id));

    // Log successful send
    await this.logEmail(id, 'sent', messageId);
  }

  /**
   * Mark email as failed
   */
  async markAsFailed(id: number, error: string): Promise<void> {
    const [email] = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.id, id));

    const attempts = (email.attempts || 0) + 1;
    const status = attempts >= 3 ? 'failed' : 'pending';

    await db
      .update(emailQueue)
      .set({
        status,
        attempts,
        lastAttempt: new Date(),
        error,
      })
      .where(eq(emailQueue.id, id));

    // Log failed attempt
    await this.logEmail(id, 'failed', null, error);
  }

  /**
   * Log email activity
   */
  private async logEmail(
    emailId: number, 
    status: string, 
    messageId?: string | null, 
    error?: string
  ): Promise<void> {
    await db.insert(emailLogs).values({
      emailId,
      status,
      messageId,
      error,
      createdAt: new Date(),
    });
  }

  /**
   * Clean old email records
   */
  async cleanOldRecords(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'sent'),
          lte(emailQueue.sentAt, cutoffDate)
        )
      );

    return result.rowCount || 0;
  }
}