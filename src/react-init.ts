// React initialization to ensure it's available before other modules
import React from 'react';
import ReactDOM from 'react-dom/client';

// Make React available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  console.log('[React Init] React loaded and made available globally:', React.version);
}

export { React, ReactDOM };