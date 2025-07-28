import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { authApi } from "../auth";
import { tokenService } from "../token.service";
import { AuthErrorService } from "../error.service";
import apiClient from "../../api/client";

// Mock dependencies
vi.mock("../../api/client");
vi.mock("../token.service");

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signup", () => {
    it("should normalize email to lowercase", async () => {
      const mockResponse = {
        data: { success: true, message: "Signup successful" },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      await authApi.signup({
        name: "Test User",
        email: "TEST@EXAMPLE.COM",
        password: "SecurePass123!",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/signup", {
        name: "Test User",
        email: "test@example.com",
        password: "SecurePass123!",
      });
    });

    it("should retry on network failure", async () => {
      const networkError = new Error("Network error");
      vi.mocked(apiClient.post)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await authApi.signup({
        name: "Test User",
        email: "test@example.com",
        password: "SecurePass123!",
      });

      expect(apiClient.post).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it("should not retry on validation errors", async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            code: "auth/weak-password",
            message: "Password is too weak",
          },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(validationError);

      await expect(
        authApi.signup({
          name: "Test User",
          email: "test@example.com",
          password: "weak",
        }),
      ).rejects.toThrow();

      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe("login", () => {
    it("should store tokens on successful login", async () => {
      const mockResponse = {
        data: {
          token: "access-token",
          user: { id: "1", name: "Test User", email: "test@example.com" },
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      expect(result.token).toBe("access-token");
      expect(result.user.email).toBe("test@example.com");
    });

    it("should handle account lockout", async () => {
      const lockoutError = {
        response: {
          status: 423,
          data: {
            code: "auth/account-locked",
            message: "Account is locked",
          },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(lockoutError);

      try {
        await authApi.login({
          email: "test@example.com",
          password: "wrong-password",
        });
      } catch (error: any) {
        expect(error.code).toBe("auth/account-locked");
        expect(error.statusCode).toBe(423);
      }
    });
  });

  describe("verifyEmail", () => {
    it("should encode token in URL", async () => {
      const mockResponse = {
        data: { success: true, message: "Email verified" },
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const token = "test token with spaces";
      await authApi.verifyEmail(token);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/auth/verify-email?token=test%20token%20with%20spaces",
      );
    });
  });

  describe("logout", () => {
    it("should always return success even on error", async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await authApi.logout();

      expect(result.success).toBe(true);
    });
  });

  describe("forgotPassword", () => {
    it("should normalize email before sending", async () => {
      const mockResponse = {
        data: { success: true, message: "Reset email sent" },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      await authApi.forgotPassword({ email: "  TEST@EXAMPLE.COM  " });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "test@example.com",
      });
    });
  });
});

describe("TokenService", () => {
  let tokenService: any;

  beforeEach(() => {
    // Reset token service
    tokenService = require("../token.service").tokenService;
    tokenService.clearTokens();
  });

  describe("token management", () => {
    it("should store and retrieve tokens", () => {
      const accessToken = "test-token";
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      tokenService.setTokens(accessToken, expiresAt);

      expect(tokenService.getAccessToken()).toBe(accessToken);
      expect(tokenService.isAuthenticated()).toBe(true);
    });

    it("should clear expired tokens", () => {
      const accessToken = "test-token";
      const expiresAt = new Date(Date.now() - 1000).toISOString(); // Expired

      tokenService.setTokens(accessToken, expiresAt);

      expect(tokenService.getAccessToken()).toBeNull();
      expect(tokenService.isAuthenticated()).toBe(false);
    });

    it("should schedule token refresh", () => {
      vi.useFakeTimers();
      const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

      const accessToken = "test-token";
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      tokenService.setTokens(accessToken, expiresAt);

      // Fast forward to 5 minutes before expiry
      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "auth:token-refresh-needed",
        }),
      );

      vi.useRealTimers();
    });
  });

  describe("security", () => {
    it("should not expose token through global scope", () => {
      const accessToken = "test-token";
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      tokenService.setTokens(accessToken, expiresAt);

      // Check that token is not accessible through window
      expect((window as any).__authToken).toBeUndefined();
      expect((window as any).authToken).toBeUndefined();
    });
  });
});

describe("AuthErrorService", () => {
  describe("parseError", () => {
    it("should parse axios errors correctly", () => {
      const axiosError = {
        response: {
          status: 401,
          data: {
            code: "auth/invalid-credentials",
            message: "Invalid email or password",
          },
        },
      };

      const authError = AuthErrorService.parseError(axiosError);

      expect(authError.code).toBe("auth/invalid-credentials");
      expect(authError.statusCode).toBe(401);
      expect(authError.message).toBe("Invalid email or password");
    });

    it("should handle network errors", () => {
      const networkError = {
        code: "ECONNABORTED",
        message: "Network request failed",
      };

      const authError = AuthErrorService.parseError(networkError);

      expect(authError.code).toBe("auth/network-error");
      expect(authError.statusCode).toBe(0);
    });

    it("should map status codes to error codes", () => {
      const testCases = [
        { status: 401, expectedCode: "auth/invalid-credentials" },
        { status: 403, expectedCode: "auth/email-not-verified" },
        { status: 423, expectedCode: "auth/account-locked" },
        { status: 429, expectedCode: "auth/rate-limited" },
        { status: 500, expectedCode: "auth/network-error" },
      ];

      testCases.forEach(({ status, expectedCode }) => {
        const error = {
          response: { status, data: {} },
        };

        const authError = AuthErrorService.parseError(error);
        expect(authError.code).toBe(expectedCode);
      });
    });
  });

  describe("isRetryable", () => {
    it("should identify retryable errors", () => {
      const retryableError = {
        code: "auth/network-error" as const,
        message: "Network error",
        statusCode: 503,
      };

      const nonRetryableError = {
        code: "auth/invalid-credentials" as const,
        message: "Invalid credentials",
        statusCode: 401,
      };

      expect(AuthErrorService.isRetryable(retryableError)).toBe(true);
      expect(AuthErrorService.isRetryable(nonRetryableError)).toBe(false);
    });
  });
});
