import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
// Toast functionality will be injected where this service is used

interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "/api",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || "An error occurred";

          if (error.response.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem("authToken");
            window.location.href = "/login";
          } else if (error.response.status === 429) {
            // Rate limited
            // showToast?.('error', 'Too many requests. Please try again later.')
          }
        } else if (error.request) {
          // Request made but no response
          // showToast?.('error', 'Network error. Please check your connection.')
        }

        return Promise.reject(error);
      },
    );
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  // POST request
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  // PUT request
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // PATCH request
  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }
}

// Export a singleton instance
export const apiService = new ApiService();

// Export specific API endpoints
export const contactApi = {
  submitForm: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    subject: string;
    message: string;
    consent: boolean;
  }) => {
    return apiService.post<{ success: boolean; message: string }>(
      "/v1/contact/submit",
      data,
    );
  },
};

export const newsletterApi = {
  subscribe: async (email: string) => {
    return apiService.post<{ success: boolean; message: string }>(
      "/v1/newsletter/subscribe",
      { email },
    );
  },
  unsubscribe: async (token: string) => {
    return apiService.post<{ success: boolean; message: string }>(
      "/v1/newsletter/unsubscribe",
      { token },
    );
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    return apiService.post<{ token: string; user: any }>("/v1/auth/login", {
      email,
      password,
    });
  },
  register: async (data: any) => {
    return apiService.post<{ token: string; user: any }>(
      "/v1/auth/register",
      data,
    );
  },
  logout: async () => {
    return apiService.post("/v1/auth/logout");
  },
  refreshToken: async () => {
    return apiService.post<{ token: string }>("/v1/auth/refresh");
  },
};

// Export booking API
export const bookingApi = {
  getAvailableCourses: async (params?: {
    courseType?: string;
    venue?: string;
    month?: string;
  }) => {
    return apiService.get<{ success: boolean; data: any[] }>(
      "/v1/bookings/courses/available",
      { params },
    );
  },

  createBooking: async (data: {
    courseScheduleId: number;
    numberOfParticipants: number;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    companyName?: string;
    companyAddress?: string;
    specialRequirements?: string;
    participantDetails?: any[];
  }) => {
    return apiService.post<{
      success: boolean;
      message: string;
      data: {
        bookingId: number;
        confirmationCode: string;
        totalPrice: number;
      };
    }>("/v1/bookings/create", data);
  },

  getBookingByCode: async (confirmationCode: string) => {
    return apiService.get<{ success: boolean; data: any }>(
      `/v1/bookings/confirmation/${confirmationCode}`,
    );
  },

  getUserBookings: async (status?: string) => {
    return apiService.get<{ success: boolean; data: any[] }>(
      "/v1/bookings/my-bookings",
      {
        params: status ? { status } : undefined,
      },
    );
  },

  cancelBooking: async (id: number, reason: string) => {
    return apiService.put<{ success: boolean; message: string }>(
      `/v1/bookings/${id}/cancel`,
      { reason },
    );
  },
};
