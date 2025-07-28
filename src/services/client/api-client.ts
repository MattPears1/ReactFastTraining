import { apiService } from "@/services/api.service";
import {
  ClientPortalError,
  NetworkError,
  ValidationError as ValidationErrorClass,
  type ApiResponse,
  type PaginatedApiResponse,
  type ValidationError,
} from "@/types/client/enhanced.types";

interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

class ApiClient {
  private defaultConfig: RequestConfig = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
  };

  private async makeRequest<T>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= mergedConfig.retries!; attempt++) {
      try {
        const response = await apiService[method](url, data, {
          timeout: mergedConfig.timeout,
          signal: mergedConfig.signal,
        });

        // Check if response has expected structure
        if (response.data && typeof response.data === "object") {
          // Handle API-level errors
          if ("error" in response.data && response.data.error) {
            throw new ClientPortalError(
              response.data.error.message || "API error occurred",
              response.data.error.code,
              response.data.error.details,
            );
          }

          // Handle validation errors
          if (
            "errors" in response.data &&
            Array.isArray(response.data.errors)
          ) {
            throw new ValidationErrorClass(response.data.errors);
          }

          // Return successful data
          return response.data.data || response.data;
        }

        return response.data;
      } catch (error) {
        lastError = this.handleError(error);

        // Don't retry on client errors or abort
        if (
          lastError instanceof ClientPortalError ||
          lastError instanceof ValidationErrorClass ||
          (lastError instanceof Error && lastError.name === "AbortError")
        ) {
          throw lastError;
        }

        // Don't retry on 4xx errors
        if (
          lastError instanceof NetworkError &&
          lastError.statusCode &&
          lastError.statusCode >= 400 &&
          lastError.statusCode < 500
        ) {
          throw lastError;
        }

        // Wait before retrying
        if (attempt < mergedConfig.retries!) {
          await this.delay(mergedConfig.retryDelay! * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new ClientPortalError("Request failed after retries");
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return error;
      }
      if (error.message.includes("timeout")) {
        return new NetworkError("Request timed out");
      }
      if (error.message.includes("Network Error")) {
        return new NetworkError("Network connection error");
      }
      return error;
    }

    if (typeof error === "object" && error !== null) {
      const err = error as any;
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401) {
          return new ClientPortalError(
            "Authentication required",
            "UNAUTHORIZED",
          );
        }
        if (status === 403) {
          return new ClientPortalError("Access denied", "FORBIDDEN");
        }
        if (status === 404) {
          return new ClientPortalError("Resource not found", "NOT_FOUND");
        }
        if (status === 422 && data?.errors) {
          return new ValidationErrorClass(data.errors);
        }
        if (status >= 500) {
          return new NetworkError("Server error", status);
        }

        return new NetworkError(
          data?.message || `Request failed with status ${status}`,
          status,
        );
      }
    }

    return new ClientPortalError("An unexpected error occurred");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>("get", url, undefined, config);
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>("post", url, data, config);
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>("put", url, data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>("delete", url, undefined, config);
  }

  // Specialized methods
  async getApiResponse<T>(
    url: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    const data = await this.get<any>(url, config);
    return {
      success: true,
      data: data as T,
    };
  }

  async getPaginated<T>(
    url: string,
    params?: Record<string, any>,
    config?: RequestConfig,
  ): Promise<PaginatedApiResponse<T>> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    const response = await this.get<any>(`${url}${queryString}`, config);

    return {
      success: true,
      data: response.data || response.items || [],
      pagination: response.pagination,
    };
  }
}

export const apiClient = new ApiClient();
