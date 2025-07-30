import {
  post,
  get,
  requestBody,
  HttpErrors,
  RestBindings,
  Request,
  Response,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {authenticate} from '@loopback/authentication';
import {repository} from '@loopback/repository';
import {UserRepository} from '../../repositories/user.repository';
import {AdminActivityLogRepository} from '../../repositories/admin-activity-log.repository';
import {JWTService} from '../../services/jwt.service';
import {RateLimitService} from '../../services/rate-limit.service';
import {EmailService} from '../../services/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

interface AdminLoginRequest {
  email: string;
  password: string;
  captcha?: string;
}

interface AdminLoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  expiresIn: number;
}

interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export class AdminAuthController {
  constructor(
    @inject('services.JWTService')
    private jwtService: JWTService,
    @inject('services.RateLimitService')
    private rateLimitService: RateLimitService,
    @inject('services.EmailService')
    private emailService: EmailService,
    @repository(UserRepository)
    private userRepository: UserRepository,
    @repository(AdminActivityLogRepository)
    private activityLogRepository: AdminActivityLogRepository,
    @inject(RestBindings.Http.REQUEST)
    private request: Request,
    @inject(RestBindings.Http.RESPONSE)
    private response: Response,
  ) {}

  @post('/api/admin/auth/login')
  async login(
    @requestBody() credentials: AdminLoginRequest,
  ): Promise<AdminLoginResponse> {
    // Check rate limiting
    const rateLimitKey = `login_${credentials.email}`;
    const attempts = await this.rateLimitService.checkLimit(rateLimitKey, 5, 900000); // 5 attempts per 15 minutes
    
    if (attempts >= 5) {
      throw new HttpErrors.TooManyRequests('Too many login attempts. Please try again later.');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { 
        email: credentials.email,
        role: {inq: ['admin', 'instructor']}
      }
    });

    if (!user) {
      await this.rateLimitService.increment(rateLimitKey);
      await this.logFailedLogin(credentials.email);
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }

    // Verify password
    const validPassword = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );

    if (!validPassword) {
      await this.rateLimitService.increment(rateLimitKey);
      await this.logFailedLogin(credentials.email, user.id);
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }

    // Generate tokens
    const accessToken = await this.jwtService.generateAccessToken(user);
    const refreshToken = await this.jwtService.generateRefreshToken(user);

    // Update last login
    await this.userRepository.updateById(user.id, {
      lastLogin: new Date()
    });

    // Clear failed attempts
    await this.rateLimitService.reset(rateLimitKey);

    // Log successful login
    await this.logActivity(user.id, 'login', {
      ipAddress: this.getClientIp(),
      userAgent: this.request.headers['user-agent']
    });

    // Set refresh token as HTTP-only cookie
    this.response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role
      },
      expiresIn: 900 // 15 minutes
    };
  }

  @post('/api/admin/auth/logout')
  @authenticate('jwt')
  async logout(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<{success: boolean; message: string}> {
    // Clear refresh token cookie
    this.response.clearCookie('refreshToken');

    // Log logout activity
    await this.logActivity(Number(currentUser.id), 'logout', {
      ipAddress: this.getClientIp(),
      userAgent: this.request.headers['user-agent']
    });

    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  @post('/api/admin/auth/refresh')
  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = this.request.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw new HttpErrors.Unauthorized('No refresh token provided');
    }

    try {
      const decoded = await this.jwtService.verifyRefreshToken(refreshToken);
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        throw new HttpErrors.Unauthorized('Invalid token');
      }

      const accessToken = await this.jwtService.generateAccessToken(user);

      return {
        accessToken,
        expiresIn: 900
      };
    } catch (error) {
      throw new HttpErrors.Unauthorized('Invalid or expired refresh token');
    }
  }

  @get('/api/admin/auth/me')
  @authenticate('jwt')
  async getCurrentUser(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<any> {
    const user = await this.userRepository.findById(Number(currentUser.id));
    
    if (!user) {
      throw new HttpErrors.NotFound('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      lastLogin: user.lastLogin,
      permissions: this.getUserPermissions(user.role)
    };
  }

  @post('/api/admin/auth/change-password')
  @authenticate('jwt')
  async changePassword(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @requestBody() request: {
      currentPassword: string;
      newPassword: string;
    }
  ): Promise<{success: boolean; message: string}> {
    const user = await this.userRepository.findById(Number(currentUser.id));

    // Verify current password
    const validPassword = await bcrypt.compare(
      request.currentPassword,
      user.passwordHash
    );

    if (!validPassword) {
      throw new HttpErrors.Unauthorized('Current password is incorrect');
    }

    // Validate new password
    if (!this.isValidPassword(request.newPassword)) {
      throw new HttpErrors.BadRequest(
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(request.newPassword, 12);

    // Update password
    await this.userRepository.updateById(user.id, {
      passwordHash: hashedPassword
    });

    // Log password change
    await this.logActivity(user.id, 'password_change', {
      ipAddress: this.getClientIp(),
      userAgent: this.request.headers['user-agent']
    });

    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  private async logFailedLogin(email: string, userId?: number): Promise<void> {
    await this.activityLogRepository.create({
      adminId: userId || 0,
      action: 'failed_login',
      entityType: 'auth',
      newValues: { email },
      ipAddress: this.getClientIp(),
      userAgent: this.request.headers['user-agent'] || '',
      createdAt: new Date()
    });
  }

  private async logActivity(userId: number, action: string, data: any): Promise<void> {
    await this.activityLogRepository.create({
      adminId: userId,
      action,
      entityType: 'auth',
      newValues: data,
      ipAddress: this.getClientIp(),
      userAgent: this.request.headers['user-agent'] || '',
      createdAt: new Date()
    });
  }

  private getClientIp(): string {
    return this.request.headers['x-forwarded-for'] as string ||
           this.request.connection.remoteAddress ||
           '';
  }

  private isValidPassword(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    return password.length >= minLength &&
           hasUpperCase &&
           hasLowerCase &&
           hasNumbers &&
           hasSpecialChar;
  }

  private getUserPermissions(role: string): string[] {
    const permissions: {[key: string]: string[]} = {
      admin: [
        'courses.manage',
        'bookings.manage',
        'users.manage',
        'analytics.view',
        'settings.manage'
      ],
      instructor: [
        'courses.view',
        'bookings.view',
        'analytics.view'
      ]
    };

    return permissions[role] || [];
  }

  @post('/api/admin/auth/forgot-password')
  async forgotPassword(
    @requestBody() request: { email: string }
  ): Promise<{success: boolean; message: string}> {
    try {
      const user = await this.userRepository.findOne({
        where: { 
          email: request.email,
          role: {inq: ['admin', 'instructor']}
        }
      });

      if (!user) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent.'
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save token to user (you may want to create a separate table for this)
      await this.userRepository.updateById(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3003'}/admin/reset-password?token=${resetToken}`;
      
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Admin Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your admin password.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this reset, please ignore this email.</p>
        `
      });

      // Log activity
      await this.logActivity(user.id, 'password_reset_requested', {
        ipAddress: this.getClientIp(),
        userAgent: this.request.headers['user-agent']
      });

      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      };
    }
  }

  @post('/api/admin/auth/reset-password')
  async resetPassword(
    @requestBody() request: {
      token: string;
      newPassword: string;
    }
  ): Promise<{success: boolean; message: string}> {
    try {
      // Find user with valid reset token
      const user = await this.userRepository.findOne({
        where: {
          passwordResetToken: request.token,
          passwordResetExpiry: {gt: new Date()},
          role: {inq: ['admin', 'instructor']}
        }
      });

      if (!user) {
        throw new HttpErrors.BadRequest('Invalid or expired reset token');
      }

      // Validate new password
      if (!this.isValidPassword(request.newPassword)) {
        throw new HttpErrors.BadRequest(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(request.newPassword, 12);

      // Update password and clear reset token
      await this.userRepository.updateById(user.id, {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null
      });

      // Log activity
      await this.logActivity(user.id, 'password_reset_completed', {
        ipAddress: this.getClientIp(),
        userAgent: this.request.headers['user-agent']
      });

      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.InternalServerError('Failed to reset password');
    }
  }
}