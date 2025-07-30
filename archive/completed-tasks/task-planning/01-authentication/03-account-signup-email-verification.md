# Account Signup with Email Verification

**Status: 100% Complete**

## Overview
Implement secure account registration with email verification to ensure valid email addresses.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## User Flow

1. User fills signup form (name, email, password)
2. System validates input and checks for existing email
3. Create user account with unverified status
4. Send verification email with unique link
5. User clicks verification link
6. System verifies token and activates account
7. Redirect to login with success message

## API Endpoints

### 1. Signup Endpoint
```typescript
// POST /api/auth/signup
interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  message: string;
}
```

### 2. Verify Email Endpoint
```typescript
// GET /api/auth/verify-email?token=xxx
interface VerifyEmailResponse {
  success: boolean;
  message: string;
}
```

## Backend Implementation

### Signup Controller
```typescript
// backend-loopback4/src/controllers/auth.controller.ts
import {post, requestBody} from '@loopback/rest';
import {UserService} from '../services/user.service';
import {EmailService} from '../services/email.service';

export class AuthController {
  @post('/auth/signup')
  async signup(
    @requestBody() userData: SignupRequest
  ): Promise<SignupResponse> {
    try {
      // Check if email exists
      const existingUser = await UserService.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create user
      const user = await UserService.createUser(userData);

      // Send verification email
      await EmailService.sendVerificationEmail(user);

      return {
        success: true,
        message: 'Account created. Please check your email to verify your account.'
      };
    } catch (error) {
      throw new HttpErrors.BadRequest(error.message);
    }
  }

  @get('/auth/verify-email')
  async verifyEmail(
    @param.query.string('token') token: string
  ): Promise<VerifyEmailResponse> {
    try {
      const user = await UserService.verifyEmail(token);
      
      return {
        success: true,
        message: 'Email verified successfully. You can now log in.'
      };
    } catch (error) {
      throw new HttpErrors.BadRequest('Invalid or expired verification token');
    }
  }
}
```

### Email Service
```typescript
// backend-loopback4/src/services/email.service.ts
import nodemailer from 'nodemailer';
import { User } from '../db/schema/users';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendVerificationEmail(user: User) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;
    
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to React Fast Training</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Hi ${user.name},</p>
              <p>Thank you for signing up with React Fast Training. To complete your registration, 
                 please verify your email address by clicking the button below:</p>
              <center>
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </center>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 12px;">${verificationUrl}</p>
              <p>This link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 React Fast Training. All rights reserved.</p>
              <p>Yorkshire's Premier First Aid Training Provider</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: '"React Fast Training" <noreply@reactfasttraining.co.uk>',
      to: user.email,
      subject: 'Verify Your Email - React Fast Training',
      html,
    });
  }
}
```

### User Service Verification
```typescript
// backend-loopback4/src/services/user.service.ts (addition)
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
```

## Frontend Implementation

### Signup Form Component
```typescript
// src/pages/SignupPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api/auth';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[!@#$%^&*]/, 'Must contain special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: any) => {
    try {
      await authApi.signup(data);
      navigate('/signup-success');
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}
      </form>
    </div>
  );
};
```

### Email Verification Page
```typescript
// src/pages/VerifyEmailPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api/auth';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    authApi.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch(() => setStatus('error'));
  }, [searchParams, navigate]);

  return (
    <div className="text-center mt-8">
      {status === 'loading' && <p>Verifying your email...</p>}
      {status === 'success' && (
        <div>
          <h2 className="text-2xl font-bold text-green-600">Email Verified!</h2>
          <p>Redirecting to login...</p>
        </div>
      )}
      {status === 'error' && (
        <div>
          <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
          <p>Invalid or expired verification link.</p>
        </div>
      )}
    </div>
  );
};
```

## Environment Variables

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@reactfasttraining.co.uk
SMTP_PASS=your-app-password
FRONTEND_URL=https://reactfasttraining.co.uk
```

## Security Considerations

1. **Token Security**
   - Use cryptographically secure random tokens
   - Set expiration time (24 hours)
   - One-time use only
   - Clear token after verification

2. **Rate Limiting**
   - Limit signup attempts per IP
   - Limit verification attempts
   - Prevent email flooding

3. **Email Security**
   - Use TLS for SMTP
   - Verify sender domain (SPF/DKIM)
   - Handle bounces properly

## Testing

1. Test successful signup and verification
2. Test expired token handling
3. Test invalid token handling
4. Test duplicate email prevention
5. Test email delivery and formatting

## Completion Notes
- Implemented signup endpoint in `/backend-loopback4/src/controllers/auth.controller.ts`
- Added email verification endpoint in the same controller
- Updated EmailService with `sendVerificationEmail` method
- Used temporary email credentials provided (tubeofpears@gmail.com)
- Verification tokens expire after 24 hours
- Email verification required before login