import { db } from '../config/database.config';
import { users } from '../db/schema/users';
import { PasswordService } from './auth/password.service';
import { eq, and, gt, sql } from 'drizzle-orm';
import crypto from 'crypto';

export class UserService {
  static readonly MAX_FAILED_ATTEMPTS = 5;

  static async createUser(data: {
    email: string;
    name: string;
    password: string;
  }) {
    // Validate password strength
    const passwordValidation = PasswordService.validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash password
    const passwordHash = await PasswordService.hashPassword(data.password);

    // Create user
    const [user] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      verificationToken: crypto.randomUUID(),
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }).returning();

    return user;
  }

  static async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    
    return user;
  }

  static async findById(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    return user;
  }

  static async findByGoogleId(googleId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    
    return user;
  }

  static async createGoogleUser(data: {
    googleId: string;
    email: string;
    name: string;
    emailVerified: boolean;
  }) {
    const [user] = await db.insert(users).values({
      ...data,
      email: data.email.toLowerCase(),
      passwordHash: '', // No password for OAuth users
    }).returning();

    return user;
  }

  static async linkGoogleAccount(userId: string, googleId: string) {
    await db
      .update(users)
      .set({ 
        googleId,
        emailVerified: true, // Auto-verify when linking Google
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  static async verifyEmail(token: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));

    if (!user) {
      throw new Error('Invalid verification token');
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      throw new Error('Verification token has expired');
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    return user;
  }

  static async updatePassword(userId: string, newPassword: string) {
    const passwordHash = await PasswordService.hashPassword(newPassword);
    
    await db
      .update(users)
      .set({ 
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  static async incrementFailedAttempts(userId: string) {
    const [user] = await db
      .update(users)
      .set({ 
        failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Lock account if max attempts reached
    if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
      await this.lockAccount(userId);
    }

    return user;
  }

  static async lockAccount(userId: string) {
    // Set locked until far future (requires password reset)
    const lockedUntil = new Date('2099-12-31');
    
    await db
      .update(users)
      .set({ 
        accountLockedUntil: lockedUntil,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Send account locked email
    const user = await this.findById(userId);
    if (user) {
      const { EmailService } = require('./email.service');
      await EmailService.sendAccountLockedEmail(user);
    }
  }

  static async resetFailedAttempts(userId: string) {
    await db
      .update(users)
      .set({ 
        failedLoginAttempts: 0,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  static async unlockAccount(userId: string) {
    await db
      .update(users)
      .set({ 
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  static isAccountLocked(user: any): boolean {
    // Check if user has bypass_lockout flag (for admin accounts)
    if (user.bypass_lockout === true || user.role === 'admin') {
      return false;
    }
    return !!(user.accountLockedUntil && user.accountLockedUntil > new Date());
  }

  static async setResetToken(
    userId: string, 
    token: string, 
    expires: Date
  ) {
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpires: expires,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  static async findByResetToken(token: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    
    return user;
  }

  static async resetPassword(token: string, newPassword: string) {
    const user = await this.findByResetToken(token);
    
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);
    
    // Update password, clear tokens, unlock account
    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        failedLoginAttempts: 0,      // Reset login attempts
        accountLockedUntil: null,    // Unlock account
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Send confirmation email
    const { EmailService } = require('./email.service');
    await EmailService.sendPasswordChangedEmail(user);
  }
}