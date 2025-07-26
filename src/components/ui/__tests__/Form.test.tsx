import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Form from '../Form';

// Test schema
const testSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, 'You must accept terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Test component wrapper
const TestForm = ({ onSubmit = vi.fn() }) => {
  const form = useForm({
    resolver: zodResolver(testSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  return (
    <Form form={form} onSubmit={onSubmit}>
      <Form.Field name="email" label="Email" type="email" required />
      <Form.Field name="password" label="Password" type="password" required />
      <Form.Field name="confirmPassword" label="Confirm Password" type="password" required />
      <Form.Field name="terms" label="Accept terms" type="checkbox" />
      <button type="submit">Submit</button>
    </Form>
  );
};

describe('Form Component', () => {
  it('renders form fields correctly', () => {
    render(<TestForm />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('shows validation errors on invalid submit', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('You must accept terms')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    
    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
    
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@email.com');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
    });
  });

  it('validates password matching', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<TestForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByLabelText('Accept terms'));
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        terms: true,
      });
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<TestForm onSubmit={handleSubmit} />);
    
    // Fill valid data
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByLabelText('Accept terms'));
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Submitting...');
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent('Submit');
    });
  });

  it('disables form fields during submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<TestForm onSubmit={handleSubmit} />);
    
    // Fill valid data
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByLabelText('Accept terms'));
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByLabelText('Confirm Password')).toBeDisabled();
    expect(screen.getByLabelText('Accept terms')).toBeDisabled();
  });

  it('clears errors when field values change', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    
    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'invalid');
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
    
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@email.com');
    
    await waitFor(() => {
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
    });
  });

  it('supports custom field components', () => {
    const CustomForm = () => {
      const form = useForm();
      
      return (
        <Form form={form} onSubmit={vi.fn()}>
          <Form.Field
            name="custom"
            label="Custom Field"
            render={({ field }) => (
              <input {...field} data-testid="custom-input" />
            )}
          />
        </Form>
      );
    };
    
    render(<CustomForm />);
    expect(screen.getByTestId('custom-input')).toBeInTheDocument();
  });

  it('handles field descriptions', () => {
    const FormWithDescriptions = () => {
      const form = useForm();
      
      return (
        <Form form={form} onSubmit={vi.fn()}>
          <Form.Field
            name="field"
            label="Field Label"
            description="This is a helpful description"
          />
        </Form>
      );
    };
    
    render(<FormWithDescriptions />);
    expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
  });
});