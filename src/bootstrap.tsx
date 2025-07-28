// Bootstrap file to ensure proper initialization order
console.log('🚀 [BOOTSTRAP] Bootstrap module starting...', {
  timestamp: new Date().toISOString()
});

console.log('📦 [BOOTSTRAP] Loading react-init module...');
import './react-init';

console.log('📦 [BOOTSTRAP] Loading axios-init module...');
import './admin/services/axios-init';

// Import React and ReactDOM first
console.log('📦 [BOOTSTRAP] Importing React core modules...');
import React from 'react';
import ReactDOM from 'react-dom/client';
console.log('✅ [BOOTSTRAP] React core modules imported');

// Then import other dependencies
console.log('📦 [BOOTSTRAP] Importing routing and state management...');
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
console.log('✅ [BOOTSTRAP] Dependencies imported successfully');

// Import styles
console.log('🎨 [BOOTSTRAP] Loading stylesheets...');
import './styles/index.css';
import './styles/theme.css';
console.log('✅ [BOOTSTRAP] Styles loaded');

// Ensure axios is available for admin services
import axios from 'axios';
if (typeof window !== 'undefined') {
  (window as any).axios = axios;
  console.log('✅ [BOOTSTRAP] Axios made globally available');
}

// Import app and utilities
console.log('📦 [BOOTSTRAP] Importing App component...');
import App from './App';
console.log('✅ [BOOTSTRAP] App component imported');

console.log('📦 [BOOTSTRAP] Importing Sentry config...');
import { initSentry } from './config/sentry-safe';
console.log('✅ [BOOTSTRAP] All imports complete');

// Initialize Sentry
console.log('🔧 [BOOTSTRAP] Initializing Sentry...');
try {
  initSentry();
  console.log('✅ [BOOTSTRAP] Sentry initialized');
} catch (error) {
  console.error('❌ [BOOTSTRAP] Sentry initialization failed:', error);
}

// Create QueryClient
console.log('🔄 [BOOTSTRAP] Creating QueryClient...');
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

console.log('✅ [BOOTSTRAP] QueryClient created');

// Bootstrap function
export function bootstrap() {
  console.log('🎯 [BOOTSTRAP] Bootstrap function called', {
    timestamp: new Date().toISOString(),
    documentReadyState: document.readyState
  });
  
  const rootElement = document.getElementById('root');
  console.log('🔍 [BOOTSTRAP] Looking for root element...');
  
  if (!rootElement) {
    console.error('❌ [BOOTSTRAP] Root element not found!', {
      bodyHTML: document.body.innerHTML.substring(0, 200),
      timestamp: new Date().toISOString()
    });
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found!</div>';
    return;
  }
  
  console.log('✅ [BOOTSTRAP] Root element found', {
    id: rootElement.id,
    className: rootElement.className,
    timestamp: new Date().toISOString()
  });

  try {
    console.log('⚛️ [BOOTSTRAP] Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('✅ [BOOTSTRAP] React root created');
    
    console.log('🎨 [BOOTSTRAP] Starting React render...');
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
    
    console.log('✅ [BOOTSTRAP] React render initiated successfully', {
      timestamp: new Date().toISOString(),
      performanceNow: performance.now()
    });
    
    // Log successful bootstrap completion
    (window as any).__BOOTSTRAP_SUCCESS__ = {
      timestamp: new Date().toISOString(),
      reactVersion: React.version
    };
  } catch (error) {
    console.error('❌ [BOOTSTRAP] Critical error during app render:', {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Store error globally
    (window as any).__RENDER_ERROR__ = error;
    
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: red;">Application Error</h1>
          <p>Failed to initialize the application.</p>
          <p style="color: #666;">Check the browser console for detailed error information.</p>
          <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
          </pre>
          <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    }
  }
}