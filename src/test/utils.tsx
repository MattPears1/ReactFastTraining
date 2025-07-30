import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";

// Create a custom render function that includes all providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialRoute?: string;
  queryClient?: QueryClient;
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

export const customRender = (
  ui: React.ReactElement,
  {
    initialRoute = "/",
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {},
) => {
  window.history.pushState({}, "Test page", initialRoute);

  const AllProviders: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: "1",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: "1",
  name: "Test Product",
  description: "Test Description",
  price: 99.99,
  image: "/test-image.jpg",
  category: "test",
  ...overrides,
});

export const createMockFormData = (data: Record<string, any>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
};

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers({
    "content-type": "application/json",
  }),
});

// Accessibility testing utilities
export const checkA11y = async (container: HTMLElement) => {
  const axe = await import("axe-core");
  const results = await axe.run(container);
  return results.violations;
};

// Animation testing utilities
export const mockAnimations = () => {
  Element.prototype.animate = jest.fn().mockReturnValue({
    finished: Promise.resolve(),
    cancel: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    reverse: jest.fn(),
  });
};

// Local storage mock utilities
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    },
  };
};
