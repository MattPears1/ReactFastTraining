// Main wrapper to ensure proper initialization
console.log('[Main Wrapper] Loading application...');

// Use dynamic import to ensure proper loading order
import('./bootstrap').then(({ bootstrap }) => {
  console.log('[Main Wrapper] Bootstrap loaded, starting app...');
  bootstrap();
}).catch(error => {
  console.error('[Main Wrapper] Failed to load bootstrap:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
      <h1 style="color: red;">Loading Error</h1>
      <p>Failed to load the application modules.</p>
      <pre style="background: #f0f0f0; padding: 10px; text-align: left; max-width: 800px; margin: 20px auto; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
      </pre>
      <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">
        Reload Page
      </button>
    </div>
  `;
});