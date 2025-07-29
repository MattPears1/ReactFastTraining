const helmet = require('helmet');
const session = require('express-session');
const express = require('express');
const path = require('path');

function setupMiddleware(app) {
  console.log('🛡️ [SECURITY] Configuring Helmet security headers...');
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP entirely
    hsts: false // Disable HSTS for now
  }));
  console.log('✅ [SECURITY] Helmet configured (CSP disabled, HSTS disabled)');

  // Session configuration
  console.log('🍪 [SESSION] Configuring session middleware...');
  app.use(session({
    secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  console.log('✅ [SESSION] Session middleware configured');

  // CSRF Protection (commented out for now)
  console.log('🛡️ [CSRF] CSRF protection disabled for development');

  // Static file serving
  const staticPath = path.join(__dirname, '..', '..', 'dist');
  console.log('📁 [STATIC] Setting up static file serving from:', staticPath);
  app.use(express.static(staticPath));

  // SPA fallback for client-side routing
  app.use((req, res, next) => {
    // Skip API routes and files with extensions
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/ping') || 
        req.path.includes('.') ||
        req.path.startsWith('/webhook')) {
      return next();
    }
    
    // For SPA routes, serve index.html
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) {
        console.error('❌ [STATIC] Error serving index.html:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  });

  console.log('✅ [MIDDLEWARE] All middleware configured');
}

module.exports = { setupMiddleware };