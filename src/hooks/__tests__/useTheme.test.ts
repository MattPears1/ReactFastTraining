import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useTheme } from '@/contexts/ThemeContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('useTheme Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset document classes
    document.documentElement.className = '';
  });

  it('returns theme context values', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current).toHaveProperty('theme');
    expect(result.current).toHaveProperty('setTheme');
    expect(result.current).toHaveProperty('toggleTheme');
  });

  it('defaults to system theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.theme).toBe('system');
  });

  it('changes theme when setTheme is called', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles between light and dark themes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Set to light first
    act(() => {
      result.current.setTheme('light');
    });
    
    expect(result.current.theme).toBe('light');
    
    // Toggle to dark
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    // Toggle back to light
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('loads theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('respects system preference when theme is system', () => {
    // Mock matchMedia for dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('system');
    });
    
    // Should apply dark mode based on system preference
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('updates when system preference changes', () => {
    const listeners: { [key: string]: ((e: any) => void)[] } = {};
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (event: string, handler: (e: any) => void) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(handler);
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('system');
    });
    
    // Initially light
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    // Simulate system preference change
    act(() => {
      listeners['change']?.forEach(handler => 
        handler({ matches: true } as MediaQueryListEvent)
      );
    });
    
    // Should now be dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies theme-specific CSS variables', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-scheme')).toBe('dark');
  });

  it('provides theme variants', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.variants).toBeDefined();
    expect(result.current.variants.button).toBeDefined();
    expect(result.current.variants.card).toBeDefined();
  });

  it('handles invalid theme values gracefully', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      // @ts-ignore - Testing invalid input
      result.current.setTheme('invalid-theme');
    });
    
    // Should fallback to light
    expect(result.current.theme).toBe('light');
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.fn();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      })),
    });
    
    const { unmount } = renderHook(() => useTheme(), { wrapper });
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it('provides isDark and isLight helpers', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(result.current.isDark).toBe(true);
    expect(result.current.isLight).toBe(false);
    
    act(() => {
      result.current.setTheme('light');
    });
    
    expect(result.current.isDark).toBe(false);
    expect(result.current.isLight).toBe(true);
  });
});