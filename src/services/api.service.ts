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
    const baseURL = import.meta.env.VITE_API_URL || "/api";
    
    console.log('🌐 [API] Initializing API Service...', {
      baseURL: baseURL,
      timeout: 30000,
      env: import.meta.env.MODE,
      timestamp: new Date().toISOString()
    });
    
    this.api = axios.create({
      baseURL: baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    console.log('✅ [API] Axios instance created');

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const fullUrl = `${config.baseURL}${config.url}`;
        
        console.log('🚀 [API] Making request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          fullUrl: fullUrl,
          baseURL: config.baseURL,
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization ? '[REDACTED]' : undefined
          },
          params: config.params,
          timestamp: new Date().toISOString()
        });
        
        // Add auth token if available
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 [AUTH] Auth token added to request');
        } else {
          console.log('🔓 [AUTH] No auth token found');
        }
        
        return config;
      },
      (error) => {
        console.error('❌ [API] Request interceptor error:', {
          error: error,
          message: error.message,
          timestamp: new Date().toISOString()
        });
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ [API] Response received:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          method: response.config.method?.toUpperCase(),
          headers: response.headers,
          timestamp: new Date().toISOString()
        });
        
        return response;
      },
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || "An error occurred";
          
          console.error('❌ [API] Server error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            message: message,
            data: error.response.data,
            headers: error.response.headers,
            timestamp: new Date().toISOString()
          });

          if (error.response.status === 401) {
            console.warn('🔒 [AUTH] Unauthorized - clearing token and redirecting to login');
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem("authToken");
            window.location.href = "/login";
          } else if (error.response.status === 429) {
            console.warn('⏱️ [API] Rate limited - too many requests');
            // Rate limited
            // showToast?.('error', 'Too many requests. Please try again later.')
          }
        } else if (error.request) {
          console.error('❌ [API] Network error - no response received:', {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            request: error.request,
            message: error.message,
            timestamp: new Date().toISOString()
          });
          // Request made but no response
          // showToast?.('error', 'Network error. Please check your connection.')
        } else {
          console.error('❌ [API] Request setup error:', {
            message: error.message,
            config: error.config,
            timestamp: new Date().toISOString()
          });
        }

        return Promise.reject(error);
      },
    );
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log('📥 [API] GET request:', { url, params: config?.params });
    try {
      const response = await this.api.get<T>(url, config);
      console.log('✅ [API] GET success:', { url, dataReceived: !!response.data });
      return response.data;
    } catch (error) {
      console.error('❌ [API] GET failed:', { url, error });
      throw error;
    }
  }

  // POST request
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    console.log('📤 [API] POST request:', { url, hasData: !!data });
    try {
      const response = await this.api.post<T>(url, data, config);
      console.log('✅ [API] POST success:', { url, dataReceived: !!response.data });
      return response.data;
    } catch (error) {
      console.error('❌ [API] POST failed:', { url, error });
      throw error;
    }
  }

  // PUT request
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    console.log('📝 [API] PUT request:', { url, hasData: !!data });
    try {
      const response = await this.api.put<T>(url, data, config);
      console.log('✅ [API] PUT success:', { url, dataReceived: !!response.data });
      return response.data;
    } catch (error) {
      console.error('❌ [API] PUT failed:', { url, error });
      throw error;
    }
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log('🗑️ [API] DELETE request:', { url });
    try {
      const response = await this.api.delete<T>(url, config);
      console.log('✅ [API] DELETE success:', { url, dataReceived: !!response.data });
      return response.data;
    } catch (error) {
      console.error('❌ [API] DELETE failed:', { url, error });
      throw error;
    }
  }

  // PATCH request
  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    console.log('🔧 [API] PATCH request:', { url, hasData: !!data });
    try {
      const response = await this.api.patch<T>(url, data, config);
      console.log('✅ [API] PATCH success:', { url, dataReceived: !!response.data });
      return response.data;
    } catch (error) {
      console.error('❌ [API] PATCH failed:', { url, error });
      throw error;
    }
  }
}

// Export a singleton instance
console.log('🌐 [API] Creating singleton API service instance...');
export const apiService = new ApiService();
console.log('✅ [API] API service singleton created and exported');

// Export specific API endpoints
export const contactApi = {
  submitForm: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    course?: string;
    numberOfPeople?: string;
    preferredDate?: string;
    preferredTime?: string;
    subject: string;
    message: string;
    consent: boolean;
  }) => {
    // Combine first and last name for the backend
    const formData = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      courseInterest: data.course,
    };
    const response = await apiService.post<{ message: string }>(
      "/contact/submit",
      formData,
    );
    return { success: true, message: response.message };
  },
};

export const newsletterApi = {
  subscribe: async (email: string) => {
    const response = await apiService.post<{ message: string }>(
      "/newsletter/subscribe",
      { email },
    );
    return { success: true, message: response.message };
  },
  unsubscribe: async (token: string) => {
    return apiService.post<{ success: boolean; message: string }>(
      "/newsletter/unsubscribe",
      { token },
    );
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    return apiService.post<{ token: string; user: any }>("/auth/login", {
      email,
      password,
    });
  },
  register: async (data: any) => {
    return apiService.post<{ token: string; user: any }>(
      "/auth/register",
      data,
    );
  },
  logout: async () => {
    return apiService.post("/auth/logout");
  },
  refreshToken: async () => {
    return apiService.post<{ token: string }>("/auth/refresh");
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
      "/bookings/courses/available",
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
    }>("/bookings/create", data);
  },

  getBookingByCode: async (confirmationCode: string) => {
    return apiService.get<{ success: boolean; data: any }>(
      `/bookings/confirmation/${confirmationCode}`,
    );
  },

  getUserBookings: async (status?: string) => {
    return apiService.get<{ success: boolean; data: any[] }>(
      "/bookings/my-bookings",
      {
        params: status ? { status } : undefined,
      },
    );
  },

  cancelBooking: async (id: number, reason: string) => {
    return apiService.put<{ success: boolean; message: string }>(
      `/bookings/${id}/cancel`,
      { reason },
    );
  },
};
