// React initialization to ensure it's available before other modules
console.log('⚛️ [REACT-INIT] Starting React initialization...', {
  timestamp: new Date().toISOString()
});

import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('⚛️ [REACT-INIT] React modules imported successfully');

// Make React available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  
  console.log('⚛️ [REACT-INIT] React initialization complete:', {
    reactVersion: React.version,
    reactDOMVersion: ReactDOM.version,
    globallyAvailable: true,
    timestamp: new Date().toISOString()
  });
  
  // Also log to a global variable for easy access
  (window as any).__REACT_INIT_STATUS__ = {
    initialized: true,
    reactVersion: React.version,
    timestamp: new Date().toISOString()
  };
} else {
  console.warn('⚠️ [REACT-INIT] Window not available, React not set globally');
}

export { React, ReactDOM };