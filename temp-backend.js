const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS configuration for development
const corsOptions = {
  origin: [
    'http://localhost:3003',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://www.reactfasttraining.co.uk',
    'https://reactfasttraining.co.uk'
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

// Admin auth endpoints
app.get('/api/admin/auth/me', (req, res) => {
  console.log('Admin auth check');
  
  // Check for auth header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader === 'Bearer temp-admin-token-123') {
    res.json({
      id: 1,
      email: 'lex@reactfasttraining.co.uk',
      name: 'Lex',
      role: 'admin',
      lastLogin: new Date(),
      permissions: ['all']
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

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

// Admin dashboard endpoints
app.get('/api/admin/dashboard/overview', (req, res) => {
  console.log('Dashboard overview request');
  
  // Mock dashboard data
  res.json({
    metrics: {
      revenue: {
        current: 15750,
        previous: 12300,
        change: 28.04
      },
      bookings: {
        current: 210,
        previous: 164,
        change: 28.05
      },
      users: {
        total: 1847,
        new: 87,
        active: 342
      },
      courses: {
        upcoming: 12,
        inProgress: 3,
        completed: 45
      }
    },
    revenueData: [
      { date: '2025-01-01', revenue: 2250, bookings: 30 },
      { date: '2025-01-08', revenue: 1875, bookings: 25 },
      { date: '2025-01-15', revenue: 2625, bookings: 35 },
      { date: '2025-01-22', revenue: 3000, bookings: 40 },
      { date: '2025-01-29', revenue: 3375, bookings: 45 },
      { date: '2025-02-05', revenue: 2625, bookings: 35 }
    ],
    bookingStatus: [
      { status: 'Confirmed', count: 168, percentage: 80 },
      { status: 'Pending', count: 21, percentage: 10 },
      { status: 'Cancelled', count: 21, percentage: 10 }
    ],
    upcomingSchedules: [
      {
        id: 1,
        courseName: 'Emergency First Aid at Work',
        date: '2025-02-10',
        time: '09:00',
        venue: 'Leeds Training Centre',
        currentCapacity: 8,
        maxCapacity: 12
      },
      {
        id: 2,
        courseName: 'Paediatric First Aid',
        date: '2025-02-12',
        time: '10:00',
        venue: 'Sheffield Hub',
        currentCapacity: 10,
        maxCapacity: 10
      },
      {
        id: 3,
        courseName: 'First Aid at Work',
        date: '2025-02-15',
        time: '09:00',
        venue: 'Bradford Centre',
        currentCapacity: 5,
        maxCapacity: 15
      }
    ],
    recentActivity: [
      {
        id: 1,
        action: 'New Booking',
        user: 'John Smith',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        details: 'EFAW Course - Leeds'
      },
      {
        id: 2,
        action: 'Payment Received',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        details: '£150.00 - FAW Course'
      },
      {
        id: 3,
        action: 'Course Completed',
        user: 'Mike Wilson',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        details: 'Paediatric First Aid'
      }
    ]
  });
});

// Analytics endpoints
app.get('/api/admin/analytics/revenue', (req, res) => {
  res.json({
    period: req.query.period || 'month',
    data: [
      { date: '2025-01-01', revenue: 2250 },
      { date: '2025-01-08', revenue: 1875 },
      { date: '2025-01-15', revenue: 2625 },
      { date: '2025-01-22', revenue: 3000 },
      { date: '2025-01-29', revenue: 3375 }
    ],
    total: 13125,
    average: 2625
  });
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
  console.log(`💳 Payment endpoint: POST /api/bookings/create-payment-intent`);
});