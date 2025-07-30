import crypto from 'crypto';
import { db } from '../config/database.config';
import { sessions } from '../db/schema/sessions';
import { eq, lt, and, gt } from 'drizzle-orm';

export class SessionService {
  private static readonly SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly ACTIVITY_THRESHOLD = 15 * 60 * 1000; // 15 minutes

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async createSession(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
  ) {
    // Invalidate any existing sessions for this user
    await this.invalidateUserSessions(userId);

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    const [session] = await db.insert(sessions).values({
      userId,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    }).returning();

    return session;
  }

  static async validateSession(token: string) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date())
        )
      );

    if (!session) {
      return null;
    }

    // Update last activity if more than threshold
    const timeSinceActivity = Date.now() - session.lastActivity.getTime();
    if (timeSinceActivity > this.ACTIVITY_THRESHOLD) {
      await db
        .update(sessions)
        .set({ lastActivity: new Date() })
        .where(eq(sessions.id, session.id));
    }

    return session;
  }

  static async invalidateSession(token: string) {
    await db
      .delete(sessions)
      .where(eq(sessions.token, token));
  }

  static async invalidateUserSessions(userId: string) {
    await db
      .delete(sessions)
      .where(eq(sessions.userId, userId));
  }

  static async cleanupExpiredSessions() {
    await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));
  }
}