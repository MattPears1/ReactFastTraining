# User Table with Bcrypt Password Hashing

**Status: 100% Complete**

## Overview
Create a secure user table with bcrypt password hashing for authentication.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);
```

## Drizzle ORM Schema

```typescript
// backend-loopback4/src/db/schema/users.ts
import { pgTable, uuid, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false),
  verificationToken: varchar('verification_token', { length: 255 }),
  verificationTokenExpires: timestamp('verification_token_expires'),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpires: timestamp('reset_token_expires'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  accountLockedUntil: timestamp('account_locked_until'),
  googleId: varchar('google_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## Bcrypt Implementation

```typescript
// backend-loopback4/src/services/auth/password.service.ts
import bcrypt from 'bcrypt';

export class PasswordService {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(
    password: string, 
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

## User Service Implementation

```typescript
// backend-loopback4/src/services/user.service.ts
import { db } from '../config/database.config';
import { users } from '../db/schema/users';
import { PasswordService } from './auth/password.service';
import { eq } from 'drizzle-orm';

export class UserService {
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
}
```

## Security Best Practices

1. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **Bcrypt Configuration**
   - Salt rounds: 12 (balanced security/performance)
   - Automatic salt generation
   - Time-constant comparison

3. **Additional Security**
   - Store emails in lowercase
   - Use UUID for user IDs
   - Separate verification and reset tokens
   - Token expiration times
   - Track failed login attempts

## Testing

```typescript
// backend-loopback4/src/tests/password.service.test.ts
describe('PasswordService', () => {
  it('should hash and verify passwords', async () => {
    const password = 'Test@123';
    const hash = await PasswordService.hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(await PasswordService.verifyPassword(password, hash)).toBe(true);
    expect(await PasswordService.verifyPassword('wrong', hash)).toBe(false);
  });

  it('should validate password strength', () => {
    const weak = PasswordService.validatePasswordStrength('weak');
    expect(weak.isValid).toBe(false);
    
    const strong = PasswordService.validatePasswordStrength('Strong@123');
    expect(strong.isValid).toBe(true);
  });
});
```

## Completion Notes
- Created Drizzle ORM schema at `/backend-loopback4/src/db/schema/users.ts`
- Implemented PasswordService at `/backend-loopback4/src/services/auth/password.service.ts`
- Created UserService at `/backend-loopback4/src/services/user.service.ts`
- Used bcrypt with 12 salt rounds for secure password hashing
- Implemented password strength validation with comprehensive rules
- All user data kept minimal (name, email only) as per requirements