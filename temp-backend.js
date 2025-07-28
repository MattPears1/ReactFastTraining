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
  
  const timestamp = Date.now();
  const amount = req.body.amount || 7500;
  
  // For demo purposes, return a mock payment intent with proper client secret format
  res.json({
    clientSecret: `pi_demo_${timestamp}_secret_demo`,
    paymentIntentId: `pi_demo_${timestamp}`,
    amount: amount,
    currency: 'gbp',
    status: 'requires_payment_method'
  });
});


// Handle preflight requests
app.options('*', cors(corsOptions));

// Admin courses endpoints
app.get('/api/admin/courses', (req, res) => {
  console.log('Courses list request');
  
  const courses = [
    { id: 1, name: 'Emergency First Aid at Work', category: 'workplace', duration: 'Full Day (6 hours)', price: 100, status: 'active', attendees: 145 },
    { id: 2, name: 'First Aid at Work', category: 'workplace', duration: 'Full Day (6 hours)', price: 200, status: 'active', attendees: 89 },
    { id: 3, name: 'Paediatric First Aid', category: 'paediatric', duration: 'Full Day (6 hours)', price: 150, status: 'active', attendees: 234 },
    { id: 4, name: 'Emergency Paediatric First Aid', category: 'paediatric', duration: 'Full Day (5 hours)', price: 100, status: 'active', attendees: 67 },
    { id: 5, name: 'FAW Requalification', category: 'workplace', duration: 'Full Day (5 hours)', price: 150, status: 'active', attendees: 45 },
    { id: 6, name: 'EFAW Requalification', category: 'workplace', duration: '3 Hours', price: 75, status: 'active', attendees: 123 },
    { id: 7, name: 'Paediatric Requalification', category: 'paediatric', duration: '3 Hours', price: 100, status: 'active', attendees: 56 },
    { id: 8, name: 'Emergency Paediatric Requalification', category: 'paediatric', duration: '3 Hours', price: 75, status: 'active', attendees: 34 },
    { id: 9, name: 'Activity First Aid', category: 'specialist', duration: 'Full Day (5 hours)', price: 175, status: 'active', attendees: 78 },
    { id: 10, name: 'Activity First Aid Requalification', category: 'specialist', duration: '3 Hours', price: 100, status: 'active', attendees: 23 },
    { id: 11, name: 'CPR and AED', category: 'specialist', duration: '3 Hours', price: 50, status: 'active', attendees: 156 },
    { id: 12, name: 'Annual Skills Refresher', category: 'specialist', duration: '3 Hours', price: 50, status: 'active', attendees: 89 },
    { id: 13, name: 'Oxygen Therapy', category: 'specialist', duration: '3 Hours', price: 75, status: 'inactive', attendees: 12 }
  ];
  
  res.json(courses);
});

// Mock database for bookings
let bookings = [
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
    paymentIntentId: 'pi_demo_123456',
    attendees: 1,
    totalAmount: 100,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:35:00Z'
  },
  {
    id: 'BK-2025-002',
    courseId: 3,
    courseName: 'Paediatric First Aid',
    courseDate: '2025-02-12',
    courseTime: '10:00',
    courseVenue: 'Sheffield Hub',
    coursePrice: 150,
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@nursery.co.uk',
    customerPhone: '07700 900456',
    companyName: 'Happy Days Nursery',
    bookingDate: '2025-01-18',
    bookingReference: 'BK-2025-002',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    attendees: 3,
    totalAmount: 450,
    notes: 'Three staff members attending together',
    createdAt: '2025-01-18T14:20:00Z',
    updatedAt: '2025-01-18T14:20:00Z'
  },
  {
    id: 'BK-2025-003',
    courseId: 2,
    courseName: 'First Aid at Work',
    courseDate: '2025-02-15',
    courseTime: '09:00',
    courseVenue: 'Bradford Centre',
    coursePrice: 200,
    customerName: 'Mike Wilson',
    customerEmail: 'mike@construction.com',
    customerPhone: '07700 900789',
    companyName: 'Wilson Construction',
    bookingDate: '2025-01-20',
    bookingReference: 'BK-2025-003',
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'card',
    attendees: 2,
    totalAmount: 400,
    createdAt: '2025-01-20T09:15:00Z',
    updatedAt: '2025-01-20T09:15:00Z'
  }
];

// Mock course schedules
const courseSchedules = [
  {
    id: 'SCH-001',
    courseId: 1,
    courseName: 'Emergency First Aid at Work',
    date: '2025-02-10',
    time: '09:00',
    venue: 'Leeds Training Centre',
    instructor: 'Lex Thompson',
    maxCapacity: 12,
    currentCapacity: 8,
    price: 100,
    status: 'scheduled'
  },
  {
    id: 'SCH-002',
    courseId: 3,
    courseName: 'Paediatric First Aid',
    date: '2025-02-12',
    time: '10:00',
    venue: 'Sheffield Hub',
    instructor: 'Sarah Williams',
    maxCapacity: 10,
    currentCapacity: 10,
    price: 150,
    status: 'scheduled'
  },
  {
    id: 'SCH-003',
    courseId: 2,
    courseName: 'First Aid at Work',
    date: '2025-02-15',
    time: '09:00',
    venue: 'Bradford Centre',
    instructor: 'Lex Thompson',
    maxCapacity: 15,
    currentCapacity: 5,
    price: 200,
    status: 'scheduled'
  },
  {
    id: 'SCH-004',
    courseId: 11,
    courseName: 'CPR and AED',
    date: '2025-02-18',
    time: '14:00',
    venue: 'York Training Room',
    instructor: 'Mike Johnson',
    maxCapacity: 20,
    currentCapacity: 12,
    price: 50,
    status: 'scheduled'
  },
  {
    id: 'SCH-005',
    courseId: 4,
    courseName: 'Emergency Paediatric First Aid',
    date: '2025-02-20',
    time: '09:30',
    venue: 'Leeds Training Centre',
    instructor: 'Sarah Williams',
    maxCapacity: 10,
    currentCapacity: 3,
    price: 100,
    status: 'scheduled'
  }
];

// Admin bookings endpoints
app.get('/api/admin/bookings', (req, res) => {
  console.log('Bookings list request', req.query);
  
  let filteredBookings = [...bookings];
  
  // Apply filters
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    filteredBookings = filteredBookings.filter(b => 
      b.customerName.toLowerCase().includes(search) ||
      b.customerEmail.toLowerCase().includes(search) ||
      b.bookingReference.toLowerCase().includes(search) ||
      b.courseName.toLowerCase().includes(search)
    );
  }
  
  if (req.query.status && req.query.status !== 'all') {
    filteredBookings = filteredBookings.filter(b => b.status === req.query.status);
  }
  
  if (req.query.paymentStatus && req.query.paymentStatus !== 'all') {
    filteredBookings = filteredBookings.filter(b => b.paymentStatus === req.query.paymentStatus);
  }
  
  if (req.query.courseId) {
    filteredBookings = filteredBookings.filter(b => b.courseId === parseInt(req.query.courseId));
  }
  
  if (req.query.dateFrom) {
    filteredBookings = filteredBookings.filter(b => b.courseDate >= req.query.dateFrom);
  }
  
  if (req.query.dateTo) {
    filteredBookings = filteredBookings.filter(b => b.courseDate <= req.query.dateTo);
  }
  
  res.json(filteredBookings);
});

// Get single booking
app.get('/api/admin/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (booking) {
    res.json(booking);
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Update booking
app.put('/api/admin/bookings/:id', (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index !== -1) {
    bookings[index] = {
      ...bookings[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(bookings[index]);
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Delete booking
app.delete('/api/admin/bookings/:id', (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index !== -1) {
    bookings.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Course schedules endpoints
app.get('/api/admin/schedules', (req, res) => {
  console.log('Schedules list request', req.query);
  
  let filteredSchedules = [...courseSchedules];
  
  // Add bookings to each schedule
  filteredSchedules = filteredSchedules.map(schedule => ({
    ...schedule,
    bookings: bookings.filter(b => 
      b.courseId === schedule.courseId && 
      b.courseDate === schedule.date &&
      b.courseTime === schedule.time
    )
  }));
  
  if (req.query.dateFrom) {
    filteredSchedules = filteredSchedules.filter(s => s.date >= req.query.dateFrom);
  }
  
  if (req.query.dateTo) {
    filteredSchedules = filteredSchedules.filter(s => s.date <= req.query.dateTo);
  }
  
  res.json(filteredSchedules);
});

// Get schedule with bookings
app.get('/api/admin/schedules/:id', (req, res) => {
  const schedule = courseSchedules.find(s => s.id === req.params.id);
  if (schedule) {
    const scheduleBookings = bookings.filter(b => 
      b.courseId === schedule.courseId && 
      b.courseDate === schedule.date &&
      b.courseTime === schedule.time
    );
    res.json({
      ...schedule,
      bookings: scheduleBookings
    });
  } else {
    res.status(404).json({ error: 'Schedule not found' });
  }
});

// Create new booking
app.post('/api/admin/bookings', (req, res) => {
  console.log('Create new booking:', req.body);
  
  const newBooking = {
    ...req.body,
    id: req.body.id || `BK-${Date.now()}`,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: req.body.updatedAt || new Date().toISOString()
  };
  
  // Add to bookings array
  bookings.push(newBooking);
  
  res.json({ 
    success: true, 
    booking: newBooking 
  });
});

// Send email endpoint
app.post('/api/admin/bookings/:id/email', (req, res) => {
  console.log('Email booking confirmation:', req.params.id, req.body);
  
  // In production, this would send actual email
  res.json({ 
    success: true, 
    message: 'Email sent successfully',
    sentTo: req.body.to,
    subject: req.body.subject
  });
});

// Mock testimonials database
let testimonials = [
  {
    id: 1,
    authorName: 'Sarah Johnson',
    authorEmail: 'sarah.j@example.com',
    authorLocation: 'Leeds, Yorkshire',
    courseTaken: 'Emergency First Aid at Work',
    courseDate: '2025-01-15',
    content: 'Absolutely brilliant course! The instructor was incredibly knowledgeable and made everything easy to understand. The hands-on practice really helped build my confidence. I now feel prepared to handle emergency situations both at work and in everyday life. Highly recommend React Fast Training!',
    rating: 5,
    photoUrl: null,
    photoConsent: 'not_given',
    showFullName: true,
    status: 'approved',
    showOnHomepage: true,
    verifiedBooking: true,
    bookingReference: 'RFT-2025-0001',
    createdAt: '2025-01-16T10:00:00Z',
    approvedAt: '2025-01-17T09:00:00Z',
    approvedBy: 'Admin'
  },
  {
    id: 2,
    authorName: 'Michael Chen',
    authorEmail: 'michael.c@nursery.co.uk',
    authorLocation: 'Sheffield',
    courseTaken: 'Paediatric First Aid',
    courseDate: '2025-01-10',
    content: 'As a nursery teacher, this course was invaluable. The instructor covered everything from basic first aid to specific scenarios with infants and children. The small class size meant we all got plenty of hands-on practice. I especially appreciated the sections on choking and CPR for different age groups.',
    rating: 5,
    photoUrl: null,
    photoConsent: 'not_given',
    showFullName: true,
    status: 'featured',
    showOnHomepage: true,
    verifiedBooking: true,
    bookingReference: 'RFT-2025-0002',
    createdAt: '2025-01-11T14:30:00Z',
    approvedAt: '2025-01-12T10:00:00Z',
    approvedBy: 'Admin'
  },
  {
    id: 3,
    authorName: 'Emma Williams',
    authorEmail: 'emma.w@company.com',
    authorLocation: 'Bradford',
    courseTaken: 'Mental Health First Aid',
    courseDate: '2025-01-05',
    content: 'This course completely changed my perspective on mental health in the workplace. The trainer created a safe, non-judgmental environment where we could discuss sensitive topics openly. I learned practical strategies for supporting colleagues and recognizing warning signs. Essential training for any workplace.',
    rating: 5,
    photoUrl: null,
    photoConsent: 'not_given',
    showFullName: false,
    status: 'approved',
    showOnHomepage: true,
    verifiedBooking: true,
    bookingReference: 'RFT-2025-0003',
    createdAt: '2025-01-06T11:00:00Z',
    approvedAt: '2025-01-07T09:30:00Z',
    approvedBy: 'Admin'
  }
];

// Public testimonials endpoints
app.get('/api/testimonials/approved', (req, res) => {
  console.log('Fetching approved testimonials');
  
  let approvedTestimonials = testimonials.filter(t => 
    t.status === 'approved' || t.status === 'featured'
  );
  
  // Apply filters
  if (req.query.course && req.query.course !== 'all') {
    approvedTestimonials = approvedTestimonials.filter(t => 
      t.courseTaken === req.query.course
    );
  }
  
  // Check for featured filter
  if (req.query.featured === 'true') {
    // Prioritize featured testimonials, then highest rated
    approvedTestimonials.sort((a, b) => {
      if (a.status === 'featured' && b.status !== 'featured') return -1;
      if (b.status === 'featured' && a.status !== 'featured') return 1;
      return b.rating - a.rating;
    });
  } else if (req.query.sort === 'rating') {
    approvedTestimonials.sort((a, b) => b.rating - a.rating);
  } else {
    // Default to recent
    approvedTestimonials.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  // Apply limit if specified
  const limit = req.query.limit ? parseInt(req.query.limit) : approvedTestimonials.length;
  const limitedTestimonials = approvedTestimonials.slice(0, limit);
  
  // Calculate average rating
  const averageRating = approvedTestimonials.length > 0
    ? approvedTestimonials.reduce((acc, t) => acc + t.rating, 0) / approvedTestimonials.length
    : 0;
  
  res.json({ 
    testimonials: limitedTestimonials,
    averageRating: averageRating,
    totalCount: approvedTestimonials.length
  });
});

// Submit new testimonial
app.post('/api/testimonials/submit', (req, res) => {
  console.log('New testimonial submission:', req.body);
  
  const newTestimonial = {
    id: testimonials.length + 1,
    ...req.body,
    status: 'pending',
    showOnHomepage: false,
    verifiedBooking: false, // Would be verified against actual bookings
    createdAt: new Date().toISOString()
  };
  
  testimonials.push(newTestimonial);
  
  res.json({ 
    success: true,
    message: 'Thank you for your testimonial! It will be reviewed shortly.',
    testimonialId: newTestimonial.id
  });
});

// Admin testimonials endpoints
app.get('/api/admin/testimonials', (req, res) => {
  console.log('Admin fetching testimonials');
  
  let filteredTestimonials = [...testimonials];
  
  if (req.query.status && req.query.status !== 'all') {
    filteredTestimonials = filteredTestimonials.filter(t => 
      t.status === req.query.status
    );
  }
  
  res.json(filteredTestimonials);
});

// Get testimonials stats
app.get('/api/admin/testimonials/stats', (req, res) => {
  const stats = {
    total: testimonials.length,
    pending: testimonials.filter(t => t.status === 'pending').length,
    approved: testimonials.filter(t => t.status === 'approved').length,
    rejected: testimonials.filter(t => t.status === 'rejected').length,
    featured: testimonials.filter(t => t.status === 'featured').length,
    averageRating: testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length || 0
  };
  
  res.json(stats);
});

// Update testimonial status
app.put('/api/admin/testimonials/:id/status', (req, res) => {
  console.log('Updating testimonial status:', req.params.id, req.body);
  
  const testimonialIndex = testimonials.findIndex(t => t.id === parseInt(req.params.id));
  
  if (testimonialIndex !== -1) {
    testimonials[testimonialIndex] = {
      ...testimonials[testimonialIndex],
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
      approvedAt: req.body.status === 'approved' || req.body.status === 'featured' 
        ? new Date().toISOString() 
        : testimonials[testimonialIndex].approvedAt,
      approvedBy: req.body.status === 'approved' || req.body.status === 'featured'
        ? 'Admin'
        : testimonials[testimonialIndex].approvedBy
    };
    
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Testimonial not found' });
  }
});

// Toggle homepage display
app.put('/api/admin/testimonials/:id/homepage', (req, res) => {
  console.log('Toggling homepage display:', req.params.id, req.body);
  
  const testimonialIndex = testimonials.findIndex(t => t.id === parseInt(req.params.id));
  
  if (testimonialIndex !== -1) {
    testimonials[testimonialIndex].showOnHomepage = req.body.showOnHomepage;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Testimonial not found' });
  }
});

// Homepage testimonials
app.get('/api/testimonials/homepage', (req, res) => {
  const homepageTestimonials = testimonials
    .filter(t => t.showOnHomepage && (t.status === 'approved' || t.status === 'featured'))
    .sort((a, b) => {
      // Featured first, then by rating
      if (a.status === 'featured' && b.status !== 'featured') return -1;
      if (b.status === 'featured' && a.status !== 'featured') return 1;
      return b.rating - a.rating;
    })
    .slice(0, 3); // Show top 3
  
  res.json({ testimonials: homepageTestimonials });
});

app.listen(PORT, () => {
  console.log(`🚀 Temporary backend running on port ${PORT}`);
  console.log(`✅ CORS enabled for frontend domains`);
  console.log(`🔐 Admin login endpoint: POST /api/admin/auth/login`);
  console.log(`💳 Payment endpoint: POST /api/bookings/create-payment-intent`);
  console.log(`📚 Courses endpoint: GET /api/admin/courses`);
  console.log(`💬 Testimonials endpoints: GET /api/testimonials/approved, POST /api/testimonials/submit`);
});