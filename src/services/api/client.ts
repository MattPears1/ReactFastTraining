import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenService } from "@/services/auth/token.service";
import { AuthErrorService } from "@/services/auth/error.service";
import { csrfService } from "@/services/auth/csrf.service";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add token and CSRF protection
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token
    const token = tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    const method = config.method?.toUpperCase();
    if (method && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      config.headers["X-CSRF-Token"] = csrfService.getToken();
    }

    // Add request timestamp for debugging
    config.headers["X-Request-Time"] = new Date().toISOString();

    // Add request ID for tracing
    config.headers["X-Request-ID"] = crypto.randomUUID();

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshed = await handleTokenRefresh();
      if (refreshed) {
        // Retry original request with new token
        const token = tokenService.getAccessToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } else {
        // Redirect to login
        tokenService.clearTokens();
        window.location.href = "/login?sessionExpired=true";
      }
    }

    // Parse and throw auth error
    const authError = AuthErrorService.parseError(error);
    return Promise.reject(authError);
  },
);

// Handle token refresh (placeholder - implement when backend supports it)
async function handleTokenRefresh(): Promise<boolean> {
  try {
    // TODO: Implement refresh token endpoint when backend supports it
    // const response = await apiClient.post('/auth/refresh');
    // tokenService.setTokens(response.data.token, response.data.expiresAt);
    // return true;
    return false;
  } catch (error) {
    return false;
  }
}

// Listen for token refresh events
window.addEventListener("auth:token-refresh-needed", () => {
  handleTokenRefresh();
});

export default apiClient;
