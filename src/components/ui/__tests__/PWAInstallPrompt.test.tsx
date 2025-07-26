import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PWAInstallPrompt from '../PWAInstallPrompt';

// Mock the beforeinstallprompt event
class BeforeInstallPromptEvent extends Event {
  prompt = vi.fn();
  userChoice = Promise.resolve({ outcome: 'accepted' });
  
  constructor() {
    super('beforeinstallprompt');
  }
  
  preventDefault() {
    super.preventDefault();
  }
}

describe('PWAInstallPrompt Component', () => {
  let mockDeferredPrompt: BeforeInstallPromptEvent;

  beforeEach(() => {
    mockDeferredPrompt = new BeforeInstallPromptEvent();
    localStorage.clear();
    
    // Mock window.matchMedia for standalone detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)' ? false : true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not show prompt if app is already installed', () => {
    // Mock app as already installed
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    render(<PWAInstallPrompt />);
    
    expect(screen.queryByText(/install app/i)).not.toBeInTheDocument();
  });

  it('shows prompt when beforeinstallprompt event is fired', async () => {
    render(<PWAInstallPrompt />);
    
    // Initially prompt should not be visible
    expect(screen.queryByText(/install.*app/i)).not.toBeInTheDocument();
    
    // Fire the beforeinstallprompt event
    window.dispatchEvent(mockDeferredPrompt);
    
    await waitFor(() => {
      expect(screen.getByText(/install.*app/i)).toBeInTheDocument();
    });
  });

  it('handles install button click', async () => {
    render(<PWAInstallPrompt />);
    
    // Fire the beforeinstallprompt event
    window.dispatchEvent(mockDeferredPrompt);
    
    await waitFor(() => {
      expect(screen.getByText(/install.*app/i)).toBeInTheDocument();
    });
    
    const installButton = screen.getByRole('button', { name: /install/i });
    fireEvent.click(installButton);
    
    // Should call prompt method
    expect(mockDeferredPrompt.prompt).toHaveBeenCalled();
    
    // Should hide prompt after installation
    await waitFor(() => {
      expect(screen.queryByText(/install.*app/i)).not.toBeInTheDocument();
    });
  });

  it('handles dismiss button click', async () => {
    const onDismiss = vi.fn();
    render(<PWAInstallPrompt onDismiss={onDismiss} />);
    
    window.dispatchEvent(mockDeferredPrompt);
    
    await waitFor(() => {
      expect(screen.getByText(/install.*app/i)).toBeInTheDocument();
    });
    
    const dismissButton = screen.getByRole('button', { name: /not now|dismiss|close/i });
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.queryByText(/install.*app/i)).not.toBeInTheDocument();
  });

  it('remembers dismissal based on dismissCount', async () => {
    render(<PWAInstallPrompt dismissCount={2} />);
    
    // First dismissal
    window.dispatchEvent(mockDeferredPrompt);
    await waitFor(() => screen.getByText(/install.*app/i));
    fireEvent.click(screen.getByRole('button', { name: /not now|dismiss|close/i }));
    
    // Should show again
    window.dispatchEvent(new BeforeInstallPromptEvent());
    await waitFor(() => screen.getByText(/install.*app/i));
    fireEvent.click(screen.getByRole('button', { name: /not now|dismiss|close/i }));
    
    // Should not show after 2 dismissals
    window.dispatchEvent(new BeforeInstallPromptEvent());
    expect(screen.queryByText(/install.*app/i)).not.toBeInTheDocument();
  });

  it('shows after delay if specified', async () => {
    vi.useFakeTimers();
    render(<PWAInstallPrompt showAfterDelay={2000} />);
    
    window.dispatchEvent(mockDeferredPrompt);
    
    // Should not show immediately
    expect(screen.queryByText(/install.*app/i)).not.toBeInTheDocument();
    
    // Fast forward time
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(screen.getByText(/install.*app/i)).toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('handles installation success', async () => {
    const onInstall = vi.fn();
    mockDeferredPrompt.userChoice = Promise.resolve({ outcome: 'accepted' });
    
    render(<PWAInstallPrompt onInstall={onInstall} />);
    
    window.dispatchEvent(mockDeferredPrompt);
    await waitFor(() => screen.getByText(/install.*app/i));
    
    const installButton = screen.getByRole('button', { name: /install/i });
    fireEvent.click(installButton);
    
    await waitFor(() => {
      expect(onInstall).toHaveBeenCalledWith('accepted');
      expect(localStorage.getItem('pwa-installed')).toBe('true');
    });
  });

  it('handles installation rejection', async () => {
    const onInstall = vi.fn();
    mockDeferredPrompt.userChoice = Promise.resolve({ outcome: 'dismissed' });
    
    render(<PWAInstallPrompt onInstall={onInstall} />);
    
    window.dispatchEvent(mockDeferredPrompt);
    await waitFor(() => screen.getByText(/install.*app/i));
    
    const installButton = screen.getByRole('button', { name: /install/i });
    fireEvent.click(installButton);
    
    await waitFor(() => {
      expect(onInstall).toHaveBeenCalledWith('dismissed');
      expect(localStorage.getItem('pwa-installed')).not.toBe('true');
    });
  });

  it('shows custom content', () => {
    render(
      <PWAInstallPrompt
        title="Get Our App"
        description="Install for a better experience"
        installButtonText="Get App"
        dismissButtonText="Maybe Later"
      />
    );
    
    window.dispatchEvent(mockDeferredPrompt);
    
    expect(screen.getByText('Get Our App')).toBeInTheDocument();
    expect(screen.getByText('Install for a better experience')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get App' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maybe Later' })).toBeInTheDocument();
  });

  it('applies different positions', () => {
    const { rerender } = render(<PWAInstallPrompt position="top" />);
    window.dispatchEvent(mockDeferredPrompt);
    
    let prompt = screen.getByTestId('pwa-install-prompt');
    expect(prompt).toHaveClass('top-4');
    
    rerender(<PWAInstallPrompt position="bottom" />);
    window.dispatchEvent(new BeforeInstallPromptEvent());
    
    prompt = screen.getByTestId('pwa-install-prompt');
    expect(prompt).toHaveClass('bottom-4');
  });

  it('shows platform-specific content', () => {
    // Mock iOS Safari
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    
    render(<PWAInstallPrompt showForIOS />);
    
    // Should show iOS-specific instructions
    expect(screen.getByText(/tap.*share.*add to home screen/i)).toBeInTheDocument();
  });

  it('auto-hides after timeout', async () => {
    vi.useFakeTimers();
    render(<PWAInstallPrompt autoHideAfter={5000} />);
    
    window.dispatchEvent(mockDeferredPrompt);
    await waitFor(() => screen.getByText(/install.*app/i));
    
    // Fast forward time
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(screen.queryByText(/install.*app/i)).not.toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('shows icon when provided', () => {
    render(
      <PWAInstallPrompt
        icon="/app-icon.png"
        iconAlt="App Icon"
      />
    );
    
    window.dispatchEvent(mockDeferredPrompt);
    
    const icon = screen.getByAltText('App Icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/app-icon.png');
  });

  it('tracks analytics events', async () => {
    const onAnalytics = vi.fn();
    render(<PWAInstallPrompt onAnalytics={onAnalytics} />);
    
    window.dispatchEvent(mockDeferredPrompt);
    
    // Track prompt shown
    expect(onAnalytics).toHaveBeenCalledWith('pwa_prompt_shown');
    
    // Track install click
    const installButton = screen.getByRole('button', { name: /install/i });
    fireEvent.click(installButton);
    
    expect(onAnalytics).toHaveBeenCalledWith('pwa_install_clicked');
    
    // Track dismiss
    window.dispatchEvent(new BeforeInstallPromptEvent());
    await waitFor(() => screen.getByText(/install.*app/i));
    
    const dismissButton = screen.getByRole('button', { name: /not now|dismiss|close/i });
    fireEvent.click(dismissButton);
    
    expect(onAnalytics).toHaveBeenCalledWith('pwa_prompt_dismissed');
  });

  it('applies theme variants', () => {
    const { rerender } = render(<PWAInstallPrompt theme="light" />);
    window.dispatchEvent(mockDeferredPrompt);
    
    let prompt = screen.getByTestId('pwa-install-prompt');
    expect(prompt).toHaveClass('bg-white', 'text-gray-900');
    
    rerender(<PWAInstallPrompt theme="dark" />);
    window.dispatchEvent(new BeforeInstallPromptEvent());
    
    prompt = screen.getByTestId('pwa-install-prompt');
    expect(prompt).toHaveClass('bg-gray-900', 'text-white');
  });

  it('handles animation when showing/hiding', async () => {
    render(<PWAInstallPrompt animate />);
    
    window.dispatchEvent(mockDeferredPrompt);
    
    const prompt = screen.getByTestId('pwa-install-prompt');
    expect(prompt).toHaveClass('animate-slide-in');
    
    const dismissButton = screen.getByRole('button', { name: /not now|dismiss|close/i });
    fireEvent.click(dismissButton);
    
    expect(prompt).toHaveClass('animate-slide-out');
  });

  it('respects minimum visits before showing', () => {
    render(<PWAInstallPrompt minVisits={3} />);
    
    // First visit
    window.dispatchEvent(mockDeferredPrompt);
    expect(screen.queryByText(/install.*app/i)).not.toBeInTheDocument();
    
    // Simulate more visits
    const visits = parseInt(localStorage.getItem('pwa-visit-count') || '0');
    localStorage.setItem('pwa-visit-count', String(visits + 3));
    
    // Should show after minimum visits
    window.dispatchEvent(new BeforeInstallPromptEvent());
    expect(screen.getByText(/install.*app/i)).toBeInTheDocument();
  });
});