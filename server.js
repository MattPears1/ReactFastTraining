const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createRateLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3002;

// Admin credentials from environment variables (for production)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lex@reactfasttraining.co.uk';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$hashed_password_here'; // bcrypt hash
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://reactfasttraining.co.uk',
      'https://www.reactfasttraining.co.uk',
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Backend dev server
      'http://localhost:3002'  // This server
    ];
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS to API routes
app.use('/api', cors(corsOptions));
app.use('/ping', cors(corsOptions));

// Parse JSON for API routes
app.use('/api', express.json({ limit: '10mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }));

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

// Helper function to generate secure token
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// In-memory token storage (use Redis in production)
const activeTokens = new Map();

// Admin auth endpoints
app.post('/api/admin/auth/login', createRateLimiter('auth'), async (req, res) => {
  console.log('Admin login attempt:', { email: req.body.email });
  
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Check email
  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Verify password (in development, allow hardcoded password)
  let isValidPassword = false;
  if (process.env.NODE_ENV === 'production') {
    isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else {
    // Development only - remove in production
    isValidPassword = password === 'LexOnly321!';
  }
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate secure token
  const token = generateSecureToken();
  const tokenData = {
    userId: 1,
    email: ADMIN_EMAIL,
    name: 'Lex',
    role: 'admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + (3600 * 1000) // 1 hour
  };
  
  activeTokens.set(token, tokenData);
  
  res.json({
    accessToken: token,
    user: {
      id: tokenData.userId,
      email: tokenData.email,
      name: tokenData.name,
      role: tokenData.role
    },
    expiresIn: 3600
  });
});

// Middleware to verify admin token
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  const tokenData = activeTokens.get(token);
  
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Check if token is expired
  if (Date.now() > tokenData.expiresAt) {
    activeTokens.delete(token);
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Attach user data to request
  req.user = tokenData;
  next();
}

app.get('/api/admin/auth/me', verifyAdminToken, (req, res) => {
  res.json({
    id: req.user.userId,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    lastLogin: new Date(req.user.createdAt),
    permissions: ['all']
  });
});

// Admin logout endpoint
app.post('/api/admin/auth/logout', verifyAdminToken, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7);
  activeTokens.delete(token);
  res.json({ success: true });
});

// Admin dashboard endpoint
app.get('/api/admin/dashboard/overview', verifyAdminToken, (req, res) => {
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
app.get('/api/admin/courses', verifyAdminToken, (req, res) => {
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
app.get('/api/admin/schedules', verifyAdminToken, (req, res) => {
  res.json(courseSessions);
});

// Admin venues endpoint
app.get('/api/admin/venues', verifyAdminToken, (req, res) => {
  res.json([
    { id: 1, name: 'Location 1 - Sheffield', address_line1: 'Sheffield City Centre', city: 'Sheffield', capacity: 12 },
    { id: 2, name: 'Location 2 - Sheffield', address_line1: 'Sheffield Business District', city: 'Sheffield', capacity: 12 },
    { id: 3, name: 'Location 3 - Yorkshire', address_line1: 'To Be Confirmed', city: 'Yorkshire', capacity: 12 }
  ]);
});

// Get session attendance data
app.get('/api/admin/sessions/:sessionId/attendance', verifyAdminToken, (req, res) => {
  const { sessionId } = req.params;
  
  // Mock attendance data
  const attendance = [
    {
      bookingId: 'BK-2025-001',
      userId: 1,
      userName: 'John Smith',
      userEmail: 'john.smith@example.com',
      status: null,
      notes: '',
      markedAt: null,
      markedBy: null
    },
    {
      bookingId: 'BK-2025-002', 
      userId: 2,
      userName: 'Jane Doe',
      userEmail: 'jane.doe@example.com',
      status: null,
      notes: '',
      markedAt: null,
      markedBy: null
    },
    {
      bookingId: 'BK-2025-003',
      userId: 3,
      userName: 'Robert Johnson',
      userEmail: 'robert.j@example.com',
      status: null,
      notes: '',
      markedAt: null,
      markedBy: null
    }
  ];
  
  res.json(attendance);
});

// Admin attendance marking endpoint
app.post('/api/admin/sessions/:sessionId/attendance', verifyAdminToken, (req, res) => {
  const { sessionId } = req.params;
  const { attendance, markedBy } = req.body;
  
  console.log(`Marking attendance for session ${sessionId} by ${markedBy}`);
  console.log('Attendance records:', attendance);
  
  // Simulate certificate generation for attendees marked as present
  const certificates = [];
  attendance.forEach((record) => {
    if (record.status === 'PRESENT') {
      const certificateNumber = `RFT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      certificates.push({
        bookingId: record.bookingId,
        userId: record.userId,
        certificateNumber: certificateNumber,
        issuedDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 3 years
        status: 'ACTIVE',
        emailSent: true
      });
      console.log(`Generated certificate ${certificateNumber} for user ${record.userId}`);
    }
  });
  
  res.json({
    success: true,
    attendance: attendance,
    certificates: certificates,
    message: `Attendance marked successfully. ${certificates.length} certificates generated and emailed.`
  });
});

// Admin bookings endpoints
app.get('/api/admin/bookings', verifyAdminToken, (req, res) => {
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
app.get('/api/course-sessions', createRateLimiter('api'), (req, res) => {
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

app.post('/api/bookings/create-payment-intent', createRateLimiter('booking'), (req, res) => {
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

// Input validation for tracking
function validateTrackingData(data) {
  const errors = [];
  
  // Validate sessionId
  if (!data.sessionId || typeof data.sessionId !== 'string') {
    errors.push('Invalid session ID');
  } else if (data.sessionId.length > 100) {
    errors.push('Session ID too long');
  }
  
  // Validate event type
  const validEvents = ['pageview', 'booking_start', 'booking_complete', 'booking_cancel'];
  if (!data.event || !validEvents.includes(data.event)) {
    errors.push('Invalid event type');
  }
  
  // Validate page
  if (data.page && (typeof data.page !== 'string' || data.page.length > 200)) {
    errors.push('Invalid page value');
  }
  
  // Validate timestamp
  if (data.timestamp) {
    const ts = new Date(data.timestamp);
    if (isNaN(ts.getTime())) {
      errors.push('Invalid timestamp');
    }
  }
  
  // Validate device type
  const validDevices = ['mobile', 'tablet', 'desktop'];
  if (data.deviceType && !validDevices.includes(data.deviceType)) {
    errors.push('Invalid device type');
  }
  
  // Validate metadata
  if (data.metadata && typeof data.metadata !== 'object') {
    errors.push('Invalid metadata');
  }
  
  return errors;
}

// Visitor tracking endpoint (GDPR compliant)
app.post('/api/tracking/event', createRateLimiter('tracking'), (req, res) => {
  const { sessionId, event, page, timestamp, deviceType, metadata } = req.body;
  
  // Validate input
  const validationErrors = validateTrackingData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Invalid tracking data',
      details: validationErrors 
    });
  }
  
  // Sanitize data
  const sanitizedData = {
    sessionId: sessionId.substring(0, 100),
    event: event,
    page: page ? page.substring(0, 200) : null,
    timestamp: timestamp || new Date().toISOString(),
    deviceType: deviceType || 'unknown',
    metadata: metadata || {}
  };
  
  // Log tracking event (in production, this would go to database)
  console.log('📊 Tracking event:', {
    sessionId: sanitizedData.sessionId.substring(0, 10) + '...', // Truncate for privacy
    event: sanitizedData.event,
    page: sanitizedData.page,
    timestamp: sanitizedData.timestamp,
    deviceType: sanitizedData.deviceType
  });
  
  // Always return success
  res.json({ success: true });
});

// Analytics endpoints
app.get('/api/admin/analytics/comprehensive', verifyAdminToken, (req, res) => {
  const range = req.query.range || '30days';
  
  // Mock analytics data
  const analytics = {
    overview: {
      totalRevenue: 45650,
      revenueChange: 12.5,
      totalBookings: 324,
      bookingsChange: 8.3,
      uniqueVisitors: 2847,
      visitorsChange: 15.2,
      conversionRate: 11.4,
      conversionChange: 2.1,
    },
    coursePopularity: [
      { courseName: 'Emergency First Aid at Work', bookings: 87, capacity: 120 },
      { courseName: 'First Aid at Work', bookings: 65, capacity: 80 },
      { courseName: 'Paediatric First Aid', bookings: 52, capacity: 60 },
      { courseName: 'Mental Health First Aid', bookings: 43, capacity: 50 },
      { courseName: 'Fire Safety Training', bookings: 38, capacity: 40 },
    ],
    revenueByCourse: [
      { courseName: 'Emergency First Aid at Work', revenue: 6525, percentage: 28.5 },
      { courseName: 'First Aid at Work', revenue: 9750, percentage: 21.3 },
      { courseName: 'Paediatric First Aid', revenue: 7800, percentage: 17.1 },
      { courseName: 'Mental Health First Aid', revenue: 8600, percentage: 18.8 },
      { courseName: 'Fire Safety Training', revenue: 4560, percentage: 10.0 },
    ],
    dayOfWeekAnalysis: [
      { day: 'Monday', bookings: 58, revenue: 4350 },
      { day: 'Tuesday', bookings: 72, revenue: 5400 },
      { day: 'Wednesday', bookings: 85, revenue: 6375 },
      { day: 'Thursday', bookings: 91, revenue: 6825 },
      { day: 'Friday', bookings: 45, revenue: 3375 },
      { day: 'Saturday', bookings: 32, revenue: 2400 },
      { day: 'Sunday', bookings: 12, revenue: 900 },
    ],
    monthlyTrends: [
      { month: 'January', bookings: 28, revenue: 2100, attendees: 140 },
      { month: 'February', bookings: 35, revenue: 2625, attendees: 175 },
      { month: 'March', bookings: 42, revenue: 3150, attendees: 210 },
      { month: 'April', bookings: 38, revenue: 2850, attendees: 190 },
      { month: 'May', bookings: 45, revenue: 3375, attendees: 225 },
      { month: 'June', bookings: 52, revenue: 3900, attendees: 260 },
    ],
    bookingFunnel: {
      visitors: 2847,
      coursesViewed: 1423,
      bookingStarted: 412,
      bookingCompleted: 324,
      bookingCancelled: 88,
    },
    courseDetails: [
      {
        courseName: 'Emergency First Aid at Work',
        totalBookings: 87,
        revenue: 6525,
        avgAttendees: 8.2,
        fillRate: 72.5,
        popularDay: 'Thursday',
      },
      {
        courseName: 'First Aid at Work',
        totalBookings: 65,
        revenue: 9750,
        avgAttendees: 10.5,
        fillRate: 81.3,
        popularDay: 'Wednesday',
      },
      {
        courseName: 'Paediatric First Aid',
        totalBookings: 52,
        revenue: 7800,
        avgAttendees: 9.8,
        fillRate: 86.7,
        popularDay: 'Tuesday',
      },
    ],
  };
  
  res.json(analytics);
});

// Testimonial submission endpoint
app.post('/api/testimonials/submit', createRateLimiter('api'), (req, res) => {
  try {
    // Log the testimonial data
    console.log('📝 Testimonial submission received:', {
      authorName: req.body.authorName,
      authorEmail: req.body.authorEmail,
      courseTaken: req.body.courseTaken,
      rating: req.body.rating,
      timestamp: new Date().toISOString()
    });
    
    // Return success response
    res.json({
      success: true,
      message: 'Thank you for your testimonial! We appreciate your feedback.'
    });
  } catch (error) {
    console.error('❌ Testimonial submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit testimonial. Please try again.'
    });
  }
});

// Analytics endpoint
app.post('/api/analytics', createRateLimiter('api'), (req, res) => {
  // Just log analytics data for now
  console.log('📊 Analytics data received');
  res.json({ success: true });
});

// Serve static files for frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for some libraries
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' http://localhost:* https://api.stripe.com https://reactfasttraining.co.uk",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

const server = app.listen(PORT, () => {
  console.log(`
  🚀 React Fast Training Server
  📍 Running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  🔒 Admin panel: /admin
  `);
});