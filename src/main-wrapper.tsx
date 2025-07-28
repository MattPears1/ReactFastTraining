// Main wrapper to ensure proper initialization
console.log('🎬 [MAIN-WRAPPER] Starting application load sequence...', {
  timestamp: new Date().toISOString(),
  documentReadyState: document.readyState,
  location: window.location.href
});

// Log browser information for debugging
console.log('🌐 [MAIN-WRAPPER] Browser environment:', {
  userAgent: navigator.userAgent,
  language: navigator.language,
  cookieEnabled: navigator.cookieEnabled,
  onLine: navigator.onLine,
  timestamp: new Date().toISOString()
});

// Use dynamic import to ensure proper loading order
console.log('📦 [MAIN-WRAPPER] Initiating bootstrap module import...');
const importStart = performance.now();

import('./bootstrap').then(({ bootstrap }) => {
  const importEnd = performance.now();
  console.log('✅ [MAIN-WRAPPER] Bootstrap module loaded successfully', {
    loadTime: `${(importEnd - importStart).toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  });
  
  console.log('🚀 [MAIN-WRAPPER] Starting React Fast Training app...');
  bootstrap();
}).catch(error => {
  console.error('❌ [MAIN-WRAPPER] Critical error loading bootstrap module:', {
    error: error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  // Store error globally for debugging
  (window as any).__BOOTSTRAP_ERROR__ = error;
  
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
      <h1 style="color: red;">Loading Error</h1>
      <p>Failed to load the application modules.</p>
      <p style="color: #666;">Check the browser console for detailed error information.</p>
      <pre style="background: #f0f0f0; padding: 10px; text-align: left; max-width: 800px; margin: 20px auto; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
      </pre>
      <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
});