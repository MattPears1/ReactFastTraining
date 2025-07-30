const crypto = require('crypto');

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map();

// Generate CSRF token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF protection middleware for API routes
function csrfProtection(options = {}) {
  const {
    excludePaths = ['/api/webhooks', '/api/stripe'],
    cookieName = 'csrf-token',
    headerName = 'x-csrf-token',
    paramName = '_csrf',
    tokenExpiry = 24 * 60 * 60 * 1000, // 24 hours
  } = options;

  return (req, res, next) => {
    // Skip CSRF protection for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate token for GET requests if not exists
      if (!req.session.csrfToken) {
        req.session.csrfToken = generateCSRFToken();
        req.session.csrfTokenExpiry = Date.now() + tokenExpiry;
      }
      
      // Add CSRF token to response for client to use
      res.setHeader('X-CSRF-Token', req.session.csrfToken);
      return next();
    }

    // For state-changing requests (POST, PUT, DELETE, PATCH)
    const token = req.headers[headerName] || 
                  req.body[paramName] || 
                  req.query[paramName];

    const sessionToken = req.session.csrfToken;
    const tokenExpiry = req.session.csrfTokenExpiry;

    // Validate CSRF token
    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'Your request could not be validated. Please refresh and try again.'
      });
    }

    // Check token expiry
    if (!tokenExpiry || Date.now() > tokenExpiry) {
      return res.status(403).json({
        error: 'Expired CSRF token',
        message: 'Your session has expired. Please refresh and try again.'
      });
    }

    // Token is valid, continue
    next();
  };
}

// Middleware to generate and send CSRF token
function generateCSRFTokenMiddleware() {
  return (req, res, next) => {
    if (!req.session.csrfToken || 
        !req.session.csrfTokenExpiry || 
        Date.now() > req.session.csrfTokenExpiry) {
      req.session.csrfToken = generateCSRFToken();
      req.session.csrfTokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
    }
    
    res.locals.csrfToken = req.session.csrfToken;
    next();
  };
}

module.exports = {
  csrfProtection,
  generateCSRFToken,
  generateCSRFTokenMiddleware
};