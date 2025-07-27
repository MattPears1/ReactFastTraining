const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// In-memory storage for course sessions (temporary until database is connected)
let courseSessions = [
  {
    id: '1',
    courseId: 1,
    courseName: 'Emergency First Aid at Work',
    venueId: 1,
    venueName: 'Location 1 - Sheffield',
    date: '2025-02-10',
    startTime: '09:00',
    endTime: '17:00',
    maxParticipants: 12,
    currentBookings: 8,
    status: 'scheduled'
  },
  {
    id: '2',
    courseId: 3,
    courseName: 'Paediatric First Aid',
    venueId: 2,
    venueName: 'Location 2 - Sheffield',
    date: '2025-02-12',
    startTime: '10:00',
    endTime: '16:00',
    maxParticipants: 12,
    currentBookings: 10,
    status: 'scheduled'
  }
];

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

// Admin auth endpoints
app.post('/api/admin/auth/login', (req, res) => {
  console.log('Admin login attempt:', { email: req.body.email });
  
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

app.get('/api/admin/auth/me', (req, res) => {
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

// Admin dashboard endpoint
app.get('/api/admin/dashboard/overview', (req, res) => {
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
      }
    ],
    recentActivity: []
  });
});

// Admin courses endpoint
app.get('/api/admin/courses', (req, res) => {
  // Return all 13 courses with proper data structure
  res.json([
    { id: 1, name: 'Emergency First Aid at Work', category: 'workplace', duration: '1 Day', price: 100, status: 'active', attendees: 145 },
    { id: 2, name: 'First Aid at Work', category: 'workplace', duration: '1 Day', price: 200, status: 'active', attendees: 89 },
    { id: 3, name: 'Paediatric First Aid', category: 'paediatric', duration: '1 Day', price: 120, status: 'active', attendees: 234 },
    { id: 4, name: 'Emergency Paediatric First Aid', category: 'paediatric', duration: '1 Day', price: 100, status: 'active', attendees: 67 },
    { id: 5, name: 'FAW Requalification', category: 'requalification', duration: '1 Day', price: 150, status: 'active', attendees: 45 },
    { id: 6, name: 'EFAW Requalification', category: 'requalification', duration: '3 Hours', price: 75, status: 'active', attendees: 123 },
    { id: 7, name: 'Paediatric Requalification', category: 'requalification', duration: '3 Hours', price: 100, status: 'active', attendees: 56 },
    { id: 8, name: 'Emergency Paediatric Requalification', category: 'requalification', duration: '3 Hours', price: 75, status: 'active', attendees: 34 },
    { id: 9, name: 'Activity First Aid', category: 'specialist', duration: '1 Day', price: 175, status: 'active', attendees: 78 },
    { id: 10, name: 'Activity First Aid Requalification', category: 'specialist', duration: '3 Hours', price: 100, status: 'active', attendees: 23 },
    { id: 11, name: 'CPR and AED', category: 'specialist', duration: '3 Hours', price: 50, status: 'active', attendees: 156 },
    { id: 12, name: 'Annual Skills Refresher', category: 'specialist', duration: '3 Hours', price: 50, status: 'active', attendees: 89 },
    { id: 13, name: 'Oxygen Therapy', category: 'specialist', duration: '3 Hours', price: 75, status: 'inactive', attendees: 12 }
  ]);
});

// Admin schedules endpoint
app.get('/api/admin/schedules', (req, res) => {
  res.json(courseSessions);
});

// Admin venues endpoint
app.get('/api/admin/venues', (req, res) => {
  res.json([
    { id: 1, name: 'Location 1 - Sheffield', address_line1: 'Sheffield City Centre', city: 'Sheffield', capacity: 12 },
    { id: 2, name: 'Location 2 - Sheffield', address_line1: 'Sheffield Business District', city: 'Sheffield', capacity: 12 },
    { id: 3, name: 'Location 3 - Yorkshire', address_line1: 'To Be Confirmed', city: 'Yorkshire', capacity: 12 }
  ]);
});

// Admin bookings endpoints
app.get('/api/admin/bookings', (req, res) => {
  res.json([
    {
      id: 'BK-2025-001',
      courseId: 1,
      courseName: 'Emergency First Aid at Work',
      courseDate: '2025-02-10',
      courseTime: '09:00',
      courseVenue: 'Leeds Training Centre',
      coursePrice: 100,
      customerName: 'John Smith',
      customerEmail: 'john.smith@example.com',
      customerPhone: '07700 900123',
      companyName: 'Smith & Co Ltd',
      bookingDate: '2025-01-15',
      bookingReference: 'BK-2025-001',
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      attendees: 1,
      totalAmount: 100,
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:35:00Z'
    }
  ]);
});

// Public API endpoint for getting available course sessions
app.get('/api/course-sessions', (req, res) => {
  // Filter for future sessions that are not full
  const availableSessions = courseSessions
    .filter(session => {
      const sessionDate = new Date(session.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return sessionDate >= today && 
             session.status === 'scheduled' && 
             session.currentBookings < session.maxParticipants;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  res.json(availableSessions);
});

// Get course and venue data helpers
const getCourse = (courseId) => {
  const courses = [
    { id: 1, name: 'Emergency First Aid at Work', category: 'workplace', duration: '1 Day', price: 100 },
    { id: 2, name: 'First Aid at Work', category: 'workplace', duration: '1 Day', price: 200 },
    { id: 3, name: 'Paediatric First Aid', category: 'paediatric', duration: '1 Day', price: 120 },
    { id: 4, name: 'Emergency Paediatric First Aid', category: 'paediatric', duration: '1 Day', price: 100 },
    { id: 5, name: 'FAW Requalification', category: 'requalification', duration: '1 Day', price: 150 },
    { id: 6, name: 'EFAW Requalification', category: 'requalification', duration: '3 Hours', price: 75 },
    { id: 7, name: 'Paediatric Requalification', category: 'requalification', duration: '3 Hours', price: 100 },
    { id: 8, name: 'Emergency Paediatric Requalification', category: 'requalification', duration: '3 Hours', price: 75 },
    { id: 9, name: 'Activity First Aid', category: 'specialist', duration: '1 Day', price: 175 },
    { id: 10, name: 'Activity First Aid Requalification', category: 'specialist', duration: '3 Hours', price: 100 },
    { id: 11, name: 'CPR and AED', category: 'specialist', duration: '3 Hours', price: 50 },
    { id: 12, name: 'Annual Skills Refresher', category: 'specialist', duration: '3 Hours', price: 50 },
    { id: 13, name: 'Oxygen Therapy', category: 'specialist', duration: '3 Hours', price: 75 }
  ];
  return courses.find(c => c.id === parseInt(courseId));
};

const getVenue = (venueId) => {
  const venues = [
    { id: 1, name: 'Location 1 - Sheffield', city: 'Sheffield' },
    { id: 2, name: 'Location 2 - Sheffield', city: 'Sheffield' },
    { id: 3, name: 'Location 3 - Yorkshire', city: 'Yorkshire' }
  ];
  return venues.find(v => v.id === parseInt(venueId));
};

// Course sessions POST endpoint for creating new sessions
app.post('/course-sessions', express.json(), (req, res) => {
  const { courseId, venueId, startDatetime, endDatetime, notes } = req.body;
  
  // Get course and venue details
  const course = getCourse(courseId);
  const venue = getVenue(venueId);
  
  if (!course || !venue) {
    return res.status(400).json({
      success: false,
      message: 'Invalid course or venue ID'
    });
  }
  
  // Extract date and times
  const date = startDatetime.split(' ')[0];
  const startTime = startDatetime.split(' ')[1].substring(0, 5);
  const endTime = endDatetime.split(' ')[1].substring(0, 5);
  
  // Create new session
  const newSession = {
    id: Date.now().toString(),
    courseId: parseInt(courseId),
    courseName: course.name,
    venueId: parseInt(venueId),
    venueName: venue.name,
    date,
    startTime,
    endTime,
    notes,
    status: 'scheduled',
    currentBookings: 0,
    maxParticipants: 12,
    createdAt: new Date().toISOString()
  };
  
  // Add to our in-memory storage
  courseSessions.push(newSession);
  
  console.log('New course session created:', newSession);
  
  res.status(201).json({
    success: true,
    data: newSession,
    message: 'Course session created successfully'
  });
});

app.post('/api/bookings/create-payment-intent', (req, res) => {
  const timestamp = Date.now();
  const amount = req.body.amount || 7500;
  const { sessionId } = req.body;
  
  // If a sessionId is provided, update the booking count
  if (sessionId) {
    const session = courseSessions.find(s => s.id === sessionId);
    if (session && session.currentBookings < session.maxParticipants) {
      session.currentBookings++;
      console.log(`Updated session ${sessionId} bookings to ${session.currentBookings}/${session.maxParticipants}`);
    }
  }
  
  res.json({
    clientSecret: `pi_demo_${timestamp}_secret_demo`,
    paymentIntentId: `pi_demo_${timestamp}`,
    amount: amount,
    currency: 'gbp',
    status: 'requires_payment_method'
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