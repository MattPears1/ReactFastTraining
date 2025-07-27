const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable gzip compression
app.use(compression());

// Enable CORS for API routes
app.use('/api', cors());
app.use('/ping', cors());

// Parse JSON for API routes
app.use('/api', express.json());

// API Routes (embedded backend functionality)
app.get('/ping', (req, res) => {
  res.json({
    greeting: 'Hello from React Fast Training API',
    date: new Date(),
    url: req.url,
    version: '1.0.0',
    status: 'ok'
  });
});

app.get('/api/course-sessions', (req, res) => {
  res.json({
    message: 'Course sessions endpoint - database connection needed',
    status: 'placeholder'
  });
});

app.post('/api/bookings/create-payment-intent', (req, res) => {
  res.json({
    message: 'Payment intent endpoint - Stripe integration needed',
    status: 'placeholder'
  });
});

// Serve static files for frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' http://localhost:3000 https://api.stripe.com;");
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});