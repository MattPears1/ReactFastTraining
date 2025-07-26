import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../useAuth';

// Mock API functions
vi.mock('@/services/api', () => ({
  auth: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns auth state and methods', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('register');
  });

  it('starts with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles login successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    const mockToken = 'mock-jwt-token';
    
    const { auth } = await import('@/services/api');
    vi.mocked(auth.login).mockResolvedValue({
      user: mockUser,
      token: mockToken,
      refreshToken: 'mock-refresh-token',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('authToken')).toBe(mockToken);
  });

  it('handles login failure', async () => {
    const { auth } = await import('@/services/api');
    vi.mocked(auth.login).mockRejectedValue(new Error('Invalid credentials'));
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrong-password');
      })
    ).rejects.toThrow('Invalid credentials');
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles logout', async () => {
    const { auth } = await import('@/services/api');
    vi.mocked(auth.logout).mockResolvedValue();
    
    // Set initial authenticated state
    localStorage.setItem('authToken', 'mock-token');
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    // Mock initial user
    act(() => {
      result.current.user = { id: '1', email: 'test@example.com', name: 'Test' };
    });
    
    await act(async () => {
      await result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('handles registration', async () => {
    const mockUser = { id: '2', email: 'new@example.com', name: 'New User' };
    
    const { auth } = await import('@/services/api');
    vi.mocked(auth.register).mockResolvedValue({
      user: mockUser,
      token: 'new-token',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      await result.current.register({
        email: 'new@example.com',
        password: 'password',
        name: 'New User',
      });
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('loads user from token on mount', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    localStorage.setItem('authToken', 'existing-token');
    
    const { auth } = await import('@/services/api');
    vi.mocked(auth.getCurrentUser).mockResolvedValue(mockUser);
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('handles token refresh', async () => {
    const newToken = 'new-access-token';
    localStorage.setItem('refreshToken', 'refresh-token');
    
    const { auth } = await import('@/services/api');
    vi.mocked(auth.refreshToken).mockResolvedValue({
      token: newToken,
      refreshToken: 'new-refresh-token',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      await result.current.refreshAccessToken();
    });
    
    expect(localStorage.getItem('authToken')).toBe(newToken);
  });

  it('handles forgot password', async () => {
    const { auth } = await import('@/services/api');
    vi.mocked(auth.forgotPassword).mockResolvedValue({
      message: 'Reset email sent',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      const response = await result.current.forgotPassword('test@example.com');
      expect(response.message).toBe('Reset email sent');
    });
    
    expect(auth.forgotPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('handles password reset', async () => {
    const { auth } = await import('@/services/api');
    vi.mocked(auth.resetPassword).mockResolvedValue({
      message: 'Password reset successful',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      const response = await result.current.resetPassword('reset-token', 'new-password');
      expect(response.message).toBe('Password reset successful');
    });
  });

  it('handles email verification', async () => {
    const { auth } = await import('@/services/api');
    vi.mocked(auth.verifyEmail).mockResolvedValue({
      message: 'Email verified',
      user: { id: '1', email: 'test@example.com', emailVerified: true },
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      await result.current.verifyEmail('verification-token');
    });
    
    expect(result.current.user?.emailVerified).toBe(true);
  });

  it('handles session expiry', async () => {
    vi.useFakeTimers();
    
    const mockUser = { id: '1', email: 'test@example.com' };
    const { auth } = await import('@/services/api');
    vi.mocked(auth.login).mockResolvedValue({
      user: mockUser,
      token: 'token',
      expiresIn: 3600, // 1 hour
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    
    // Fast forward past expiry
    act(() => {
      vi.advanceTimersByTime(3600 * 1000 + 1);
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
    
    vi.useRealTimers();
  });

  it('handles remember me functionality', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const { auth } = await import('@/services/api');
    vi.mocked(auth.login).mockResolvedValue({
      user: mockUser,
      token: 'token',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      await result.current.login('test@example.com', 'password', true);
    });
    
    // Should persist to localStorage when remember me is true
    expect(localStorage.getItem('authToken')).toBeTruthy();
    expect(sessionStorage.getItem('authToken')).toBeNull();
    
    await act(async () => {
      await result.current.logout();
      await result.current.login('test@example.com', 'password', false);
    });
    
    // Should use sessionStorage when remember me is false
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(sessionStorage.getItem('authToken')).toBeTruthy();
  });

  it('provides permission checking', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    // Set user with roles
    act(() => {
      result.current.user = {
        id: '1',
        email: 'test@example.com',
        roles: ['user', 'admin'],
        permissions: ['read:posts', 'write:posts', 'delete:posts'],
      };
    });
    
    expect(result.current.hasRole('admin')).toBe(true);
    expect(result.current.hasRole('superadmin')).toBe(false);
    expect(result.current.hasPermission('write:posts')).toBe(true);
    expect(result.current.hasPermission('write:users')).toBe(false);
  });

  it('handles social login', async () => {
    const mockUser = { id: '1', email: 'social@example.com', provider: 'google' };
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      await result.current.socialLogin('google', 'social-token');
    });
    
    expect(result.current.user?.provider).toBe('google');
  });

  it('handles two-factor authentication', async () => {
    const { auth } = await import('@/services/api');
    vi.mocked(auth.login).mockResolvedValue({
      requiresTwoFactor: true,
      tempToken: 'temp-2fa-token',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    
    await act(async () => {
      const response = await result.current.login('test@example.com', 'password');
      expect(response.requiresTwoFactor).toBe(true);
    });
    
    // Verify 2FA code
    await act(async () => {
      await result.current.verifyTwoFactor('temp-2fa-token', '123456');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('tracks authentication events', () => {
    const onAuthChange = vi.fn();
    const { result } = renderHook(() => useAuth({ onAuthChange }), {
      wrapper: createWrapper(),
    });
    
    act(() => {
      result.current.user = { id: '1', email: 'test@example.com' };
    });
    
    expect(onAuthChange).toHaveBeenCalledWith({
      type: 'login',
      user: { id: '1', email: 'test@example.com' },
    });
  });
});