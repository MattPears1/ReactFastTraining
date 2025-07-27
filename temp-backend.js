const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS configuration
const corsOptions = {
  origin: [
    'https://www.reactfasttraining.co.uk',
    'https://reactfasttraining.co.uk', 
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Admin auth endpoint
app.post('/api/admin/auth/login', (req, res) => {
  console.log('Admin login attempt:', { email: req.body.email });
  
  // For demo purposes, accept any login with these credentials
  const { email, password } = req.body;
  
  if (email === 'lex@reactfasttraining.co.uk' && password === 'LexOnly321!') {
    res.json({
      accessToken: 'temp-admin-token-123',
      user: {
        id: 1,
        email: 'lex@reactfasttraining.co.uk',
        name: 'Lex',
        role: 'admin'
      },
      expiresIn: 3600
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Booking payment intent endpoint
app.post('/api/bookings/create-payment-intent', (req, res) => {
  console.log('Payment intent request:', req.body);
  
  // For demo purposes, return a mock payment intent
  res.json({
    clientSecret: 'pi_demo_client_secret_test',
    paymentIntentId: 'pi_demo_test_' + Date.now(),
    amount: req.body.amount || 7500, // £75.00 in pence
    currency: 'gbp'
  });
});

// Handle preflight requests
app.options('*', cors(corsOptions));

app.listen(PORT, () => {
  console.log(`🚀 Temporary backend running on port ${PORT}`);
  console.log(`✅ CORS enabled for frontend domains`);
  console.log(`🔐 Admin login endpoint: POST /api/admin/auth/login`);
});