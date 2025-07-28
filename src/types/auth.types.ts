/**
 * Authentication type definitions
 */

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  field?: string;
  details?: Record<string, any>;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
}

export type AuthErrorCode =
  | "auth/invalid-credentials"
  | "auth/account-locked"
  | "auth/email-not-verified"
  | "auth/session-expired"
  | "auth/rate-limited"
  | "auth/email-in-use"
  | "auth/weak-password"
  | "auth/invalid-token"
  | "auth/network-error";

export interface AuthContextState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: ApiError | null;
}

export interface AuthContextActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => void;
}
