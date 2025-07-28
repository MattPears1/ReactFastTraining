// Bootstrap file to ensure proper initialization order
import './react-init';
import './admin/services/axios-init';

// Import React and ReactDOM first
import React from 'react';
import ReactDOM from 'react-dom/client';

// Then import other dependencies
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

// Import styles
import './styles/index.css';
import './styles/theme.css';

// Ensure axios is available for admin services
import axios from 'axios';
if (typeof window !== 'undefined') {
  (window as any).axios = axios;
}

// Import app and utilities
import App from './App';
import { initSentry } from './config/sentry-safe';

console.log('[Bootstrap] Starting React application...');

// Initialize Sentry
initSentry();

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Bootstrap function
export function bootstrap() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('[Bootstrap] Root element not found!');
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found!</div>';
    return;
  }

  try {
    console.log('[Bootstrap] Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('[Bootstrap] Rendering app...');
    root.render(
      <React.StrictMode>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <App />
            </BrowserRouter>
          </QueryClientProvider>
        </HelmetProvider>
      </React.StrictMode>
    );
    
    console.log('[Bootstrap] App rendered successfully');
  } catch (error) {
    console.error('[Bootstrap] Error rendering app:', error);
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: red;">Application Error</h1>
          <p>Failed to initialize the application.</p>
          <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
          </pre>
          <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">
            Reload Page
          </button>
        </div>
      `;
    }
  }
}