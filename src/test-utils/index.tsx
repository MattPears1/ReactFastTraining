import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@contexts/AuthContext';
import { ToastProvider } from '@contexts/ToastContext';

// Mock data generators
export const mockUser = (overrides = {}) => ({
  id: 'usr_test123456789',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const mockSession = (overrides = {}) => ({
  id: 'sess_test123456789',
  courseId: 'course_123',
  courseName: 'Emergency First Aid at Work',
  startDate: new Date().toISOString(),
  startTime: '09:00',
  endTime: '17:00',
  location: 'Location A',
  maxParticipants: 12,
  currentParticipants: 5,
  availableSpots: 7,
  price: 75,
  status: 'SCHEDULED',
  ...overrides,
});

export const mockBooking = (overrides = {}) => ({
  id: 'book_test123456789',
  sessionId: 'sess_test123456789',
  userId: 'usr_test123456789',
  participantCount: 1,
  totalAmount: 75,
  status: 'CONFIRMED',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  authState?: {
    isAuthenticated?: boolean;
    user?: any;
    token?: string;
  };
}

const AllTheProviders = ({ 
  children,
  authState = { isAuthenticated: false },
}: { 
  children: ReactNode;
  authState?: CustomRenderOptions['authState'];
}) => {
  return (
    <BrowserRouter>
      <AuthProvider initialState={authState}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const { initialRoute = '/', authState, ...renderOptions } = options || {};

  // Set initial route
  window.history.pushState({}, 'Test page', initialRoute);

  const user = userEvent.setup();
  
  const renderResult = render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders authState={authState}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });

  return {
    ...renderResult,
    user,
  };
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };

// Test utilities
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(
    () => {
      const loadingElements = document.querySelectorAll('[role="status"]');
      expect(loadingElements.length).toBe(0);
    },
    { timeout: 3000 }
  );
};

export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument();
};

// API mocking utilities
interface MockApiOptions {
  delay?: number;
  error?: boolean;
  errorMessage?: string;
  statusCode?: number;
}

export const createMockApiHandler = <T>(
  data: T,
  options: MockApiOptions = {}
) => {
  const { delay = 0, error = false, errorMessage = 'Error', statusCode = 200 } = options;

  return async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (error) {
      throw new Error(errorMessage);
    }

    return {
      ok: statusCode >= 200 && statusCode < 300,
      status: statusCode,
      json: async () => data,
    };
  };
};

// Form testing utilities
export const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  formData: Record<string, string | boolean>
) => {
  for (const [name, value] of Object.entries(formData)) {
    const element = document.querySelector(`[name="${name}"]`);
    
    if (!element) {
      throw new Error(`Form field with name "${name}" not found`);
    }

    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        if (value !== element.checked) {
          await user.click(element);
        }
      } else {
        await user.clear(element);
        if (typeof value === 'string') {
          await user.type(element, value);
        }
      }
    } else if (element instanceof HTMLTextAreaElement) {
      await user.clear(element);
      if (typeof value === 'string') {
        await user.type(element, value);
      }
    } else if (element instanceof HTMLSelectElement && typeof value === 'string') {
      await user.selectOptions(element, value);
    }
  }
};

// Accessibility testing utilities
export const checkA11y = async (container: HTMLElement) => {
  // Check for missing alt text
  const imagesWithoutAlt = container.querySelectorAll('img:not([alt])');
  expect(imagesWithoutAlt.length).toBe(0);

  // Check for form labels
  const inputsWithoutLabels = container.querySelectorAll(
    'input:not([aria-label]):not([aria-labelledby]):not([type="hidden"]):not([type="submit"])'
  );
  inputsWithoutLabels.forEach(input => {
    const label = container.querySelector(`label[for="${input.id}"]`);
    expect(label).toBeInTheDocument();
  });

  // Check for button text
  const buttonsWithoutText = container.querySelectorAll('button:empty');
  buttonsWithoutText.forEach(button => {
    expect(button.getAttribute('aria-label')).toBeTruthy();
  });

  // Check for heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    expect(level - lastLevel).toBeLessThanOrEqual(1);
    lastLevel = level;
  });
};

// Performance testing utilities
export const measureRenderTime = async (
  component: ReactElement
): Promise<number> => {
  const start = performance.now();
  render(component);
  await waitForLoadingToFinish();
  const end = performance.now();
  return end - start;
};

// Snapshot testing utilities
export const createSnapshotTest = (
  component: ReactElement,
  name: string
) => {
  it(`should match snapshot: ${name}`, () => {
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
};

// Error boundary testing
export class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>Test Error Boundary</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const renderWithErrorBoundary = (ui: ReactElement) => {
  return render(<ErrorBoundary>{ui}</ErrorBoundary>);
};