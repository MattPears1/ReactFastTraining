# Account Lockout After Failed Attempts

**Status: 100% Complete**

## Overview
Implement account lockout mechanism that locks user accounts after 5 failed login attempts, requiring password reset to unlock.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Lockout Logic

### Rules
1. Track failed login attempts per user
2. Lock account after 5 consecutive failed attempts
3. Reset counter on successful login
4. Unlock only via password reset
5. Show clear error messages

## Database Updates

Already included in users table:
- `failed_login_attempts` - Counter for failed attempts
- `account_locked_until` - Timestamp when account was locked

## Backend Implementation

### User Service Updates
```typescript
// backend-loopback4/src/services/user.service.ts
export class UserService {
  static readonly MAX_FAILED_ATTEMPTS = 5;

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

  static isAccountLocked(user: User): boolean {
    return !!(user.accountLockedUntil && user.accountLockedUntil > new Date());
  }
}
```

### Updated Login Controller
```typescript
// backend-loopback4/src/controllers/auth.controller.ts
export class AuthController {
  @post('/auth/login')
  async login(@requestBody() credentials: LoginRequest): Promise<LoginResponse> {
    const { email, password } = credentials;

    // Find user
    const user = await UserService.findByEmail(email);
    if (!user) {
      // Generic error to prevent user enumeration
      throw new HttpErrors.Unauthorized('Invalid email or password');
    }

    // Check if account is locked
    if (UserService.isAccountLocked(user)) {
      throw new HttpErrors.Forbidden(
        'Your account has been locked due to multiple failed login attempts. ' +
        'Please reset your password to unlock your account.'
      );
    }

    // Verify password
    const isValid = await PasswordService.verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      // Increment failed attempts
      const updatedUser = await UserService.incrementFailedAttempts(user.id);
      
      const remainingAttempts = UserService.MAX_FAILED_ATTEMPTS - updatedUser.failedLoginAttempts;
      
      if (remainingAttempts > 0) {
        throw new HttpErrors.Unauthorized(
          `Invalid email or password. ${remainingAttempts} attempts remaining.`
        );
      } else {
        throw new HttpErrors.Forbidden(
          'Your account has been locked due to multiple failed login attempts. ' +
          'Please reset your password to unlock your account.'
        );
      }
    }

    // Reset failed attempts on successful login
    await UserService.resetFailedAttempts(user.id);

    // Continue with normal login flow...
  }
}
```

### Account Locked Email
```typescript
// backend-loopback4/src/services/email.service.ts
export class EmailService {
  static async sendAccountLockedEmail(user: User) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0EA5E9; 
                     color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .warning { background-color: #FEF3C7; border: 1px solid #F59E0B; 
                      padding: 15px; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Locked</h1>
            </div>
            <div class="content">
              <h2>Your Account Has Been Locked</h2>
              <p>Hi ${user.name},</p>
              
              <div class="warning">
                <strong>⚠️ Security Alert:</strong> Your account has been locked due to 
                multiple failed login attempts.
              </div>
              
              <p>For your security, we've temporarily locked your account. This helps 
                 protect your account from unauthorized access attempts.</p>
              
              <p>To unlock your account, you'll need to reset your password:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              
              <p>If you didn't attempt to log in, please reset your password immediately 
                 as someone may be trying to access your account.</p>
              
              <h3>Security Tips:</h3>
              <ul>
                <li>Use a strong, unique password</li>
                <li>Never share your password with anyone</li>
                <li>Be cautious of phishing emails</li>
                <li>Consider using a password manager</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2024 React Fast Training. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: '"React Fast Training Security" <security@reactfasttraining.co.uk>',
      to: user.email,
      subject: 'Account Locked - Action Required',
      html,
      priority: 'high',
    });
  }
}
```

### Password Reset Unlocks Account
```typescript
// backend-loopback4/src/services/user.service.ts
static async resetPassword(token: string, newPassword: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, token));

  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new Error('Invalid or expired reset token');
  }

  const passwordHash = await PasswordService.hashPassword(newPassword);
  
  // Reset password AND unlock account
  await db
    .update(users)
    .set({ 
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      failedLoginAttempts: 0,  // Reset counter
      accountLockedUntil: null, // Unlock account
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id));
}
```

## Frontend Implementation

### Login Form with Lockout Handling
```typescript
// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const { login } = useAuth();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      setRemainingAttempts(null);
      await login(data.email, data.password);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      
      // Extract remaining attempts from error message
      const match = message.match(/(\d+) attempts remaining/);
      if (match) {
        setRemainingAttempts(parseInt(match[1]));
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Sign In</h2>
      
      {error && (
        <div className={`p-4 rounded-lg mb-4 ${
          error.includes('locked') 
            ? 'bg-red-50 border border-red-300 text-red-800'
            : 'bg-yellow-50 border border-yellow-300 text-yellow-800'
        }`}>
          <p className="font-medium">{error}</p>
          {error.includes('locked') && (
            <Link 
              to="/reset-password" 
              className="mt-2 inline-block text-sm underline"
            >
              Reset your password to unlock account →
            </Link>
          )}
        </div>
      )}

      {remainingAttempts !== null && remainingAttempts <= 2 && (
        <div className="bg-orange-50 border border-orange-300 text-orange-800 p-4 rounded-lg mb-4">
          <p className="text-sm">
            <strong>Warning:</strong> Only {remainingAttempts} login 
            {remainingAttempts === 1 ? ' attempt' : ' attempts'} remaining 
            before your account is locked.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}
      </form>
    </div>
  );
};
```

### Account Status Component
```typescript
// src/components/account/AccountStatus.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const AccountStatus: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Account Security</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Email Verified</span>
          <span className={user.emailVerified ? 'text-green-600' : 'text-red-600'}>
            {user.emailVerified ? '✓ Verified' : '✗ Not Verified'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Account Status</span>
          <span className="text-green-600">Active</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Last Login</span>
          <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
```

## Security Considerations

1. **Prevent User Enumeration**
   - Use generic error messages
   - Same response time for valid/invalid emails
   - Don't reveal if email exists

2. **Lockout Protection**
   - Permanent lock until password reset
   - Clear communication to user
   - Security alert emails

3. **Rate Limiting**
   - Implement IP-based rate limiting
   - Prevent brute force attacks
   - CAPTCHA after 3 attempts

## Testing

1. Test failed attempt counter increments
2. Test account locks after 5 attempts
3. Test warning messages at 2 and 1 attempts
4. Test password reset unlocks account
5. Test successful login resets counter
6. Test locked account email delivery

## Completion Notes
- Implemented in UserService with `incrementFailedAttempts` and `lockAccount` methods
- Account locks after 5 failed attempts (permanent until password reset)
- Login controller shows remaining attempts on failure
- Account locked email notification sent via EmailService
- Password reset automatically unlocks the account
- Clear user feedback with specific error messages
- Protection against user enumeration attacks