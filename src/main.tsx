console.log("[main.tsx] Starting application...");

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./styles/index.css";
import "./styles/theme.css";
import { initSentry } from "./config/sentry-safe";

console.log("[main.tsx] Imports completed. React version:", React.version);

// Initialize Sentry before rendering the app
initSentry();

console.log("[main.tsx] Creating QueryClient...");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes cache
      refetchOnWindowFocus: false,
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

console.log("[main.tsx] QueryClient created. Looking for root element...");

const rootElement = document.getElementById("root");
console.log("[main.tsx] Root element:", rootElement);

if (!rootElement) {
  console.error("[main.tsx] Root element not found!");
  document.body.innerHTML =
    '<div style="color: red; padding: 20px;">Error: Root element not found!</div>';
} else {
  try {
    console.log("[main.tsx] Creating React root...");
    const root = ReactDOM.createRoot(rootElement);
    console.log("[main.tsx] React root created. Rendering app...");
    
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
    console.log("[main.tsx] React app rendered successfully");
  } catch (error) {
    console.error("[main.tsx] Error rendering app:", error);
    console.error("[main.tsx] Error stack:", (error as Error).stack);
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">Error rendering app: ${error}<br><pre>${(error as Error).stack}</pre></div>`;
  }
}
