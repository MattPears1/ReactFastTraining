import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewsletterForm from '../NewsletterForm';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('NewsletterForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithQueryClient(<NewsletterForm />);
    
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm />);
    
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid email', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    renderWithQueryClient(<NewsletterForm onSuccess={onSuccess} />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/successfully subscribed/i)).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/subscribing/i);
  });

  it('disables input during submission', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    expect(emailInput).toBeDisabled();
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(emailInput).toHaveValue('');
    });
  });

  it('shows custom title and description', () => {
    renderWithQueryClient(
      <NewsletterForm
        title="Custom Newsletter"
        description="Custom description text"
      />
    );
    
    expect(screen.getByText('Custom Newsletter')).toBeInTheDocument();
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('applies different variants', () => {
    const { rerender } = renderWithQueryClient(
      <NewsletterForm variant="inline" />
    );
    
    let form = screen.getByTestId('newsletter-form');
    expect(form).toHaveClass('flex-row');
    
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <NewsletterForm variant="stacked" />
      </QueryClientProvider>
    );
    
    form = screen.getByTestId('newsletter-form');
    expect(form).toHaveClass('flex-col');
  });

  it('shows privacy policy link when provided', () => {
    renderWithQueryClient(
      <NewsletterForm privacyPolicyUrl="/privacy" />
    );
    
    const privacyLink = screen.getByText(/privacy policy/i);
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('handles API error gracefully', async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    
    // Mock API error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    
    renderWithQueryClient(<NewsletterForm onError={onError} />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to subscribe/i)).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();
    });
  });

  it('validates email format correctly', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    // Test various email formats
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user@.com',
      'user@example',
    ];
    
    for (const email of invalidEmails) {
      await user.clear(emailInput);
      await user.type(emailInput, email);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    }
    
    // Test valid email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
    });
  });

  it('prevents duplicate submissions', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    await user.type(emailInput, 'test@example.com');
    
    // Try to click multiple times rapidly
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);
    
    // Should only submit once
    expect(submitButton).toBeDisabled();
  });

  it('shows GDPR consent checkbox when required', () => {
    renderWithQueryClient(<NewsletterForm requireConsent />);
    
    const consentCheckbox = screen.getByRole('checkbox', {
      name: /i agree to receive/i,
    });
    expect(consentCheckbox).toBeInTheDocument();
  });

  it('requires consent when GDPR checkbox is shown', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm requireConsent />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /subscribe/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/you must agree to receive/i)).toBeInTheDocument();
    });
    
    const consentCheckbox = screen.getByRole('checkbox');
    await user.click(consentCheckbox);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/you must agree to receive/i)).not.toBeInTheDocument();
    });
  });

  it('supports custom submit button text', () => {
    renderWithQueryClient(
      <NewsletterForm submitButtonText="Join Now" />
    );
    
    expect(screen.getByRole('button', { name: 'Join Now' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderWithQueryClient(
      <NewsletterForm className="custom-newsletter" />
    );
    
    const container = screen.getByTestId('newsletter-container');
    expect(container).toHaveClass('custom-newsletter');
  });

  it('handles Enter key submission', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NewsletterForm />);
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByText(/successfully subscribed/i)).toBeInTheDocument();
    });
  });
});