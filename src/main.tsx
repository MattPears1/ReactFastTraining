// Log app initialization with detailed environment info
console.log('🚀 [APP] React Fast Training app initializing...', {
  timestamp: new Date().toISOString(),
  env: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL || 'not set',
  baseUrl: import.meta.env.BASE_URL || '/',
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  ssr: import.meta.env.SSR,
  userAgent: navigator.userAgent,
  location: window.location.href,
  protocol: window.location.protocol,
  host: window.location.host
});

// Log global error handler
window.addEventListener('error', (event) => {
  console.error('❌ [GLOBAL ERROR]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack,
    timestamp: new Date().toISOString()
  });
});

// Log unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ [UNHANDLED PROMISE REJECTION]', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  });
});

console.log('📦 [IMPORT] Starting module imports...');

// Import React through our init module to ensure proper loading order
import { React, ReactDOM } from "./react-init";
console.log('✅ [IMPORT] React and ReactDOM imported');

import { BrowserRouter } from "react-router-dom";
console.log('✅ [IMPORT] React Router imported');

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
console.log('✅ [IMPORT] React Query imported');

import { HelmetProvider } from "react-helmet-async";
console.log('✅ [IMPORT] Helmet Provider imported');

import App from "./App";
console.log('✅ [IMPORT] App component imported');

import "./styles/index.css";
console.log('✅ [IMPORT] Index CSS imported');

import "./styles/theme.css";
console.log('✅ [IMPORT] Theme CSS imported');

import { initSentry } from "./config/sentry-safe";
console.log('✅ [IMPORT] Sentry config imported');

// Ensure React is available globally
if (typeof window !== 'undefined' && !(window as any).React) {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  console.log('✅ [SETUP] React added to window object');
}

console.log('📊 [VERSION] React version:', React.version);
console.log('📊 [VERSION] ReactDOM version:', ReactDOM.version);

// Initialize Sentry before rendering the app
console.log('🔧 [SENTRY] Initializing Sentry...');
try {
  initSentry();
  console.log('✅ [SENTRY] Sentry initialized successfully');
} catch (error) {
  console.error('❌ [SENTRY] Failed to initialize Sentry:', error);
}

console.log('🔄 [QUERY] Creating QueryClient...');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // No caching - always fresh
      cacheTime: 0, // No cache storage
      refetchOnWindowFocus: true, // Always refetch on focus
      refetchOnReconnect: "always",
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes("4")) {
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

console.log('✅ [QUERY] QueryClient created with options:', {
  staleTime: '0 (no caching)',
  cacheTime: '0 (no cache storage)',
  refetchOnWindowFocus: true,
  refetchOnReconnect: 'always'
});

console.log('🔍 [DOM] Looking for root element...');
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('❌ [DOM] Root element not found!', {
    bodyHTML: document.body.innerHTML,
    documentReadyState: document.readyState,
    timestamp: new Date().toISOString()
  });
  document.body.innerHTML =
    '<div style="color: red; padding: 20px;">Error: Root element not found!</div>';
} else {
  console.log('✅ [DOM] Root element found:', {
    id: rootElement.id,
    className: rootElement.className,
    parentElement: rootElement.parentElement?.tagName,
    timestamp: new Date().toISOString()
  });

  try {
    console.log('⚛️ [REACT] Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('✅ [REACT] React root created successfully');
    
    console.log('🎨 [RENDER] Starting app render...');
    console.group('📱 [RENDER] Component tree');
    console.log('└─ React.StrictMode');
    console.log('   └─ HelmetProvider');
    console.log('      └─ QueryClientProvider');
    console.log('         └─ BrowserRouter');
    console.log('            └─ App');
    console.groupEnd();

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
      </React.StrictMode>,
    );
    
    console.log('✅ [RENDER] React app rendered successfully', {
      timestamp: new Date().toISOString(),
      performanceNow: performance.now()
    });
  } catch (error) {
    console.error('❌ [RENDER] Critical error rendering app:', {
      error: error,
      message: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    });
    
    // Also log to window for easier debugging
    (window as any).__REACT_ERROR__ = error;
    
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">
      <h1>Error rendering app</h1>
      <p>${error}</p>
      <pre>${(error as Error).stack}</pre>
      <p>Check browser console for more details</p>
    </div>`;
  }
}

// Log when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ [DOM] DOMContentLoaded event fired', {
      timestamp: new Date().toISOString(),
      readyState: document.readyState
    });
  });
}

// Log page visibility changes
document.addEventListener('visibilitychange', () => {
  console.log('👁️ [VISIBILITY] Page visibility changed:', {
    hidden: document.hidden,
    visibilityState: document.visibilityState,
    timestamp: new Date().toISOString()
  });
});
