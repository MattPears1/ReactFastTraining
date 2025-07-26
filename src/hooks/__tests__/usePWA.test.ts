import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWA } from '../usePWA';

// Mock service worker
const mockServiceWorker = {
  register: vi.fn(),
  ready: Promise.resolve({
    active: { postMessage: vi.fn() },
    update: vi.fn(),
  }),
};

// Mock navigator
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: mockServiceWorker,
});

describe('usePWA Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('returns PWA state and methods', () => {
    const { result } = renderHook(() => usePWA());
    
    expect(result.current).toHaveProperty('isInstalled');
    expect(result.current).toHaveProperty('isOnline');
    expect(result.current).toHaveProperty('isUpdateAvailable');
    expect(result.current).toHaveProperty('installPrompt');
    expect(result.current).toHaveProperty('updateApp');
    expect(result.current).toHaveProperty('checkForUpdates');
  });

  it('detects online/offline status', () => {
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.isOnline).toBe(true);
    
    // Go offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOnline).toBe(false);
    
    // Go back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current.isOnline).toBe(true);
  });

  it('detects PWA installation status', () => {
    // Mock as standalone app
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.isInstalled).toBe(true);
  });

  it('registers service worker on mount', async () => {
    mockServiceWorker.register.mockResolvedValue({
      installing: null,
      waiting: null,
      active: { state: 'activated' },
    });
    
    renderHook(() => usePWA());
    
    await waitFor(() => {
      expect(mockServiceWorker.register).toHaveBeenCalledWith(
        '/service-worker.js',
        { scope: '/' }
      );
    });
  });

  it('detects service worker updates', async () => {
    const mockRegistration = {
      installing: null,
      waiting: { postMessage: vi.fn() },
      active: { state: 'activated' },
      addEventListener: vi.fn(),
      update: vi.fn(),
    };
    
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => usePWA());
    
    // Simulate update found
    act(() => {
      const updateCallback = mockRegistration.addEventListener.mock.calls.find(
        call => call[0] === 'updatefound'
      )?.[1];
      
      if (updateCallback) {
        mockRegistration.installing = { 
          state: 'installing',
          addEventListener: vi.fn(),
        };
        updateCallback();
      }
    });
    
    await waitFor(() => {
      expect(result.current.isUpdateAvailable).toBe(true);
    });
  });

  it('handles app update', async () => {
    const mockWaiting = { postMessage: vi.fn() };
    const mockRegistration = {
      waiting: mockWaiting,
      addEventListener: vi.fn(),
    };
    
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => usePWA());
    
    // Set update available
    act(() => {
      result.current.isUpdateAvailable = true;
    });
    
    // Trigger update
    await act(async () => {
      await result.current.updateApp();
    });
    
    expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('checks for updates periodically', async () => {
    vi.useFakeTimers();
    
    const mockRegistration = {
      update: vi.fn(),
    };
    
    mockServiceWorker.register.mockResolvedValue(mockRegistration);
    
    renderHook(() => usePWA({ checkInterval: 60000 })); // 1 minute
    
    // Fast forward 1 minute
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    
    expect(mockRegistration.update).toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('handles beforeinstallprompt event', () => {
    const { result } = renderHook(() => usePWA());
    
    const mockPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
      preventDefault: vi.fn(),
    };
    
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt', mockPrompt));
    });
    
    expect(result.current.installPrompt).toBeDefined();
  });

  it('shows install prompt when available', async () => {
    const { result } = renderHook(() => usePWA());
    
    const mockPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
      preventDefault: vi.fn(),
    };
    
    // Set install prompt
    act(() => {
      result.current.installPrompt = mockPrompt;
    });
    
    // Show prompt
    await act(async () => {
      const outcome = await result.current.showInstallPrompt();
      expect(outcome).toBe('accepted');
    });
    
    expect(mockPrompt.prompt).toHaveBeenCalled();
  });

  it('tracks PWA metrics', () => {
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.metrics).toHaveProperty('installTime');
    expect(result.current.metrics).toHaveProperty('updateCount');
    expect(result.current.metrics).toHaveProperty('offlineTime');
  });

  it('handles network speed detection', async () => {
    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.networkInfo).toEqual({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    });
    
    // Simulate network change
    act(() => {
      navigator.connection.effectiveType = '3g';
      const changeCallback = navigator.connection.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      if (changeCallback) changeCallback();
    });
    
    expect(result.current.networkInfo.effectiveType).toBe('3g');
  });

  it('provides cache management methods', async () => {
    const mockCaches = {
      keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
      delete: vi.fn().mockResolvedValue(true),
      open: vi.fn().mockResolvedValue({
        match: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      }),
    };
    
    global.caches = mockCaches;
    
    const { result } = renderHook(() => usePWA());
    
    // Clear old caches
    await act(async () => {
      await result.current.clearOldCaches(['cache-v2']);
    });
    
    expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1');
  });

  it('handles push notification subscription', async () => {
    const mockPushManager = {
      subscribe: vi.fn().mockResolvedValue({
        endpoint: 'https://push.example.com/123',
        toJSON: () => ({ endpoint: 'https://push.example.com/123' }),
      }),
      getSubscription: vi.fn().mockResolvedValue(null),
    };
    
    const mockRegistration = {
      pushManager: mockPushManager,
    };
    
    mockServiceWorker.ready = Promise.resolve(mockRegistration);
    
    const { result } = renderHook(() => usePWA());
    
    await act(async () => {
      const subscription = await result.current.subscribeToPushNotifications();
      expect(subscription).toHaveProperty('endpoint');
    });
    
    expect(mockPushManager.subscribe).toHaveBeenCalled();
  });

  it('detects app visibility changes', () => {
    const onVisibilityChange = vi.fn();
    const { result } = renderHook(() => usePWA({ onVisibilityChange }));
    
    // Simulate page hidden
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    expect(result.current.isVisible).toBe(false);
    expect(onVisibilityChange).toHaveBeenCalledWith(false);
    
    // Simulate page visible
    act(() => {
      Object.defineProperty(document, 'hidden', { value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    expect(result.current.isVisible).toBe(true);
    expect(onVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => usePWA());
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
  });
});