// React polyfill to ensure React is available globally before modules load
// This fixes the production issue where React is undefined

(function() {
  // Only run in production
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.log('[React Polyfill] Ensuring React is available globally...');
    
    // Create a promise that resolves when React is loaded
    window.__REACT_LOADED__ = new Promise((resolve) => {
      const checkReact = () => {
        if (window.React && window.ReactDOM) {
          console.log('[React Polyfill] React is now available');
          resolve();
        } else {
          setTimeout(checkReact, 10);
        }
      };
      checkReact();
    });
  }
})();