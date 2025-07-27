#!/usr/bin/env node
// Simple Node.js entry point for production without TypeScript compilation

const path = require('path');

// For now, let's create a minimal Express server until we can fix the TypeScript build
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Health check endpoint
app.get('/ping', (req, res) => {
  res.json({
    greeting: 'Hello from React Fast Training API',
    date: new Date(),
    url: req.url,
    version: '1.0.0',
    status: 'ok'
  });
});

// API endpoints for booking
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

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'React Fast Training API',
    version: '1.0.0',
    endpoints: [
      'GET /ping',
      'GET /api/course-sessions',
      'POST /api/bookings/create-payment-intent'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 React Fast Training API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/ping`);
  console.log('🎯 This is a temporary server while TypeScript compilation is fixed');
});