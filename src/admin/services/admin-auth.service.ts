import { AxiosInstance } from "axios";
import axios from "./axios-init";

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
  private isRefreshing = false;

  constructor() {
    // Use relative URL in production, localhost in development
    const baseURL = import.meta.env.PROD
      ? ""
      : import.meta.env.VITE_API_URL || "http://localhost:3000";
    console.log(
      "🌐 [AdminAuthService] Using backend URL:",
      baseURL || "relative URLs",
    );
    console.log("🔧 [AdminAuthService] Environment:", {
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE,
      VITE_API_URL: import.meta.env.VITE_API_URL,
    });

    this.api = axios.create({
      baseURL,
      withCredentials: true, // For cookies
      timeout: 10000, // 10 second timeout
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("adminAccessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !this.isRefreshing
        ) {
          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const response = await this.refreshToken();
            localStorage.setItem("adminAccessToken", response.accessToken);
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            console.log("🔄 Token refresh failed, clearing auth state");
            localStorage.removeItem("adminAccessToken");
            localStorage.removeItem("adminRefreshToken");
            window.location.href = "/admin/login";
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  async login(
    email: string,
    password: string,
    captcha?: string,
  ): Promise<LoginResponse> {
    console.log("🔐 [AdminAuthService] Attempting login...");
    console.log("📧 [AdminAuthService] Email:", email);

    try {
      // Use the proper admin auth endpoint
      const response = await this.api.post<LoginResponse>(
        "/api/admin/auth/login",
        {
          email,
          password,
          captcha,
        },
      );
      console.log("✅ [AdminAuthService] Login successful");
      
      // Store the access token
      if (response.data.accessToken) {
        localStorage.setItem("adminAccessToken", response.data.accessToken);
      }
      
      return response.data;
    } catch (error: any) {
      console.error("❌ [AdminAuthService] Login failed:", error);
      console.error("🔍 [AdminAuthService] Error details:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
        },
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/api/admin/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearAuthState();
    }
  }

  clearAuthState(): void {
    console.log("🧹 Clearing admin auth state");
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminRefreshToken");
    this.isRefreshing = false;
  }

  async refreshToken(): Promise<RefreshResponse> {
    // Create a separate axios instance for refresh to avoid interceptor loops
    const refreshApi = axios.create({
      baseURL: import.meta.env.PROD
        ? ""
        : import.meta.env.VITE_API_URL || "http://localhost:3000",
      withCredentials: true,
      timeout: 10000,
    });

    const token = localStorage.getItem("adminRefreshToken");
    const response = await refreshApi.post<RefreshResponse>(
      "/api/admin/auth/refresh",
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    return response.data;
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response =
      await this.api.get<CurrentUserResponse>("/api/admin/auth/me");
    return response.data;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.api.post("/api/admin/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.api.post("/api/admin/auth/forgot-password", { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.api.post("/api/admin/auth/reset-password", {
      token,
      newPassword,
    });
  }
}

export const adminAuthService = new AdminAuthService();
