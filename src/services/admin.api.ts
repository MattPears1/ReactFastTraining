import { AxiosInstance } from "axios";
import axios from "@/admin/services/axios-init";

class AdminApi {
  private api: AxiosInstance | null = null;

  constructor() {
    this.initializeApi();
  }

  private initializeApi() {
    try {
      // Use relative URL in production, localhost in development
      const baseURL = import.meta.env.PROD
        ? ""
        : import.meta.env.VITE_API_URL || "http://localhost:3000";

      console.log("[AdminApi] Initializing with axios:", !!axios);
      
      if (!axios || !axios.create) {
        throw new Error("Axios is not available");
      }

      this.api = axios.create({
        baseURL,
        withCredentials: true,
        timeout: 10000,
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

      // Response interceptor to handle errors
      this.api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Clear tokens and redirect to login
            localStorage.removeItem("adminAccessToken");
            localStorage.removeItem("adminRefreshToken");
            window.location.href = "/admin/login";

            return Promise.reject(error);
          }

          return Promise.reject(error);
        },
      );

      console.log("[AdminApi] Initialized successfully");
    } catch (error) {
      console.error("[AdminApi] Failed to initialize:", error);
      // Create a fallback that throws errors
      this.api = {
        get: () => Promise.reject(new Error("AdminApi not initialized")),
        post: () => Promise.reject(new Error("AdminApi not initialized")),
        put: () => Promise.reject(new Error("AdminApi not initialized")),
        patch: () => Promise.reject(new Error("AdminApi not initialized")),
        delete: () => Promise.reject(new Error("AdminApi not initialized")),
      } as any;
    }
  }

  // Expose the common HTTP methods with safe fallbacks
  get = (...args: any[]) => {
    if (!this.api) {
      console.error("[AdminApi] API not initialized for GET request");
      return Promise.reject(new Error("AdminApi not initialized"));
    }
    return this.api.get(...args);
  };

  post = (...args: any[]) => {
    if (!this.api) {
      console.error("[AdminApi] API not initialized for POST request");
      return Promise.reject(new Error("AdminApi not initialized"));
    }
    return this.api.post(...args);
  };

  put = (...args: any[]) => {
    if (!this.api) {
      console.error("[AdminApi] API not initialized for PUT request");
      return Promise.reject(new Error("AdminApi not initialized"));
    }
    return this.api.put(...args);
  };

  patch = (...args: any[]) => {
    if (!this.api) {
      console.error("[AdminApi] API not initialized for PATCH request");
      return Promise.reject(new Error("AdminApi not initialized"));
    }
    return this.api.patch(...args);
  };

  delete = (...args: any[]) => {
    if (!this.api) {
      console.error("[AdminApi] API not initialized for DELETE request");
      return Promise.reject(new Error("AdminApi not initialized"));
    }
    return this.api.delete(...args);
  };
}

// Create instance but don't export immediately
let adminApiInstance: AdminApi | null = null;

// Export a getter that ensures the instance is created after axios is loaded
export const getAdminApi = () => {
  if (!adminApiInstance) {
    adminApiInstance = new AdminApi();
  }
  return adminApiInstance;
};

// For backward compatibility, export a proxy that initializes on first use
export const adminApi = new Proxy({} as AdminApi, {
  get(target, prop) {
    const api = getAdminApi();
    return (api as any)[prop];
  }
});