// Debug entry point to diagnose production issues
console.log("Debug main.tsx starting...");

// Check if React is available
try {
  console.log("Checking React import...");
  const React = (window as any).React || require('react');
  console.log("React loaded:", !!React);
  console.log("React version:", React?.version);
} catch (e) {
  console.error("Failed to load React:", e);
}

// Check if ReactDOM is available
try {
  console.log("Checking ReactDOM import...");
  const ReactDOM = (window as any).ReactDOM || require('react-dom/client');
  console.log("ReactDOM loaded:", !!ReactDOM);
} catch (e) {
  console.error("Failed to load ReactDOM:", e);
}

// Simple test app
try {
  import React from "react";
  import ReactDOM from "react-dom/client";

  console.log("Creating simple test app...");
  
  const TestApp = () => {
    return React.createElement('div', {
      style: {
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }
    }, [
      React.createElement('h1', { key: 'h1' }, 'React Fast Training - Debug Mode'),
      React.createElement('p', { key: 'p1' }, 'If you can see this, React is working!'),
      React.createElement('div', { 
        key: 'debug',
        style: { 
          backgroundColor: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '5px',
          marginTop: '20px'
        }
      }, [
        React.createElement('h2', { key: 'h2' }, 'Debug Information:'),
        React.createElement('pre', { key: 'pre' }, JSON.stringify({
          react: React.version,
          nodeEnv: process.env.NODE_ENV,
          apiUrl: import.meta.env.VITE_API_URL,
          production: import.meta.env.PROD,
          timestamp: new Date().toISOString()
        }, null, 2))
      ]),
      React.createElement('div', {
        key: 'links',
        style: { marginTop: '20px' }
      }, [
        React.createElement('h3', { key: 'h3' }, 'Test Links:'),
        React.createElement('ul', { key: 'ul' }, [
          React.createElement('li', { key: 'li1' }, 
            React.createElement('a', { href: '/' }, 'Main Site')
          ),
          React.createElement('li', { key: 'li2' }, 
            React.createElement('a', { href: '/admin/login' }, 'Admin Login')
          ),
          React.createElement('li', { key: 'li3' }, 
            React.createElement('a', { href: '/admin-test-direct' }, 'Admin Test Direct')
          )
        ])
      ])
    ]);
  };

  const rootElement = document.getElementById("root");
  if (rootElement) {
    console.log("Root element found, rendering test app...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(TestApp));
    console.log("Test app rendered successfully!");
  } else {
    console.error("Root element not found!");
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Root element not found!</div>';
  }
} catch (error) {
  console.error("Error in debug app:", error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: red;">Error Loading Application</h1>
        <p>An error occurred while loading the application:</p>
        <pre style="background: #f0f0f0; padding: 10px; border-radius: 5px;">
${error}
        </pre>
        <p>Please check the browser console for more details.</p>
      </div>
    `;
  }
}

export {};