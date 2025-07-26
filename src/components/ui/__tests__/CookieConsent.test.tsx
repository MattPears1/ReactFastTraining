import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsent from '../CookieConsent';

describe('CookieConsent Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows consent banner on first visit', () => {
    render(<CookieConsent />);
    
    expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /customize/i })).toBeInTheDocument();
  });

  it('does not show banner if consent already given', () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    }));
    
    render(<CookieConsent />);
    
    expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
  });

  it('accepts all cookies when accept all is clicked', async () => {
    const onAccept = vi.fn();
    render(<CookieConsent onAccept={onAccept} />);
    
    const acceptButton = screen.getByRole('button', { name: /accept all/i });
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      expect(onAccept).toHaveBeenCalledWith({
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
      });
      
      const consent = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
      expect(consent.necessary).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(true);
      expect(consent.functional).toBe(true);
    });
  });

  it('rejects optional cookies when reject all is clicked', async () => {
    const onReject = vi.fn();
    render(<CookieConsent onReject={onReject} />);
    
    const rejectButton = screen.getByRole('button', { name: /reject all/i });
    fireEvent.click(rejectButton);
    
    await waitFor(() => {
      expect(onReject).toHaveBeenCalled();
      
      const consent = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
      expect(consent.necessary).toBe(true); // Necessary cookies always enabled
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
      expect(consent.functional).toBe(false);
    });
  });

  it('shows customization modal when customize is clicked', async () => {
    render(<CookieConsent />);
    
    const customizeButton = screen.getByRole('button', { name: /customize/i });
    fireEvent.click(customizeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/cookie preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/necessary cookies/i)).toBeInTheDocument();
      expect(screen.getByText(/analytics cookies/i)).toBeInTheDocument();
      expect(screen.getByText(/marketing cookies/i)).toBeInTheDocument();
      expect(screen.getByText(/functional cookies/i)).toBeInTheDocument();
    });
  });

  it('saves custom preferences', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<CookieConsent onUpdate={onUpdate} />);
    
    // Open customization modal
    const customizeButton = screen.getByRole('button', { name: /customize/i });
    await user.click(customizeButton);
    
    // Toggle analytics off, keep marketing on
    const analyticsToggle = screen.getByLabelText(/analytics cookies/i);
    const marketingToggle = screen.getByLabelText(/marketing cookies/i);
    
    await user.click(analyticsToggle); // Turn off
    // Marketing is off by default, turn it on
    await user.click(marketingToggle);
    
    // Save preferences
    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        necessary: true,
        analytics: false,
        marketing: true,
        functional: false,
      });
      
      const consent = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(true);
    });
  });

  it('disables necessary cookies toggle', async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);
    
    const customizeButton = screen.getByRole('button', { name: /customize/i });
    await user.click(customizeButton);
    
    const necessaryToggle = screen.getByLabelText(/necessary cookies/i);
    expect(necessaryToggle).toBeDisabled();
    expect(necessaryToggle).toBeChecked();
  });

  it('hides banner after accepting', async () => {
    render(<CookieConsent />);
    
    const acceptButton = screen.getByRole('button', { name: /accept all/i });
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
    });
  });

  it('shows privacy policy link when provided', () => {
    render(<CookieConsent privacyPolicyUrl="/privacy" />);
    
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('shows cookie policy link when provided', () => {
    render(<CookieConsent cookiePolicyUrl="/cookies" />);
    
    const cookieLink = screen.getByRole('link', { name: /cookie policy/i });
    expect(cookieLink).toBeInTheDocument();
    expect(cookieLink).toHaveAttribute('href', '/cookies');
  });

  it('applies custom position', () => {
    const { rerender } = render(<CookieConsent position="top" />);
    let banner = screen.getByTestId('cookie-consent-banner');
    expect(banner).toHaveClass('top-0');
    
    rerender(<CookieConsent position="bottom" />);
    banner = screen.getByTestId('cookie-consent-banner');
    expect(banner).toHaveClass('bottom-0');
  });

  it('expires consent after specified days', () => {
    const onExpire = vi.fn();
    const expiredConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now() - 91 * 24 * 60 * 60 * 1000, // 91 days ago
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(expiredConsent));
    
    render(<CookieConsent expiryDays={90} onExpire={onExpire} />);
    
    // Should show banner again as consent expired
    expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
    expect(onExpire).toHaveBeenCalled();
  });

  it('supports custom cookie categories', () => {
    const customCategories = {
      necessary: { name: 'Essential', description: 'Required cookies' },
      performance: { name: 'Performance', description: 'Performance cookies' },
      advertising: { name: 'Advertising', description: 'Ad cookies' },
    };
    
    render(<CookieConsent categories={customCategories} />);
    
    const customizeButton = screen.getByRole('button', { name: /customize/i });
    fireEvent.click(customizeButton);
    
    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Advertising')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);
    
    // Tab through buttons
    await user.tab();
    expect(screen.getByRole('button', { name: /accept all/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('button', { name: /reject all/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('button', { name: /customize/i })).toHaveFocus();
    
    // Press Enter to activate
    await user.keyboard('{Enter}');
    
    // Should open customization modal
    expect(screen.getByText(/cookie preferences/i)).toBeInTheDocument();
  });

  it('blocks cookies until consent is given', () => {
    const mockGtag = vi.fn();
    window.gtag = mockGtag;
    
    render(<CookieConsent />);
    
    // Analytics should not be initialized
    expect(mockGtag).not.toHaveBeenCalled();
    
    // Accept cookies
    const acceptButton = screen.getByRole('button', { name: /accept all/i });
    fireEvent.click(acceptButton);
    
    // Now analytics can be initialized
    // In real implementation, this would trigger analytics initialization
  });

  it('shows banner again when revoke consent is called', async () => {
    // First accept cookies
    render(<CookieConsent />);
    const acceptButton = screen.getByRole('button', { name: /accept all/i });
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
    });
    
    // Simulate calling revoke consent (usually from a settings page)
    localStorage.removeItem('cookieConsent');
    window.dispatchEvent(new Event('storage'));
    
    await waitFor(() => {
      expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
    });
  });

  it('applies theme variant', () => {
    const { rerender } = render(<CookieConsent theme="light" />);
    let banner = screen.getByTestId('cookie-consent-banner');
    expect(banner).toHaveClass('bg-white', 'text-gray-900');
    
    rerender(<CookieConsent theme="dark" />);
    banner = screen.getByTestId('cookie-consent-banner');
    expect(banner).toHaveClass('bg-gray-900', 'text-white');
  });

  it('supports compact mode', () => {
    render(<CookieConsent compact />);
    
    const banner = screen.getByTestId('cookie-consent-banner');
    expect(banner).toHaveClass('py-2'); // Smaller padding in compact mode
    
    // Should not show customize button in compact mode
    expect(screen.queryByRole('button', { name: /customize/i })).not.toBeInTheDocument();
  });
});