/**
 * Authenticated fetch wrapper for admin API calls
 * Automatically adds JWT token from localStorage
 */

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function adminFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  // Always use relative URLs to leverage Vite proxy in development
  const apiUrl = "";

  // Ensure URL starts with /
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = `${apiUrl}${normalizedUrl}`;

  // Get the auth token
  const token = localStorage.getItem("adminAccessToken");

  // Build headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add auth token unless explicitly skipped
  if (token && !options.skipAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Make the request
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Handle 401 errors
  if (response.status === 401 && !options.skipAuth) {
    // Token might be expired, clear auth state and redirect to login
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminRefreshToken");
    window.location.href = "/admin/login";
  }

  return response;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const adminApi = {
  get: (url: string, options?: FetchOptions) =>
    adminFetch(url, { ...options, method: "GET" }),

  post: (url: string, body?: any, options?: FetchOptions) =>
    adminFetch(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (url: string, body?: any, options?: FetchOptions) =>
    adminFetch(url, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (url: string, options?: FetchOptions) =>
    adminFetch(url, { ...options, method: "DELETE" }),
};
