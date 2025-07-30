// Simple in-memory rate limiter
// In production, use Redis-based rate limiting

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = {
  api: 100,          // General API requests
  auth: 5,           // Auth attempts
  tracking: 200,     // Tracking events
  booking: 10        // Booking attempts
};

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
}, WINDOW_MS);

function createRateLimiter(type = 'api') {
  const limit = MAX_REQUESTS[type] || MAX_REQUESTS.api;
  
  return (req, res, next) => {
    // Get client identifier (IP address or user ID)
    const clientId = req.ip || req.connection.remoteAddress;
    const key = `${type}:${clientId}`;
    const now = Date.now();
    
    let clientData = requestCounts.get(key);
    
    if (!clientData || now - clientData.windowStart > WINDOW_MS) {
      // New window
      clientData = {
        count: 1,
        windowStart: now
      };
      requestCounts.set(key, clientData);
      return next();
    }
    
    clientData.count++;
    
    if (clientData.count > limit) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((clientData.windowStart + WINDOW_MS - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + WINDOW_MS).toISOString());
      
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - clientData.count);
    res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + WINDOW_MS).toISOString());
    
    next();
  };
}

module.exports = { createRateLimiter };