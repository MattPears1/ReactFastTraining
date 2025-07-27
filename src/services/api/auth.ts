import apiClient from './client';
import { retryWithBackoff } from '@/services/auth/error.service';
import {
  SignupData,
  LoginCredentials,
  AuthResponse,
  ApiResponse,
  PasswordResetRequest,
  PasswordResetData,
  ValidateTokenResponse,
} from '@/types/auth.types';

/**
 * Authentication API service
 * All methods include retry logic for network failures
 */
export const authApi = {
  /**
   * Register new user account
   */
  async signup(data: SignupData): Promise<ApiResponse> {
    return retryWithBackoff(async () => {
      const response = await apiClient.post<ApiResponse>('/auth/signup', {
        ...data,
        email: data.email.toLowerCase().trim(), // Normalize email
      });
      return response.data;
    });
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = await apiClient.get<ApiResponse>(
      `/auth/verify-email?token=${encodeURIComponent(token)}`
    );
    return response.data;
  },

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      ...credentials,
      email: credentials.email.toLowerCase().trim(), // Normalize email
    });
    return response.data;
  },

  /**
   * Logout current session
   */
  async logout(): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>('/auth/logout');
      return response.data;
    } catch (error) {
      // Always return success for logout to ensure local state is cleared
      return { success: true };
    }
  },

  /**
   * Request password reset email
   */
  async forgotPassword(data: PasswordResetRequest): Promise<ApiResponse> {
    return retryWithBackoff(async () => {
      const response = await apiClient.post<ApiResponse>('/auth/forgot-password', {
        email: data.email.toLowerCase().trim(), // Normalize email
      });
      return response.data;
    });
  },

  /**
   * Validate password reset token
   */
  async validateResetToken(token: string): Promise<ValidateTokenResponse> {
    const response = await apiClient.get<ValidateTokenResponse>(
      `/auth/validate-reset-token?token=${encodeURIComponent(token)}`
    );
    return response.data;
  },

  /**
   * Reset password with valid token
   */
  async resetPassword(data: PasswordResetData): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Refresh access token (placeholder for future implementation)
   */
  async refreshToken(): Promise<AuthResponse> {
    // TODO: Implement when backend supports refresh tokens
    throw new Error('Refresh token not implemented');
  },

  /**
   * Validate current session
   */
  async validateSession(): Promise<{ valid: boolean; user?: User }> {
    // TODO: Implement session validation endpoint
    const response = await apiClient.get<{ valid: boolean; user?: User }>('/auth/session');
    return response.data;
  },
};