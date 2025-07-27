# Password Reset Functionality

**Status: 100% Complete**

## Overview
Implement secure password reset functionality allowing users to reset forgotten passwords via email link.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## User Flow

1. User clicks "Forgot Password" on login page
2. Enters email address
3. System sends reset email with secure link
4. User clicks link and lands on reset page
5. User enters new password
6. System updates password and unlocks account
7. Redirect to login with success message

## API Endpoints

### 1. Request Password Reset
```typescript
// POST /api/auth/forgot-password
interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}
```

### 2. Reset Password
```typescript
// POST /api/auth/reset-password
interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
```

### 3. Validate Reset Token
```typescript
// GET /api/auth/validate-reset-token?token=xxx
interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
}
```

## Backend Implementation

### Auth Controller
```typescript
// backend-loopback4/src/controllers/auth.controller.ts
export class AuthController {
  @post('/auth/forgot-password')
  async forgotPassword(
    @requestBody() data: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    try {
      const user = await UserService.findByEmail(data.email);
      
      // Always return success to prevent user enumeration
      if (!user) {
        return {
          success: true,
          message: 'If an account exists with this email, a reset link has been sent.'
        };
      }

      // Generate reset token
      const resetToken = crypto.randomUUID();
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to user
      await UserService.setResetToken(user.id, resetToken, resetTokenExpires);

      // Send reset email
      await EmailService.sendPasswordResetEmail(user, resetToken);

      return {
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      };
    } catch (error) {
      // Log error but return generic message
      console.error('Password reset error:', error);
      return {
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      };
    }
  }

  @get('/auth/validate-reset-token')
  async validateResetToken(
    @param.query.string('token') token: string
  ): Promise<ValidateTokenResponse> {
    const user = await UserService.findByResetToken(token);
    
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      return { valid: false };
    }

    return {
      valid: true,
      email: user.email, // Show email on reset form
    };
  }

  @post('/auth/reset-password')
  async resetPassword(
    @requestBody() data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    try {
      // Validate password strength
      const validation = PasswordService.validatePasswordStrength(data.password);
      if (!validation.isValid) {
        throw new HttpErrors.BadRequest(validation.errors.join(', '));
      }

      // Reset password (also unlocks account)
      await UserService.resetPassword(data.token, data.password);

      return {
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.'
      };
    } catch (error) {
      if (error.message.includes('Invalid')) {
        throw new HttpErrors.BadRequest('Invalid or expired reset link');
      }
      throw error;
    }
  }
}
```

### User Service Updates
```typescript
// backend-loopback4/src/services/user.service.ts
export class UserService {
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
    await EmailService.sendPasswordChangedEmail(user);
  }
}
```

### Email Templates
```typescript
// backend-loopback4/src/services/email.service.ts
export class EmailService {
  static async sendPasswordResetEmail(user: User, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0EA5E9; 
                     color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .security-note { background-color: #FEF3C7; padding: 10px; border-radius: 4px; 
                            margin: 15px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hi ${user.name},</p>
              <p>We received a request to reset your password. Click the button below to 
                 create a new password:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 12px;">${resetUrl}</p>
              
              <div class="security-note">
                <strong>⏰ This link expires in 1 hour</strong> for security reasons.
              </div>
              
              <p>If you didn't request this password reset, please ignore this email. 
                 Your password won't be changed.</p>
              
              <p><strong>Note:</strong> If your account was locked due to failed login 
                 attempts, it will be automatically unlocked when you reset your password.</p>
            </div>
            <div class="footer">
              <p>© 2024 React Fast Training. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: '"React Fast Training" <noreply@reactfasttraining.co.uk>',
      to: user.email,
      subject: 'Password Reset Request - React Fast Training',
      html,
    });
  }

  static async sendPasswordChangedEmail(user: User) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Same styles as above */
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed Successfully</h1>
            </div>
            <div class="content">
              <h2>Your Password Has Been Reset</h2>
              <p>Hi ${user.name},</p>
              <p>This email confirms that your password has been successfully changed.</p>
              
              <div class="security-note">
                <strong>🔓 Account Unlocked:</strong> If your account was previously 
                locked, it has now been unlocked.
              </div>
              
              <p>You can now log in with your new password.</p>
              
              <p>If you didn't make this change, please contact us immediately.</p>
              
              <h3>Security Tips:</h3>
              <ul>
                <li>Use a unique password for each account</li>
                <li>Enable two-factor authentication when available</li>
                <li>Never share your password</li>
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
      subject: 'Password Changed - React Fast Training',
      html,
    });
  }
}
```

## Frontend Implementation

### Forgot Password Page
```typescript
// src/pages/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { authApi } from '@/services/api/auth';

export const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: { email: string }) => {
    await authApi.forgotPassword(data.email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-8 text-center">
        <div className="bg-green-50 border border-green-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-800 mb-2">
            Check Your Email
          </h2>
          <p className="text-green-700">
            If an account exists with that email address, we've sent 
            password reset instructions.
          </p>
          <p className="text-sm text-green-600 mt-4">
            The link will expire in 1 hour for security reasons.
          </p>
        </div>
        <Link to="/login" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Forgot Password</h2>
      <p className="text-gray-600 mb-6">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
        >
          Send Reset Link
        </button>
      </form>
      
      <p className="text-center mt-4 text-sm">
        Remember your password?{' '}
        <Link to="/login" className="text-primary-600 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};
```

### Reset Password Page
```typescript
// src/pages/ResetPasswordPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '@/services/api/auth';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const token = searchParams.get('token');
  const password = watch('password');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
      return;
    }

    authApi.validateResetToken(token)
      .then(response => {
        setValid(response.valid);
        setEmail(response.email || '');
        setValidating(false);
      })
      .catch(() => {
        setValid(false);
        setValidating(false);
      });
  }, [token, navigate]);

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    try {
      await authApi.resetPassword(token!, data.password);
      navigate('/login?reset=success');
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  if (validating) {
    return <div className="text-center mt-8">Validating reset link...</div>;
  }

  if (!valid) {
    return (
      <div className="max-w-md mx-auto mt-8 text-center">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Invalid or Expired Link
          </h2>
          <p className="text-red-700">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Link to="/forgot-password" className="mt-4 inline-block text-primary-600 hover:underline">
          Request New Reset Link
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Reset Your Password</h2>
      <p className="text-gray-600 mb-6">
        Enter a new password for <strong>{email}</strong>
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Must contain uppercase, lowercase, number, and special character'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
};
```

## Security Considerations

1. **Prevent User Enumeration**
   - Always return same message regardless of email existence
   - Same response time for all requests
   - Log attempts for monitoring

2. **Token Security**
   - Cryptographically secure tokens
   - Short expiration (1 hour)
   - One-time use only
   - Clear after use

3. **Rate Limiting**
   - Limit reset requests per email
   - Limit reset requests per IP
   - Prevent email flooding

4. **Account Security**
   - Notify user of password changes
   - Auto-unlock locked accounts
   - Require strong passwords

## Testing

1. Test valid email receives reset link
2. Test invalid email shows same message
3. Test expired token handling
4. Test successful password reset
5. Test account unlock on reset
6. Test notification emails

## Completion Notes
- Implemented forgot password, validate token, and reset password endpoints
- Reset tokens expire after 1 hour for security
- Password reset automatically unlocks locked accounts
- Email notifications for both reset request and successful reset
- Protection against user enumeration (always returns success message)
- Strong password validation enforced on reset
- All endpoints added to AuthController