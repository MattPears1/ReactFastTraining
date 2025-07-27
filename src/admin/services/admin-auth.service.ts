import axios, { AxiosInstance } from 'axios';

interface LoginRequest {
  email: string;
  password: string;
  captcha?: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  expiresIn: number;
}

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

interface CurrentUserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  lastLogin: Date;
  permissions: string[];
}

class AdminAuthService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    console.log('🌐 [AdminAuthService] Initializing with baseURL:', baseURL);
    
    this.api = axios.create({
      baseURL,
      withCredentials: true, // For cookies
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminAccessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const response = await this.refreshToken();
            localStorage.setItem('adminAccessToken', response.accessToken);
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('adminAccessToken');
            window.location.href = '/admin/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string, captcha?: string): Promise<LoginResponse> {
    console.log('🔐 [AdminAuthService] Attempting login...');
    console.log('📧 [AdminAuthService] Email:', email);
    console.log('🔗 [AdminAuthService] Endpoint: /api/admin/auth/login');
    
    try {
      const response = await this.api.post<LoginResponse>('/api/admin/auth/login', {
        email,
        password,
        captcha,
      });
      console.log('✅ [AdminAuthService] Login successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [AdminAuthService] Login failed:', error);
      console.error('🔍 [AdminAuthService] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method
        }
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/api/admin/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async refreshToken(): Promise<RefreshResponse> {
    const response = await this.api.post<RefreshResponse>('/api/admin/auth/refresh');
    return response.data;
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response = await this.api.get<CurrentUserResponse>('/api/admin/auth/me');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.post('/api/admin/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.api.post('/api/admin/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.api.post('/api/admin/auth/reset-password', {
      token,
      newPassword,
    });
  }
}

export const adminAuthService = new AdminAuthService();