import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";
import { ClientPortalError } from "@/types/client/enhanced.types";

// Input validation schemas
export const bookingIdSchema = z.string().uuid("Invalid booking ID format");
export const emailSchema = z.string().email("Invalid email format");
export const phoneSchema = z
  .string()
  .regex(
    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    "Invalid phone number",
  );
export const dateSchema = z.string().datetime("Invalid date format");
export const searchSchema = z
  .string()
  .max(100, "Search query too long")
  .regex(/^[a-zA-Z0-9\s\-._@]+$/, "Invalid characters in search");

// Sanitization functions
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Remove control characters
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 255);
};

// Security headers for downloads
export const getSecureDownloadHeaders = (): HeadersInit => ({
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
  "X-Frame-Options": "DENY",
});

// Rate limiting
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(private config: RateLimitConfig) {}

  check(key: string): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Create rate limiters for different operations
export const downloadRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 10 downloads per minute
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 100 API calls per minute
});

// CSRF token management
class CSRFManager {
  private tokenKey = "client-portal-csrf";

  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    sessionStorage.setItem(this.tokenKey, token);
    return token;
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  clearToken(): void {
    sessionStorage.removeItem(this.tokenKey);
  }
}

export const csrfManager = new CSRFManager();

// Content Security Policy
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // For React
    "style-src 'self' 'unsafe-inline'", // For styled components
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.reactfasttraining.co.uk",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
};

// Secure storage wrapper
export class SecureStorage {
  private encrypt(data: string): string {
    // In production, use proper encryption
    return btoa(encodeURIComponent(data));
  }

  private decrypt(data: string): string {
    // In production, use proper decryption
    try {
      return decodeURIComponent(atob(data));
    } catch {
      throw new ClientPortalError("Failed to decrypt data");
    }
  }

  setItem(key: string, value: any): void {
    const data = JSON.stringify(value);
    const encrypted = this.encrypt(data);
    localStorage.setItem(`secure_${key}`, encrypted);
  }

  getItem<T>(key: string): T | null {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;

    try {
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      this.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("secure_"))
      .forEach((key) => localStorage.removeItem(key));
  }
}

export const secureStorage = new SecureStorage();

// XSS prevention utilities
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// SQL injection prevention (for search queries)
export const escapeSqlLike = (unsafe: string): string => {
  return unsafe.replace(/[%_]/g, "\\$&").replace(/'/g, "''");
};

// Validate file uploads
export const validateFileUpload = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {},
): void => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ["application/pdf"] } =
    options;

  if (file.size > maxSize) {
    throw new ClientPortalError(
      `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    );
  }

  if (!allowedTypes.includes(file.type)) {
    throw new ClientPortalError(`File type ${file.type} is not allowed`);
  }

  // Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  const expectedExtensions = {
    "application/pdf": ["pdf"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
  };

  const validExtensions = allowedTypes.flatMap(
    (type) => expectedExtensions[type] || [],
  );
  if (!extension || !validExtensions.includes(extension)) {
    throw new ClientPortalError("Invalid file extension");
  }
};
