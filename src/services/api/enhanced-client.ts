import { 
  ApiResponse, 
  ApiError, 
  PaginatedResponse, 
  Result,
  HTTPMethod,
  APIEndpoint 
} from '@types/advanced';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
    error?: ErrorInterceptor[];
  };
}

export type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
export type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

export class EnhancedApiClient {
  private config: Required<ApiClientConfig>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private activeRequests = new Map<string, AbortController>();

  constructor(config: ApiClientConfig) {
    this.config = {
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      interceptors: config.interceptors || {},
    };

    // Register interceptors
    if (config.interceptors?.request) {
      this.requestInterceptors.push(...config.interceptors.request);
    }
    if (config.interceptors?.response) {
      this.responseInterceptors.push(...config.interceptors.response);
    }
    if (config.interceptors?.error) {
      this.errorInterceptors.push(...config.interceptors.error);
    }
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.errorInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.config.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let finalConfig = config;
    
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }
    
    return finalConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let finalResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse);
    }
    
    return finalResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: Error): Promise<Error> {
    let finalError = error;
    
    for (const interceptor of this.errorInterceptors) {
      finalError = await interceptor(finalError);
    }
    
    return finalError;
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest(
    url: string,
    options: RequestOptions
  ): Promise<Response> {
    const {
      timeout = this.config.timeout,
      retryAttempts = this.config.retryAttempts,
      retryDelay = this.config.retryDelay,
      signal,
      ...fetchOptions
    } = options;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Create abort controller for timeout
        const abortController = new AbortController();
        const requestId = `${url}-${Date.now()}`;
        this.activeRequests.set(requestId, abortController);

        // Setup timeout
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, timeout);

        // Merge signals
        const mergedSignal = signal 
          ? this.mergeSignals([signal, abortController.signal])
          : abortController.signal;

        // Apply request interceptors
        const finalOptions = await this.applyRequestInterceptors({
          ...fetchOptions,
          signal: mergedSignal,
          headers: {
            ...this.config.headers,
            ...fetchOptions.headers,
          },
        });

        // Execute request
        const response = await fetch(url, finalOptions);
        
        clearTimeout(timeoutId);
        this.activeRequests.delete(requestId);

        // Apply response interceptors
        const finalResponse = await this.applyResponseInterceptors(response);

        if (!finalResponse.ok) {
          throw await this.createApiError(finalResponse);
        }

        return finalResponse;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // Apply error interceptors
        lastError = await this.applyErrorInterceptors(lastError);

        // Wait before retry
        if (attempt < retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Create API error from response
   */
  private async createApiError(response: Response): Promise<ApiError> {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    return {
      code: errorData.code || `HTTP_${response.status}`,
      message: errorData.message || response.statusText,
      details: errorData.details || {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      },
    };
  }

  /**
   * Merge multiple abort signals
   */
  private mergeSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    signals.forEach(signal => {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort());
      }
    });
    
    return controller.signal;
  }

  /**
   * Generic request method
   */
  async request<T>(
    method: HTTPMethod,
    endpoint: APIEndpoint | string,
    options?: RequestOptions & { data?: any }
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    try {
      const url = this.buildURL(endpoint, options?.params);
      
      const requestOptions: RequestOptions = {
        ...options,
        method,
        body: options?.data ? JSON.stringify(options.data) : undefined,
      };

      const response = await this.executeRequest(url, requestOptions);
      const data = await response.json();
      
      return Result.ok({
        data: data.data || data,
        meta: data.meta,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        return Result.err(error as ApiError);
      }
      
      return Result.err({
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { error },
      });
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: APIEndpoint | string,
    options?: RequestOptions
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.request<T>('GET', endpoint, options);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: APIEndpoint | string,
    data?: any,
    options?: RequestOptions
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.request<T>('POST', endpoint, { ...options, data });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: APIEndpoint | string,
    data?: any,
    options?: RequestOptions
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.request<T>('PUT', endpoint, { ...options, data });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: APIEndpoint | string,
    data?: any,
    options?: RequestOptions
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.request<T>('PATCH', endpoint, { ...options, data });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: APIEndpoint | string,
    options?: RequestOptions
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.request<T>('DELETE', endpoint, options);
  }

  /**
   * Get paginated data
   */
  async getPaginated<T>(
    endpoint: APIEndpoint | string,
    params?: Record<string, any> & { page?: number; limit?: number },
    options?: RequestOptions
  ): Promise<Result<PaginatedResponse<T>, ApiError>> {
    const result = await this.get<any>(endpoint, { ...options, params });
    
    if (!result.success) {
      return result;
    }

    return Result.ok({
      data: result.data.data.items || result.data.data,
      pagination: {
        page: params?.page || 1,
        pageSize: params?.limit || 10,
        total: result.data.data.total || 0,
        totalPages: result.data.data.totalPages || 0,
        hasNext: result.data.data.hasNext || false,
        hasPrevious: result.data.data.hasPrevious || false,
      },
      meta: result.data.meta,
    });
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }

  /**
   * Create a new instance with extended config
   */
  extend(config: Partial<ApiClientConfig>): EnhancedApiClient {
    return new EnhancedApiClient({
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    });
  }
}

// Create default instance
export const apiClient = new EnhancedApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
});

// Add auth interceptor
apiClient.addRequestInterceptor((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Add error logging interceptor
apiClient.addErrorInterceptor((error) => {
  console.error('[API Error]', error);
  return error;
});