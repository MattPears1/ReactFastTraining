import axios, { AxiosInstance } from 'axios';

class AdminApi {
  private api: AxiosInstance;

  constructor() {
    // Use relative URL in production, localhost in development
    const baseURL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');
    
    this.api = axios.create({
      baseURL,
      withCredentials: true,
      timeout: 10000,
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

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Clear tokens and redirect to login
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
          window.location.href = '/admin/login';
          
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  // Expose the common HTTP methods
  get = this.api.get.bind(this.api);
  post = this.api.post.bind(this.api);
  put = this.api.put.bind(this.api);
  patch = this.api.patch.bind(this.api);
  delete = this.api.delete.bind(this.api);
}

export const adminApi = new AdminApi();