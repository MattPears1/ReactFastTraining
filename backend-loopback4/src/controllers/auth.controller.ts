import {
  post,
  get,
  requestBody,
  param,
  HttpErrors,
  RestBindings,
  Request,
  Response,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {UserService} from '../services/user.service';
import {EmailService} from '../services/email.service';
import {SessionService} from '../services/session.service';
import {PasswordService} from '../services/auth/password.service';
import crypto from 'crypto';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  message: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  expiresAt: Date;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export class AuthController {
  constructor(
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  @post('/auth/signup')
  async signup(
    @requestBody() userData: SignupRequest
  ): Promise<SignupResponse> {
    try {
      // Check if email exists
      const existingUser = await UserService.findByEmail(userData.email);
      if (existingUser) {
        throw new HttpErrors.BadRequest('Email already registered');
      }

      // Create user
      const user = await UserService.createUser(userData);

      // Send verification email
      await this.emailService.sendVerificationEmail(user);

      return {
        success: true,
        message: 'Account created. Please check your email to verify your account.'
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
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

  @post('/auth/login')
  async login(
    @requestBody() credentials: LoginRequest,
    @inject(RestBindings.Http.REQUEST) req: Request
  ): Promise<LoginResponse> {
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

    // Check email verification
    if (!user.emailVerified) {
      throw new HttpErrors.Forbidden('Please verify your email before logging in');
    }

    // Reset failed attempts on successful login
    await UserService.resetFailedAttempts(user.id);

    // Create session
    const session = await SessionService.createSession(
      user.id,
      req.ip,
      req.headers['user-agent'] as string
    );

    return {
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      expiresAt: session.expiresAt,
    };
  }

  @post('/auth/logout')
  async logout(
    @inject(RestBindings.Http.REQUEST) req: Request
  ): Promise<{ success: boolean }> {
    const token = this.extractToken(req);
    
    if (token) {
      await SessionService.invalidateSession(token);
    }
    
    return { success: true };
  }

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
      await this.emailService.sendPasswordResetEmail(user, resetToken);

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
    } catch (error: any) {
      if (error.message.includes('Invalid')) {
        throw new HttpErrors.BadRequest('Invalid or expired reset link');
      }
      throw error;
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }
}