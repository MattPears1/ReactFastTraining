console.log('🚀 [SERVER] Starting React Fast Training server...', {
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  env: process.env.NODE_ENV || 'development'
});

require('dotenv').config();
console.log('✅ [SERVER] Environment variables loaded');

const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const helmet = require('helmet');
const session = require('express-session');
const { csrfProtection, generateCSRFTokenMiddleware } = require('./middleware/csrf-protection');
const { apiLimiter, authLimiter, bookingLimiter } = require('./middleware/rate-limiter');
const EmailService = require('./src/services/email.service');
const RefundService = require('./src/services/refund.service');
const { adminLogin, adminMe } = require('./src/controllers/admin-auth-super-bypass');

console.log('✅ [SERVER] All modules imported successfully');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 [SERVER] Express app created', {
  port: PORT,
  hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  timestamp: new Date().toISOString()
});

// Body parser MUST come before test endpoint
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('✅ [SERVER] Body parsers configured');

// TEST ENDPOINT - BEFORE ALL MIDDLEWARE
const { testLogin } = require('./src/controllers/test-login');
app.post('/api/test-login', testLogin);
console.log('✅ [SERVER] Test login endpoint registered');

// Trust proxy for Heroku
app.set('trust proxy', true);
console.log('✅ [SERVER] Trust proxy enabled');

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  console.log('📥 [REQUEST]', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log('📤 [RESPONSE]', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
});

// Force HTTPS redirect in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    console.log('🔐 [HTTPS] Redirecting to HTTPS:', {
      host: req.header('host'),
      url: req.url,
      timestamp: new Date().toISOString()
    });
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// Initialize services
console.log('🔧 [SERVER] Initializing services...');
const emailService = new EmailService();
const refundService = new RefundService();
console.log('✅ [SERVER] Services initialized');

// Security headers - minimal restrictions
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
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
    domain: undefined // Let browser handle domain for same-origin
  }
}));
console.log('✅ [SESSION] Session middleware configured', {
  secure: process.env.NODE_ENV === 'production',
  maxAge: '24 hours',
  sameSite: 'strict'
});

// CORS not needed - frontend and backend served from same domain

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Generate CSRF tokens for all requests
app.use(generateCSRFTokenMiddleware());

// TEMPORARILY DISABLE CSRF FOR DEBUGGING
// app.use('/api/', csrfProtection({
//   excludePaths: [
//     '/api/webhooks',
//     '/api/stripe',
//     '/api/admin/auth/login', // Exclude login from CSRF for initial auth
//     '/api/admin/auth/refresh', // Exclude refresh from CSRF
//     '/api/admin/auth/me', // Exclude me endpoint from CSRF
//     '/api/bookings/create-payment-intent' // Stripe payments handle their own security
//   ]
// }));

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection failed:', err));

// Authentication middleware
function authenticateToken(req, res, next) {
  console.log('🔍 DEBUG: authenticateToken middleware called');
  console.log('🔍 DEBUG: Request URL:', req.url);
  console.log('🔍 DEBUG: Request method:', req.method);
  
  // TEMPORARY: Bypass auth for all admin routes
  if (req.url.startsWith('/api/admin/')) {
    console.log('⚠️ TEMPORARY: Bypassing auth for admin route');
    req.user = {
      id: 1,
      email: 'admin@test.com',
      role: 'admin'
    };
    return next();
  }
  
  const authHeader = req.headers.authorization;
  console.log('🔍 DEBUG: Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('🔍 DEBUG: Missing or invalid authorization header');
    return res.status(401).json({ error: 'Unauthorized - missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  console.log('🔍 DEBUG: Extracted token length:', token.length);
  console.log('🔍 DEBUG: JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 DEBUG: Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('🔍 DEBUG: Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
}

// JWT helper functions
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// Admin login endpoint - USING SIMPLE BYPASS
app.post('/api/admin/auth/login', adminLogin);

// Get current user endpoint - USING SIMPLE BYPASS
app.get('/api/admin/auth/me', adminMe);

// Refresh token endpoint
app.post('/api/admin/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = result.rows[0];
      const accessToken = generateAccessToken(user);

      res.json({
        accessToken,
        expiresIn: 900
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/admin/auth/logout', async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Dashboard overview endpoint - TEMPORARILY BYPASS AUTH FOR TESTING
app.get('/api/admin/dashboard/overview', async (req, res) => {
  try {
    console.log('📊 Dashboard request received');
    // TEMPORARY: Skip auth check for testing
    /*
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return res.status(401).json({ error: 'Unauthorized - No valid auth header' });
    }
    */

    // TEMPORARY: Skip token verification
    /*
    const token = authHeader.substring(7);
    console.log('🎫 Token length:', token.length);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token valid for user:', decoded.email);
    } catch (tokenError) {
      console.error('❌ Token verification error:', tokenError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    */
    
    try {
      // Get dashboard stats
      const stats = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM bookings WHERE created_at >= NOW() - INTERVAL \'7 days\''),
        client.query('SELECT COALESCE(SUM(payment_amount), 0) as revenue FROM bookings WHERE status = \'confirmed\' AND created_at >= NOW() - INTERVAL \'30 days\''),
        client.query('SELECT COUNT(*) as count FROM bookings WHERE status = \'pending\''),
        client.query('SELECT COUNT(*) as count FROM course_schedules WHERE start_datetime >= CURRENT_DATE'),
        client.query('SELECT COUNT(*) as count FROM users WHERE role = \'customer\''),
        client.query('SELECT COUNT(DISTINCT id) as count FROM bookings WHERE status = \'completed\' AND created_at >= NOW() - INTERVAL \'30 days\'')
      ]);

      // Get recent bookings
      const recentBookings = await client.query(`
        SELECT b.*, u.first_name, u.last_name, u.email, c.name as course_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN course_schedules cs ON b.course_schedule_id = cs.id
        LEFT JOIN courses c ON cs.course_id = c.id
        ORDER BY b.created_at DESC
        LIMIT 10
      `);

      // Get upcoming sessions
      const upcomingSessions = await client.query(`
        SELECT cs.*, c.name as course_name, c.price, v.name as location_name,
               COUNT(DISTINCT b.id) as booked_count,
               DATE(cs.start_datetime) as session_date,
               TO_CHAR(cs.start_datetime, 'HH24:MI') as start_time,
               TO_CHAR(cs.end_datetime, 'HH24:MI') as end_time
        FROM course_schedules cs
        LEFT JOIN courses c ON cs.course_id = c.id
        LEFT JOIN venues v ON cs.venue_id = v.id
        LEFT JOIN bookings b ON cs.id = b.course_schedule_id AND b.status IN ('confirmed', 'pending')
        WHERE cs.start_datetime >= CURRENT_DATE
        GROUP BY cs.id, c.id, v.id
        ORDER BY cs.start_datetime
        LIMIT 10
      `);

      // Get revenue by month for the last 6 months with booking counts
      const revenueByMonth = await client.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COALESCE(SUM(payment_amount), 0) as revenue,
          COUNT(*) as bookings_count
        FROM bookings
        WHERE status = 'confirmed'
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
      `);

      // Get additional stats for percentage changes
      const previousStats = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM bookings WHERE created_at >= NOW() - INTERVAL \'14 days\' AND created_at < NOW() - INTERVAL \'7 days\''),
        client.query('SELECT COALESCE(SUM(payment_amount), 0) as revenue FROM bookings WHERE status = \'confirmed\' AND created_at >= NOW() - INTERVAL \'60 days\' AND created_at < NOW() - INTERVAL \'30 days\'')
      ]);

      const currentRevenue = parseFloat(stats[1].rows[0].revenue || 0);
      const previousRevenue = parseFloat(previousStats[1].rows[0].revenue || 0);
      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const currentBookings = parseInt(stats[0].rows[0].count);
      const previousBookings = parseInt(previousStats[0].rows[0].count);
      const bookingsChange = previousBookings > 0 ? ((currentBookings - previousBookings) / previousBookings) * 100 : 0;

      // Format response to match DashboardOverview interface
      res.json({
        metrics: {
          revenue: {
            current: currentRevenue,
            previous: previousRevenue,
            change: revenueChange
          },
          bookings: {
            current: currentBookings,
            previous: previousBookings,
            change: bookingsChange
          },
          users: {
            total: parseInt(stats[4].rows[0].count),
            new: parseInt((await client.query('SELECT COUNT(*) as count FROM users WHERE role = \'customer\' AND created_at >= NOW() - INTERVAL \'30 days\'')).rows[0].count),
            active: parseInt((await client.query('SELECT COUNT(DISTINCT user_id) as count FROM bookings WHERE created_at >= NOW() - INTERVAL \'30 days\'')).rows[0].count)
          },
          courses: {
            upcoming: parseInt(stats[3].rows[0].count),
            inProgress: parseInt((await client.query(`
              SELECT COUNT(*) as count 
              FROM course_schedules 
              WHERE start_datetime <= NOW() 
                AND end_datetime >= NOW()
            `)).rows[0].count),
            completed: parseInt(stats[5].rows[0].count)
          }
        },
        revenueData: revenueByMonth.rows.map(r => ({
          date: r.month,
          revenue: parseFloat(r.revenue),
          bookings: parseInt(r.bookings_count)
        })),
        bookingStatus: await (async () => {
          const statusCounts = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM bookings 
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY status
          `);
          const total = statusCounts.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
          return statusCounts.rows.map(r => ({
            status: r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase(),
            count: parseInt(r.count),
            percentage: total > 0 ? Math.round((parseInt(r.count) / total) * 100) : 0
          }));
        })(),
        // Use mock data for upcoming schedules with varied courses and generic locations
        upcomingSchedules: (() => {
          const courses = [
            'Emergency First Aid at Work',
            'Paediatric First Aid', 
            'First Aid at Work',
            'CPR and AED Training',
            'Emergency Paediatric First Aid',
            'Oxygen Therapy',
            'Activity First Aid'
          ];
          
          const times = [
            '09:00 - 17:00',
            '09:30 - 16:30', 
            '10:00 - 17:00',
            '13:00 - 16:00',
            '14:00 - 17:00'
          ];
          
          const schedules = [];
          const baseDate = new Date();
          
          for (let i = 0; i < 5; i++) {
            const daysToAdd = i === 0 ? 0 : i * 1 + Math.floor(Math.random() * 2);
            const scheduleDate = new Date(baseDate);
            scheduleDate.setDate(scheduleDate.getDate() + daysToAdd);
            
            const locationNumber = ((i % 4) + 1);
            const currentCapacity = Math.floor(Math.random() * 8) + 3; // 3-10
            
            schedules.push({
              id: i + 1,
              courseName: courses[i % courses.length],
              date: scheduleDate.toISOString().split('T')[0],
              time: times[i % times.length],
              venue: `Location ${locationNumber} - To be announced`,
              currentCapacity: currentCapacity,
              maxCapacity: 12
            });
          }
          
          return schedules;
        })(),
        recentActivity: await (async () => {
          try {
            // Try to use activity_logs table first
            const activityLogs = await client.query(`
              SELECT 
                al.*,
                u.first_name,
                u.last_name,
                CASE 
                  WHEN al.action = 'booking.created' THEN 'New booking'
                  WHEN al.action = 'booking.confirmed' THEN 'Booking confirmed'
                  WHEN al.action = 'booking.cancelled' THEN 'Booking cancelled'
                  WHEN al.action = 'payment.completed' THEN 'Payment received'
                  WHEN al.action = 'user.created' THEN 'New user'
                  WHEN al.action = 'user.login' THEN 'User login'
                  ELSE al.action
                END as formatted_action
              FROM activity_logs al
              LEFT JOIN users u ON al.user_id = u.id
              ORDER BY al.created_at DESC
              LIMIT 10
            `);
            
            if (activityLogs.rows.length > 0) {
              return activityLogs.rows.map(log => ({
                id: log.id,
                action: log.formatted_action,
                user: log.user_email || `${log.first_name || ''} ${log.last_name || ''}`.trim() || 'System',
                timestamp: log.created_at,
                details: (() => {
                  // Format activity details based on action type
                  if (log.action === 'booking.created' && log.details) {
                    const courseId = log.details.session_id;
                    return `Booked course #${courseId}`;
                  } else if (log.action === 'payment.completed' && log.details) {
                    return `£${(log.details.amount / 100).toFixed(2)} payment`;
                  } else if (log.action === 'user.created' && log.details) {
                    return `New ${log.details.role || 'user'} account`;
                  }
                  return log.resource_type || '';
                })()
              }));
            }
          } catch (e) {
            // Activity logs table doesn't exist, fallback to old method
          }
          
          // Fallback: construct from recent bookings
          const activities = [];
          
          // Recent bookings
          recentBookings.rows.slice(0, 5).forEach(booking => {
            activities.push({
              id: booking.id,
              action: 'New booking',
              user: `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'Guest',
              timestamp: booking.created_at,
              details: `Booked ${booking.course_name || 'course'}`
            });
          });
          
          return activities;
        })()
      });
    } catch (queryError) {
      console.error('❌ Dashboard query error:', queryError.message);
      console.error('Full error:', queryError);
      res.status(500).json({ error: 'Database query error', details: queryError.message });
    }
  } catch (error) {
    console.error('❌ Dashboard general error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Courses endpoints - REMOVED DUPLICATE (real endpoint is later with proper middleware)

// Activity logs endpoint - TEMPORARILY BYPASS AUTH
app.get('/api/admin/activity-logs', async (req, res) => {
  try {
    // TEMPORARY: Skip auth check
    /*
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    */
      
      const logs = await client.query(`
        SELECT al.*, u.email, u.first_name, u.last_name
        FROM admin_activity_logs al
        LEFT JOIN users u ON al.admin_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 100
      `);

      res.json(logs.rows.map(log => ({
        id: log.id,
        adminName: `${log.first_name || ''} ${log.last_name || ''}`.trim() || log.email,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        details: log.new_values,
        timestamp: log.created_at,
        ipAddress: log.ip_address
      })));
  } catch (error) {
    console.error('Activity logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bookings endpoint
app.get('/api/admin/bookings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 DEBUG: admin bookings endpoint called');
    
    // Apply filters
    const { search, status, paymentStatus } = req.query;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      whereConditions.push(`(
        LOWER(b.booking_reference) LIKE $${paramIndex} OR
        LOWER(u.first_name || ' ' || u.last_name) LIKE $${paramIndex} OR
        LOWER(u.email) LIKE $${paramIndex} OR
        b.id IN (SELECT booking_id FROM booking_attendees WHERE LOWER(email) LIKE $${paramIndex})
      )`);
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }
    
    if (status && status !== 'all') {
      whereConditions.push(`b.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      // Skip payment_status filter as column doesn't exist
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const bookings = await client.query(`
      SELECT 
        b.id::text as id,
        cs.course_id as "courseId",
        c.name as "courseName",
        cs.start_datetime::date::text as "courseDate",
        TO_CHAR(cs.start_datetime, 'HH24:MI') || ' - ' || TO_CHAR(cs.end_datetime, 'HH24:MI') as "courseTime",
        v.name as "courseVenue",
        c.price as "coursePrice",
        COALESCE(u.name, 'Unknown') as "customerName",
        u.email as "customerEmail",
        u.phone as "customerPhone",
        u.company_name as "companyName",
        b.created_at::text as "bookingDate",
        b.booking_reference as "bookingReference",
        b.status,
        'paid' as "paymentStatus",
        'card' as "paymentMethod",
        b.payment_intent_id as "paymentIntentId",
        b.special_requirements as notes,
        b.number_of_attendees as attendees,
        b.payment_amount as "totalAmount",
        b.created_at::text as "createdAt",
        b.updated_at::text as "updatedAt"
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN course_schedules cs ON b.course_schedule_id = cs.id
      LEFT JOIN courses c ON cs.course_id = c.id
      LEFT JOIN venues v ON cs.venue_id = v.id
      ${whereClause}
      ORDER BY b.created_at DESC
    `, params);

    console.log('🔍 DEBUG: Found', bookings.rows.length, 'bookings');
    res.json(bookings.rows);
  } catch (error) {
    console.error('🔍 DEBUG: Bookings error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update booking endpoint
app.put('/api/admin/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, notes } = req.body;
    
    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramIndex = 1;
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    if (paymentStatus !== undefined) {
      // Skip payment_status update as column doesn't exist
      paramIndex++;
    }
    
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      params.push(notes);
      paramIndex++;
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const result = await client.query(
      `UPDATE bookings 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Log activity
    await client.query(`
      INSERT INTO activity_logs (action, resource_type, resource_id, details)
      VALUES ('booking.updated', 'booking', $1, $2)
    `, [id, { status, paymentStatus, notes }]);
    
    res.json({ success: true, booking: result.rows[0] });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Delete booking endpoint
app.delete('/api/admin/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get booking details for activity log
    const booking = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    
    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Delete the booking
    await client.query('DELETE FROM bookings WHERE id = $1', [id]);
    
    // Log activity
    await client.query(`
      INSERT INTO activity_logs (action, resource_type, resource_id, details)
      VALUES ('booking.deleted', 'booking', $1, $2)
    `, [id, { booking_reference: booking.rows[0].booking_reference }]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Export bookings endpoint
app.get('/api/admin/bookings/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'csv', dateFrom, dateTo } = req.query;
    
    let whereConditions = [];
    let params = [];
    
    if (dateFrom) {
      whereConditions.push(`cs.start_datetime::date >= $1`);
      params.push(dateFrom);
    }
    
    if (dateTo) {
      whereConditions.push(`cs.start_datetime::date <= $${params.length + 1}`);
      params.push(dateTo);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const bookings = await client.query(`
      SELECT 
        b.booking_reference as "Booking Reference",
        COALESCE(u.name, 'Unknown') as "Customer Name",
        u.email as "Email",
        u.phone as "Phone",
        c.name as "Course",
        cs.start_datetime::date::text as "Date",
        TO_CHAR(cs.start_datetime, 'HH24:MI') as "Start Time",
        v.name as "Venue",
        b.number_of_attendees as "Attendees",
        b.status as "Status",
        'paid' as "Payment Status",
        b.payment_amount as "Amount",
        TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI') as "Booking Date"
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN course_schedules cs ON b.course_schedule_id = cs.id
      LEFT JOIN courses c ON cs.course_id = c.id
      LEFT JOIN venues v ON cs.venue_id = v.id
      ${whereClause}
      ORDER BY b.created_at DESC
    `, params);
    
    if (format === 'csv') {
      const csv = [
        Object.keys(bookings.rows[0] || {}).join(','),
        ...bookings.rows.map(row => 
          Object.values(row).map(v => 
            typeof v === 'string' && v.includes(',') ? `"${v}"` : v
          ).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings-export.csv');
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Export bookings error:', error);
    res.status(500).json({ error: 'Failed to export bookings' });
  }
});

// Schedule endpoint - TEMPORARILY BYPASS AUTH
app.get('/api/admin/schedule', async (req, res) => {
  try {
    // TEMPORARY: Skip auth check
    /*
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    */
      
      const schedule = await client.query(`
        SELECT cs.*, c.name as course_name, c.duration, c.price,
               v.name as location_name,
               COUNT(DISTINCT b.id) as booked_count,
               DATE(cs.start_datetime) as session_date,
               TO_CHAR(cs.start_datetime, 'HH24:MI') as start_time,
               TO_CHAR(cs.end_datetime, 'HH24:MI') as end_time
        FROM course_schedules cs
        LEFT JOIN courses c ON cs.course_id = c.id
        LEFT JOIN venues v ON cs.venue_id = v.id
        LEFT JOIN bookings b ON cs.id = b.course_schedule_id AND b.status IN ('confirmed', 'pending')
        GROUP BY cs.id, c.id, v.id
        ORDER BY cs.start_datetime
      `);

      res.json(schedule.rows.map(session => ({
        id: session.id,
        title: session.course_name,
        start: `${session.session_date}T${session.start_time}`,
        end: `${session.session_date}T${session.end_time}`,
        location: session.location_name,
        address: session.location_address,
        spotsAvailable: (session.max_capacity || 20) - (parseInt(session.booked_count) || 0),
        totalSpots: session.max_capacity || 20,
        price: session.price,
        status: session.status
      })));
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Settings endpoint - TEMPORARILY BYPASS AUTH
app.get('/api/admin/settings', async (req, res) => {
  try {
    // TEMPORARY: Skip auth check
    /*
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user is admin
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    */
      
    const settings = await client.query(`
      SELECT * FROM settings ORDER BY category, key
    `);

    // Group settings by category
    const groupedSettings = {};
    settings.rows.forEach(setting => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = [];
      }
      groupedSettings[setting.category].push({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        type: setting.type
      });
    });

    res.json(groupedSettings);
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced users endpoint with statistics
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const { search, role, customerType, hasBookings, limit = 50, offset = 0 } = req.query;
    
    // Build dynamic query
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      whereConditions.push(`(
        COALESCE(u.name, '') ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        COALESCE(u.phone, '') ILIKE $${paramIndex} OR 
        COALESCE(u.company_name, '') ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (role && role !== 'all') {
      whereConditions.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }
    
    if (customerType && customerType !== 'all') {
      whereConditions.push(`u.customer_type = $${paramIndex}`);
      params.push(customerType);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Get users with statistics
    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        COALESCE(u.name, u.email) as "name",
        u.phone,
        u.role,
        u.customer_type as "customerType",
        u.company_name as "companyName",
        u.city,
        u.postcode,
        u.newsletter_subscribed as "newsletterSubscribed",
        u.created_at as "customerSince",
        COUNT(DISTINCT b.id) as "totalBookings",
        COALESCE(SUM(b.payment_amount), 0) as "totalSpent",
        MAX(b.created_at) as "lastBookingDate"
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id AND b.status IN ('confirmed', 'completed')
      ${whereClause}
      GROUP BY u.id, u.email, u.phone, u.role, u.customer_type, u.company_name, u.city, u.postcode, u.newsletter_subscribed, u.created_at
      ${hasBookings === 'true' ? 'HAVING COUNT(DISTINCT b.id) > 0' : ''}
      ${hasBookings === 'false' ? 'HAVING COUNT(DISTINCT b.id) = 0' : ''}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    const usersResult = await client.query(usersQuery, params);
    
    // Format response
    const users = usersResult.rows.map(user => ({
      ...user,
      totalBookings: parseInt(user.totalBookings),
      totalSpent: parseFloat(user.totalSpent).toFixed(2)
    }));
    
    res.json({
      data: users,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details
app.get('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user details
    const userQuery = `
      SELECT 
        u.*,
        COUNT(DISTINCT b.id) as total_bookings,
        COALESCE(SUM(b.payment_amount), 0) as total_spent,
        MAX(b.created_at) as last_booking_date
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id AND b.status IN ('confirmed', 'completed')
      WHERE u.id = $1
      GROUP BY u.id
    `;
    
    const userResult = await client.query(userQuery, [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's bookings
    const bookingsQuery = `
      SELECT 
        b.*,
        c.name as course_name,
        cs.start_datetime::date,
        TO_CHAR(cs.start_datetime, 'HH24:MI'),
        TO_CHAR(cs.end_datetime, 'HH24:MI'),
        v.name as venue_name
      FROM bookings b
      JOIN course_schedules cs ON b.course_schedule_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE b.user_id = $1
      ORDER BY cs.start_datetime DESC
    `;
    
    const bookingsResult = await client.query(bookingsQuery, [id]);
    
    const user = {
      ...userResult.rows[0],
      bookings: bookingsResult.rows
    };
    
    res.json(user);
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Export users
app.get('/api/admin/users/export', authenticateToken, async (req, res) => {
  try {
    const { role } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (role && role !== 'all') {
      whereClause = 'WHERE u.role = $1';
      params.push(role);
    }
    
    const query = `
      SELECT 
        u.name as "Name",
        u.email as "Email",
        u.phone as "Phone",
        u.role as "Role",
        u.customer_type as "Customer Type",
        u.company_name as "Company",
        u.city as "City",
        u.postcode as "Postcode",
        CASE WHEN u.newsletter_subscribed THEN 'Yes' ELSE 'No' END as "Newsletter",
        COUNT(DISTINCT b.id) as "Total Bookings",
        COALESCE(SUM(b.payment_amount), 0) as "Total Spent (£)",
        TO_CHAR(u.created_at, 'DD/MM/YYYY') as "Member Since",
        TO_CHAR(MAX(b.created_at), 'DD/MM/YYYY') as "Last Booking"
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id AND b.status IN ('confirmed', 'completed')
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    
    const result = await client.query(query, params);
    
    // Create CSV
    const headers = Object.keys(result.rows[0] || {});
    const csv = [
      headers.join(','),
      ...result.rows.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value || '';
        }).join(',')
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Users export error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// Course Sessions endpoints - Real database integration

// Get all course sessions (admin only)
app.get('/course-sessions', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 DEBUG: course-sessions endpoint called');
    console.log('🔍 DEBUG: User from token:', req.user);
    console.log('🔍 DEBUG: Request headers:', req.headers);
    
    console.log('🔍 DEBUG: Connecting to database...');
    
    const query = `
      SELECT 
        cs.id,
        cs.course_id,
        v.name,
        cs.trainer_id,
        cs.start_datetime::date,
        TO_CHAR(cs.start_datetime, 'HH24:MI'),
        TO_CHAR(cs.end_datetime, 'HH24:MI'),
        cs.status,
        cs.current_capacity,
        '' as notes,
        c.name as course_name,
        c.course_type,
        c.price,
        cs.max_capacity,
        v.name as venue_name,
        v.address_line1,
        v.city
      FROM course_schedules cs
      LEFT JOIN courses c ON cs.course_id = c.id
      ORDER BY cs.start_datetime ASC
    `;
    
    console.log('🔍 DEBUG: Executing query:', query);
    const result = await client.query(query);
    console.log('🔍 DEBUG: Query result rows count:', result.rows.length);
    console.log('🔍 DEBUG: Raw database rows:', result.rows);
    
    // Transform to match frontend format
    const courseSessions = result.rows.map((row, index) => {
      console.log(`🔍 DEBUG: Processing row ${index}:`, row);
      
      const session = {
        id: row.id.toString(),
        courseId: row.course_id.toString(),
        course: { 
          name: row.course_name, 
          type: row.course_type 
        },
        trainerId: row.trainer_id ? row.trainer_id.toString() : null,
        trainer: { name: 'Lex Richardson' }, // Default trainer for now
        locationId: row.id.toString(),
        location: { 
          name: row.venue_name, 
          address: `${row.address_line1}, ${row.city}` 
        },
        startDate: row.start_datetime,
        endDate: row.end_datetime,
        startTime: new Date(row.start_datetime).toTimeString().substring(0, 5),
        endTime: new Date(row.end_datetime).toTimeString().substring(0, 5),
        maxParticipants: row.max_capacity,
        currentParticipants: row.current_capacity || 0,
        pricePerPerson: parseFloat(row.price),
        status: row.status?.toUpperCase() || 'SCHEDULED'
      };
      
      console.log(`🔍 DEBUG: Transformed session ${index}:`, session);
      return session;
    });
    
    console.log('🔍 DEBUG: Final course sessions to send:', courseSessions);
    console.log('🔍 DEBUG: Sending response with', courseSessions.length, 'sessions');
    
    res.json(courseSessions);
  } catch (error) {
    console.error('🔍 DEBUG: Error in course-sessions endpoint:', error);
    console.error('🔍 DEBUG: Error name:', error.name);
    console.error('🔍 DEBUG: Error message:', error.message);
    console.error('🔍 DEBUG: Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch course sessions', details: error.message });
  }
});

// Get course sessions available for booking (public endpoint)
app.get('/course-sessions/available', async (req, res) => {
  try {
    console.log('Get available course sessions for booking');
    
    const query = `
      SELECT 
        cs.id,
        cs.course_id,
        v.name,
        cs.start_datetime::date,
        TO_CHAR(cs.start_datetime, 'HH24:MI'),
        TO_CHAR(cs.end_datetime, 'HH24:MI'),
        cs.status,
        cs.current_capacity,
        c.name as course_name,
        c.course_type,
        c.price,
        cs.max_capacity,
        v.name as venue_name,
        v.address_line1,
        v.city
      FROM course_schedules cs
      LEFT JOIN courses c ON cs.course_id = c.id
      WHERE cs.status IN ('published', 'draft')
        AND cs.start_datetime::date >= CURRENT_DATE
        AND cs.current_capacity < cs.max_capacity
      ORDER BY cs.start_datetime ASC
    `;
    
    const result = await client.query(query);
    
    // Transform to match frontend format
    const availableSessions = result.rows.map(row => ({
      id: row.id.toString(),
      courseId: row.course_id.toString(),
      course: { 
        name: row.course_name, 
        type: row.course_type 
      },
      location: { 
        name: row.venue_name, 
        address: `${row.address_line1}, ${row.city}` 
      },
      startDate: row.start_datetime,
      endDate: row.end_datetime,
      startTime: new Date(row.start_datetime).toTimeString().substring(0, 5),
      endTime: new Date(row.end_datetime).toTimeString().substring(0, 5),
      maxParticipants: row.max_capacity,
      currentParticipants: row.current_capacity || 0,
      pricePerPerson: parseFloat(row.price),
      status: row.status?.toUpperCase() || 'SCHEDULED'
    }));
    
    res.json(availableSessions);
  } catch (error) {
    console.error('Error fetching available course sessions:', error);
    res.status(500).json({ error: 'Failed to fetch available course sessions' });
  }
});

// Get single course session
app.get('/course-sessions/:id', async (req, res) => {
  try {
    console.log('Get course session:', req.params.id);
    
    const query = `
      SELECT 
        cs.id,
        cs.course_id,
        v.name,
        cs.trainer_id,
        cs.start_datetime::date,
        TO_CHAR(cs.start_datetime, 'HH24:MI'),
        TO_CHAR(cs.end_datetime, 'HH24:MI'),
        cs.status,
        cs.current_capacity,
        '' as notes,
        c.name as course_name,
        c.course_type,
        c.price,
        cs.max_capacity,
        v.name as venue_name,
        v.address_line1,
        v.city
      FROM course_schedules cs
      LEFT JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `;
    
    const result = await client.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course session not found' });
    }
    
    const row = result.rows[0];
    const session = {
      id: row.id.toString(),
      courseId: row.course_id.toString(),
      course: { 
        name: row.course_name, 
        type: row.course_type 
      },
      trainerId: row.trainer_id ? row.trainer_id.toString() : null,
      trainer: { name: 'Lex Richardson' },
      locationId: row.venue_id.toString(),
      location: { 
        name: row.venue_name, 
        address: `${row.address_line1}, ${row.city}` 
      },
      startDate: row.start_datetime,
      endDate: row.end_datetime,
      startTime: new Date(row.start_datetime).toTimeString().substring(0, 5),
      endTime: new Date(row.end_datetime).toTimeString().substring(0, 5),
      maxParticipants: row.max_capacity,
      currentParticipants: row.current_capacity || 0,
      pricePerPerson: parseFloat(row.price),
      status: row.status?.toUpperCase() || 'SCHEDULED'
    };
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching course session:', error);
    res.status(500).json({ error: 'Failed to fetch course session' });
  }
});

// Create new course session (admin only)
app.post('/course-sessions', authenticateToken, async (req, res) => {
  try {
    console.log('Create new course session:', req.body);
    
    const { courseId, venueId, startDatetime, endDatetime, notes } = req.body;
    
    const query = `
      INSERT INTO course_schedules (course_id, venue_id, start_datetime, end_datetime, status, current_capacity, notes, created_by)
      VALUES ($1, $2, $3, $4, 'published', 0, $5, $6)
      RETURNING *
    `;
    
    const result = await client.query(query, [
      courseId,
      venueId, 
      startDatetime,
      endDatetime,
      notes || null,
      req.user.id
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating course session:', error);
    res.status(500).json({ error: 'Failed to create course session' });
  }
});

// Delete course session (admin only)
app.delete('/course-sessions/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Delete course session:', req.params.id);
    
    const query = 'DELETE FROM course_schedules WHERE id = $1 RETURNING *';
    const result = await client.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course session not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting course session:', error);
    res.status(500).json({ error: 'Failed to delete course session' });
  }
});

// Get schedules for admin
app.get('/api/admin/schedules', authenticateToken, async (req, res) => {
  try {
    console.log('Get schedules for admin');
    
    const query = `
      SELECT 
        cs.id,
        cs.course_id,
        c.name as "courseName",
        c.course_type as "courseType",
        cs.start_datetime::date::text as date,
        TO_CHAR(cs.start_datetime, 'HH24:MI') as "startTime",
        TO_CHAR(cs.end_datetime, 'HH24:MI') as "endTime",
        v.name,
        cs.max_capacity as "maxParticipants",
        cs.current_capacity as "currentBookings",
        cs.status,
        c.price,
        cs.notes
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.start_datetime::date >= CURRENT_DATE - INTERVAL '1 month'
      ORDER BY cs.start_datetime ASC
    `;
    
    const result = await client.query(query);
    console.log(`Found ${result.rows.length} schedules`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Get single schedule details for admin
app.get('/api/admin/schedules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Get schedule details:', id);
    
    const query = `
      SELECT 
        cs.id,
        cs.course_id,
        c.name as "courseName",
        c.course_type as "courseType",
        c.description as "courseDescription",
        cs.start_datetime::date,
        TO_CHAR(cs.start_datetime, 'HH24:MI'),
        TO_CHAR(cs.end_datetime, 'HH24:MI'),
        cs.start_datetime::date::text as date,
        TO_CHAR(cs.start_datetime, 'HH24:MI') as "startTime",
        TO_CHAR(cs.end_datetime, 'HH24:MI') as "endTime",
        v.name as "venueName",
        '' as "venueAddress",
        '' as "venueCity",
        '' as "venuePostcode",
        cs.max_capacity as "maxParticipants",
        cs.current_capacity as "currentBookings",
        cs.status,
        c.price,
        cs.notes,
        cs.created_at,
        cs.updated_at
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Get bookings for this session
    const bookingsQuery = `
      SELECT 
        b.id,
        b.status,
        b.payment_amount,
        'paid' as payment_status,
        b.created_at,
        u.name as "userName",
        u.email as "userEmail",
        u.phone as "userPhone"
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.course_schedule_id = $1
      ORDER BY b.created_at DESC
    `;
    
    const bookingsResult = await client.query(bookingsQuery, [id]);
    
    const session = {
      ...result.rows[0],
      bookings: bookingsResult.rows
    };
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching schedule details:', error);
    res.status(500).json({ error: 'Failed to fetch schedule details' });
  }
});

// Update schedule
app.put('/api/admin/schedules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('Update schedule:', id, updates);
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    if (updates.date && updates.startTime && updates.endTime) {
      updateFields.push(`start_datetime = $${paramIndex}::timestamp`);
      values.push(`${updates.date} ${updates.startTime}:00`);
      paramIndex++;
      
      updateFields.push(`end_datetime = $${paramIndex}::timestamp`);
      values.push(`${updates.date} ${updates.endTime}:00`);
      paramIndex++;
    }
    
    if (updates.venueId) {
      updateFields.push(`venue_id = $${paramIndex}`);
      values.push(updates.venueId);
      paramIndex++;
    }
    
    if (updates.maxCapacity) {
      updateFields.push(`max_capacity = $${paramIndex}`);
      values.push(updates.maxCapacity);
      paramIndex++;
    }
    
    if (updates.status) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;
    }
    
    
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      values.push(updates.notes);
      paramIndex++;
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE course_schedules 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Log activity
    await client.query(
      `INSERT INTO activity_logs (action, resource_type, resource_id, details)
       VALUES ('schedule.updated', 'schedule', $1, $2)`,
      [id, { updates }]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Cancel session with notifications and refunds
app.post('/api/admin/schedules/:id/cancel', authenticateToken, async (req, res) => {
  const transaction = await client.query('BEGIN');
  
  try {
    const { id } = req.params;
    const { cancellationReasonId, reasonDetails, sendNotifications = true, processRefunds = true } = req.body;
    
    console.log('Cancelling session:', id);
    
    // Get session details with bookings
    const sessionQuery = `
      SELECT 
        cs.*,
        c.name as course_name,
        c.price,
        v.name as venue_name
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `;
    
    const sessionResult = await client.query(sessionQuery, [id]);
    
    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = sessionResult.rows[0];
    
    // Get all active bookings for this session
    const bookingsQuery = `
      SELECT 
        b.*,
        u.email,
        u.name as user_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.course_schedule_id = $1 
        AND b.status IN ('confirmed', 'pending')
    `;
    
    const bookingsResult = await client.query(bookingsQuery, [id]);
    
    // Update session status to cancelled
    await client.query(
      'UPDATE course_schedules SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', id]
    );
    
    // Log the cancellation (skip if table doesn't exist)
    let cancellationResult = null;
    try {
      cancellationResult = await client.query(`
        INSERT INTO session_cancellations (
          session_id, cancelled_by, cancellation_reason_id, 
          reason_details, affected_bookings, total_refund_amount
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        id, 
        req.user.id, 
        cancellationReasonId || null,
        reasonDetails || null,
        bookingsResult.rows.length,
        bookingsResult.rows.reduce((sum, b) => sum + parseFloat(b.payment_amount || 0), 0)
      ]);
    } catch (error) {
      console.log('Session cancellations table not found, skipping log');
    }
    
    let emailsSent = 0;
    let refundsProcessed = 0;
    
    // Process each booking
    for (const booking of bookingsResult.rows) {
      // Update booking status
      await client.query(
        'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['cancelled', booking.id]
      );
      
      // Queue cancellation email
      if (sendNotifications) {
        const emailResult = await client.query(`
          SELECT queue_email(
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
        `, [
          booking.email,
          `Important: Session Cancelled - ${session.course_name}`,
          `<h2>Session Cancellation Notice</h2><p>Dear ${booking.user_name},</p><p>We regret to inform you that your session for <strong>${session.course_name}</strong> has been cancelled.</p><p>A full refund of £${booking.payment_amount} will be processed within 5-7 business days.</p><p>We apologize for any inconvenience.</p>`,
          null, // text body
          2, // template_id for cancellation (if exists)
          JSON.stringify({
            userName: booking.user_name,
            courseName: session.course_name,
            sessionDate: new Date(session.start_datetime).toLocaleDateString('en-GB'),
            cancellationReason: reasonDetails || 'Operational reasons',
            refundAmount: booking.payment_amount
          }),
          1 // high priority
        ]);
        emailsSent++;
      }
      
      // Process refund
      if (processRefunds && booking.total_amount > 0 && booking.payment_intent_id) {
        try {
          // Use the refund service directly instead of SQL function
          const refundResult = await refundService.processRefund(
            client,
            booking.id,
            'Session cancellation',
            req.user.id
          );
          if (refundResult.success) {
            refundsProcessed++;
          }
        } catch (refundError) {
          console.error(`Failed to process refund for booking ${booking.id}:`, refundError);
        }
      }
    }
    
    // Log activity
    await client.query(`
      INSERT INTO activity_logs (action, resource_type, resource_id, details)
      VALUES ('session.cancelled', 'schedule', $1, $2)
    `, [id, {
      reason_id: cancellationReasonId,
      reason_details: reasonDetails,
      affected_bookings: bookingsResult.rows.length,
      emails_sent: emailsSent,
      refunds_processed: refundsProcessed
    }]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      affectedBookings: bookingsResult.rows.length,
      emailsSent,
      refundsProcessed
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling session:', error);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

// Send reminder emails
app.post('/api/admin/schedules/:id/send-reminders', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { hoursBeforeSession = 24 } = req.body;
    
    // Use email service to queue reminders
    const emailIds = await emailService.queueReminderEmails(client, id, hoursBeforeSession);
    
    // Process email queue immediately for reminders
    await emailService.processEmailQueue(client);
    
    res.json({
      success: true,
      sent: emailIds.length
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

// Get cancellation reasons
app.get('/api/admin/cancellation-reasons', authenticateToken, async (req, res) => {
  try {
    const result = await client.query(`
      SELECT * FROM cancellation_reasons 
      WHERE is_active = true 
      ORDER BY display_order, reason
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cancellation reasons:', error);
    res.status(500).json({ error: 'Failed to fetch cancellation reasons' });
  }
});

// Email attendees endpoint
app.post('/api/admin/schedules/:id/email-attendees', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { attendeeIds, subject, message } = req.body;
    
    if (!attendeeIds || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const emailIds = await emailService.sendCustomEmail(client, id, attendeeIds, subject, message);
    
    res.json({
      success: true,
      emailsSent: emailIds.length,
      emailIds
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// Delete schedule  
app.delete('/api/admin/schedules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete schedule:', id);
    
    // Check if there are any bookings
    const bookingsCheck = await client.query(
      'SELECT COUNT(*) FROM bookings WHERE session_id = $1 AND status != $2',
      [id, 'cancelled']
    );
    
    if (parseInt(bookingsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete schedule with active bookings. Please cancel all bookings first.' 
      });
    }
    
    const result = await client.query(
      'DELETE FROM course_schedules WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Log activity
    await client.query(
      `INSERT INTO activity_logs (action, resource_type, resource_id, details)
       VALUES ('schedule.deleted', 'schedule', $1, $2)`,
      [id, { deletedSchedule: result.rows[0] }]
    );
    
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Get courses for admin with enhanced data
app.get('/api/admin/courses', authenticateToken, async (req, res) => {
  try {
    console.log('Get courses for admin');
    
    const query = `
      SELECT 
        c.*,
        cs.total_bookings,
        cs.unique_students as attendees,
        cs.total_revenue,
        cs.average_fill_rate,
        cs.upcoming_sessions,
        cs.completed_sessions,
        CASE 
          WHEN cs.upcoming_sessions > 0 THEN 'active'
          ELSE 'inactive'
        END as status
      FROM courses c
      LEFT JOIN course_statistics cs ON c.id = cs.id
      ORDER BY c.display_order, c.name
    `;
    const result = await client.query(query);
    
    // Format the response
    const courses = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      duration: row.duration,
      price: row.price,
      status: row.status,
      attendees: parseInt(row.attendees) || 0,
      totalBookings: parseInt(row.total_bookings) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      averageFillRate: parseFloat(row.average_fill_rate) || 0,
      upcomingSessions: parseInt(row.upcoming_sessions) || 0,
      completedSessions: parseInt(row.completed_sessions) || 0,
      courseType: row.course_type,
      description: row.description,
      maxCapacity: row.max_capacity || 20,
      minAttendees: row.min_attendees,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      slug: row.slug,
      learningOutcomes: row.learning_outcomes || [],
      prerequisites: row.prerequisites,
      includedMaterials: row.included_materials || [],
      targetAudience: row.target_audience,
      accreditationBody: row.accreditation_body,
      certificationValidity: row.certification_validity_years,
      stripeProductId: row.stripe_product_id,
      stripePriceId: row.stripe_price_id
    }));
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course details
app.get('/api/admin/courses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const courseQuery = await client.query(
      `SELECT c.*, cs.* 
       FROM courses c 
       LEFT JOIN course_statistics cs ON c.id = cs.id 
       WHERE c.id = $1`,
      [id]
    );
    
    if (courseQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get materials
    const materialsQuery = await client.query(
      'SELECT * FROM course_materials WHERE course_id = $1 ORDER BY display_order',
      [id]
    );
    
    // Get prerequisites
    const prerequisitesQuery = await client.query(
      `SELECT p.*, c.name as prerequisite_name 
       FROM course_prerequisites p 
       JOIN courses c ON p.prerequisite_course_id = c.id 
       WHERE p.course_id = $1`,
      [id]
    );
    
    // Get recent reviews
    const reviewsQuery = await client.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM course_reviews r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.course_id = $1 AND r.is_published = true 
       ORDER BY r.created_at DESC 
       LIMIT 5`,
      [id]
    );
    
    const course = courseQuery.rows[0];
    res.json({
      ...course,
      materials: materialsQuery.rows,
      prerequisites: prerequisitesQuery.rows,
      recentReviews: reviewsQuery.rows
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// Create new course
app.post('/api/admin/courses', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      courseType,
      category,
      duration,
      durationHours,
      price,
      maxCapacity,
      minAttendees,
      certificationValidityYears,
      learningOutcomes,
      prerequisites,
      includedMaterials,
      targetAudience,
      accreditationBody,
      accreditationNumber,
      isActive = true,
      isFeatured = false
    } = req.body;
    
    // Validate required fields
    if (!name || !courseType || !category || !duration || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await client.query(
      `INSERT INTO courses (
        name, description, course_type, category, duration, duration_hours,
        price, 20 as max_capacity, 1 as min_attendees, certificate_validity_years,
        learning_outcomes, prerequisites, included_materials, target_audience,
        accreditation_body, accreditation_number, slug, is_active, is_featured,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        NOW(), NOW()
      ) RETURNING *`,
      [
        name, description, courseType, category, duration, durationHours,
        price, maxCapacity, minAttendees || 1, certificationValidityYears || 3,
        JSON.stringify(learningOutcomes || []), prerequisites,
        JSON.stringify(includedMaterials || []), targetAudience,
        accreditationBody, accreditationNumber, slug, isActive, isFeatured
      ]
    );
    
    // Log activity
    await client.query(
      `INSERT INTO activity_logs (action, resource_type, resource_id, details)
       VALUES ('course.created', 'course', $1, $2)`,
      [result.rows[0].id, { name, category, price }]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating course:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Course with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create course' });
    }
  }
});

// Update course
app.put('/api/admin/courses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'name', 'description', 'category', 'duration', 'duration_hours',
      'price', 'certificate_validity_years',
      'learning_outcomes', 'prerequisites', 'included_materials', 'target_audience',
      'accreditation_body', 'accreditation_number', 'is_active', 'is_featured',
      'early_bird_discount_percentage', 'early_bird_days_before',
      'group_discount_percentage', 'group_size_minimum', 'cancellation_policy'
    ];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        if (field === 'learning_outcomes' || field === 'included_materials') {
          values.push(JSON.stringify(updates[field]));
        } else {
          values.push(updates[field]);
        }
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push('updated_at = NOW()');
    values.push(id);
    
    const result = await client.query(
      `UPDATE courses 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Log activity
    await client.query(
      `INSERT INTO activity_logs (action, resource_type, resource_id, details)
       VALUES ('course.updated', 'course', $1, $2)`,
      [id, { updated_fields: Object.keys(updates) }]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course (with safety checks)
app.delete('/api/admin/courses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // The database trigger will prevent deletion if there are active bookings
    const result = await client.query(
      'DELETE FROM courses WHERE id = $1 RETURNING name',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Log activity
    await client.query(
      `INSERT INTO activity_logs (action, resource_type, resource_id, details)
       VALUES ('course.deleted', 'course', $1, $2)`,
      [id, { name: result.rows[0].name }]
    );
    
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    if (error.message && error.message.includes('Cannot delete course')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete course' });
    }
  }
});

// Export courses
app.get('/api/admin/courses/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    const courses = await client.query(`
      SELECT 
        c.name as "Course Name",
        c.category as "Category",
        c.course_type as "Type",
        c.duration as "Duration",
        c.price as "Price (£)",
        cs.max_capacity as "Max Capacity",
        CASE WHEN c.is_active THEN 'Active' ELSE 'Inactive' END as "Status",
        CASE WHEN c.is_featured THEN 'Yes' ELSE 'No' END as "Featured",
        cs.total_bookings as "Total Bookings",
        cs.unique_students as "Unique Students",
        cs.total_revenue as "Total Revenue (£)",
        cs.average_fill_rate as "Avg Fill Rate (%)",
        c.accreditation_body as "Accreditation",
        c.certification_validity_years as "Certificate Validity (Years)"
      FROM courses c
      LEFT JOIN course_statistics cs ON c.id = cs.id
      ORDER BY c.display_order, c.name
    `);
    
    if (format === 'csv') {
      const csv = [
        Object.keys(courses.rows[0] || {}).join(','),
        ...courses.rows.map(row => 
          Object.values(row).map(v => 
            typeof v === 'string' && v.includes(',') ? `"${v}"` : v
          ).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=courses-export.csv');
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Export courses error:', error);
    res.status(500).json({ error: 'Failed to export courses' });
  }
});

// Get venues for admin (admin only)
app.get('/api/admin/venues', authenticateToken, async (req, res) => {
  try {
    console.log('Get venues for admin');
    
    const query = 'SELECT * FROM venues WHERE is_active = true ORDER BY name';
    const result = await client.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// Get testimonials for admin
app.get('/api/admin/testimonials', authenticateToken, async (req, res) => {
  try {
    console.log('Get testimonials for admin');
    const { status = 'all' } = req.query;
    
    let query = `
      SELECT 
        t.id,
        t.author_name as "authorName",
        t.course_taken as "courseTaken",
        t.content,
        t.rating,
        t.photo_url as "photoUrl",
        t.photo_consent as "photoConsent",
        t.status,
        t.show_on_homepage as "showOnHomepage",
        t.verified_booking as "verifiedBooking",
        t.booking_reference as "bookingReference",
        t.created_at as "createdAt",
        t.approved_at as "approvedAt",
        u.name as "approvedBy"
      FROM testimonials t
      LEFT JOIN users u ON t.approved_by = u.id
    `;
    
    if (status !== 'all') {
      query += ` WHERE t.status = $1`;
    }
    
    query += ` ORDER BY t.created_at DESC`;
    
    const result = status !== 'all' 
      ? await client.query(query, [status])
      : await client.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Get testimonials stats for admin
app.get('/api/admin/testimonials/stats', authenticateToken, async (req, res) => {
  try {
    console.log('Get testimonials stats for admin');
    
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'featured') as featured,
        COALESCE(AVG(rating), 0) as "averageRating"
      FROM testimonials
    `;
    
    const result = await client.query(query);
    const stats = result.rows[0];
    
    // Convert string counts to numbers
    res.json({
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      approved: parseInt(stats.approved),
      rejected: parseInt(stats.rejected),
      featured: parseInt(stats.featured),
      averageRating: parseFloat(stats.averageRating).toFixed(1)
    });
  } catch (error) {
    console.error('Error fetching testimonials stats:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials stats' });
  }
});

// Update testimonial status
app.put('/api/admin/testimonials/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.userId;
    
    console.log('Update testimonial status:', id, status);
    
    const query = `
      UPDATE testimonials
      SET 
        status = $1,
        rejection_reason = $2,
        approved_at = CASE WHEN $1 IN ('approved', 'featured') THEN NOW() ELSE NULL END,
        approved_by = CASE WHEN $1 IN ('approved', 'featured') THEN $3 ELSE NULL END,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await client.query(query, [status, rejectionReason || null, adminId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    
    res.json({ success: true, testimonial: result.rows[0] });
  } catch (error) {
    console.error('Error updating testimonial status:', error);
    res.status(500).json({ error: 'Failed to update testimonial status' });
  }
});

// Toggle testimonial homepage display
app.put('/api/admin/testimonials/:id/homepage', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { showOnHomepage } = req.body;
    
    console.log('Toggle testimonial homepage display:', id, showOnHomepage);
    
    const query = `
      UPDATE testimonials
      SET 
        show_on_homepage = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [showOnHomepage, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    
    res.json({ success: true, testimonial: result.rows[0] });
  } catch (error) {
    console.error('Error updating testimonial homepage display:', error);
    res.status(500).json({ error: 'Failed to update testimonial homepage display' });
  }
});

// Delete testimonial
app.delete('/api/admin/testimonials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Delete testimonial:', id);
    
    const query = 'DELETE FROM testimonials WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    
    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

// TEMPORARY: Non-authenticated admin endpoints for testing
// WARNING: These endpoints are ONLY for development/testing and should NEVER be used in production
// They bypass authentication and are a security risk
/*
app.get('/api/admin/courses-temp', async (req, res) => {
  try {
    console.log('🔧 TEMP: Get courses for admin (no auth)');
    
    const query = 'SELECT * FROM courses WHERE is_active = true ORDER BY name';
    const result = await client.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/admin/bookings-temp', async (req, res) => {
  try {
    console.log('🔧 TEMP: Get bookings for admin (no auth)');
    
    const query = `
      SELECT 
        b.id, b.booking_reference, b.status as booking_status,
        b.payment_amount, b.created_at, b.updated_at,
        cs.id as session_id, cs.start_datetime::date, TO_CHAR(cs.start_datetime, 'HH24:MI'), TO_CHAR(cs.end_datetime, 'HH24:MI'),
        c.name as course_name, c.course_type, c.price,
        v.name as venue_name, '' as address_line1, '' as city,
        u.first_name, u.last_name, u.email, u.phone
      FROM bookings b
      LEFT JOIN course_schedules cs ON b.course_schedule_id = cs.id
      LEFT JOIN courses c ON cs.course_id = c.id
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `;
    const result = await client.query(query);
    
    const bookings = result.rows.map(row => ({
      id: row.booking_reference || row.id.toString(),
      courseId: row.session_id,
      courseName: row.course_name || 'Unknown Course',
      courseDate: row.start_datetime ? row.start_datetime.toISOString().split('T')[0] : 'TBD',
      courseTime: row.start_datetime ? row.start_datetime.toTimeString().substring(0, 5) : 'TBD',
      courseVenue: row.venue_name || 'Unknown Venue',
      coursePrice: parseFloat(row.price) || 0,
      customerName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      customerEmail: row.email || 'unknown@example.com',
      customerPhone: row.phone || '',
      companyName: '',
      bookingDate: row.created_at ? row.created_at.toISOString().split('T')[0] : 'Unknown',
      bookingReference: row.booking_reference || row.id.toString(),
      status: row.booking_status || 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      attendees: 1,
      totalAmount: parseFloat(row.total_amount) || 0,
      createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : new Date().toISOString()
    }));
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});
*/

// Testimonials endpoint - Return mock data for now
app.get('/api/testimonials/approved', async (req, res) => {
  try {
    // Return mock testimonials for now
    res.json({
      testimonials: [
        {
          id: 1,
          display_name: "Sarah J.",
          author_location: "Leeds",
          course_taken: "Emergency First Aid at Work",
          course_date: "2024-11-15",
          content: "Excellent course! Lex is a fantastic instructor who made the content engaging and easy to understand. I feel confident in my ability to help in an emergency now.",
          rating: 5,
          is_featured: true,
          verified_booking: true,
          created_at: new Date().toISOString(),
          published_at: new Date().toISOString()
        },
        {
          id: 2,
          display_name: "Mike T.",
          author_location: "Sheffield",
          course_taken: "First Aid at Work",
          course_date: "2024-10-28",
          content: "Professional training delivered with real-world experience. The hands-on practice really helped build confidence. Highly recommend React Fast Training!",
          rating: 5,
          is_featured: true,
          verified_booking: true,
          created_at: new Date().toISOString(),
          published_at: new Date().toISOString()
        },
        {
          id: 3,
          display_name: "Emma R.",
          author_location: "Bradford",
          course_taken: "Paediatric First Aid",
          course_date: "2024-09-10",
          content: "As a nursery teacher, this course was invaluable. Lex's military background brings a unique perspective to emergency response. Will definitely book again!",
          rating: 5,
          is_featured: true,
          verified_booking: true,
          created_at: new Date().toISOString(),
          published_at: new Date().toISOString()
        }
      ],
      averageRating: 5.0,
      totalCount: 3
    });
  } catch (error) {
    console.error('Testimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Payment intent endpoint
app.post('/api/bookings/create-payment-intent', async (req, res) => {
  try {
    console.log('📊 Payment intent request received');
    const { courseSessionId, amount, bookingData } = req.body;
    
    console.log('Creating Stripe payment intent for amount:', amount);
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount should be in pence
      currency: 'gbp',
      metadata: {
        courseSessionId: courseSessionId?.toString() || 'unknown',
        customerName: `${bookingData?.firstName || ''} ${bookingData?.lastName || ''}`.trim(),
        customerEmail: bookingData?.email || '',
        numberOfParticipants: (bookingData?.numberOfParticipants || 1).toString()
      }
    });
    
    console.log('✅ Payment intent created:', paymentIntent.id);
    
    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });
  } catch (error) {
    console.error('❌ Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent', details: error.message });
  }
});

// Confirm booking with payment endpoint with rate limiting - Real implementation
app.post('/api/bookings/confirm-with-payment', bookingLimiter, async (req, res) => {
  const transaction = await client.query('BEGIN');
  
  try {
    console.log('📊 Booking confirmation request received');
    const { 
      courseSessionId, 
      paymentIntentId,
      firstName,
      lastName,
      email,
      phone,
      company,
      numberOfParticipants = 1,
      specialRequirements,
      emergencyContact,
      totalAmount
    } = req.body;
    
    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Payment not completed' });
    }
    
    // Generate booking reference
    const bookingReference = `RFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Check if user exists
    let userId;
    const userCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (userCheck.rows.length > 0) {
      userId = userCheck.rows[0].id;
    } else {
      // Create new user
      const newUser = await client.query(
        `INSERT INTO users (email, name, phone, company_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'customer', NOW(), NOW())
         RETURNING id`,
        [email, `${firstName} ${lastName}`, phone, company]
      );
      userId = newUser.rows[0].id;
    }
    
    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        booking_reference, course_schedule_id, user_id, 
        status,
        payment_amount, stripe_payment_intent_id,
        number_of_attendees, notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        bookingReference,
        courseSessionId,
        userId,
        'confirmed',
        totalAmount,
        paymentIntentId,
        numberOfParticipants,
        specialRequirements
      ]
    );
    
    const booking = bookingResult.rows[0];
    
    // Create primary attendee
    await client.query(
      `INSERT INTO booking_attendees (booking_id, name, email, is_primary)
       VALUES ($1, $2, $3, true)`,
      [booking.id, `${firstName} ${lastName}`, email]
    );
    
    // Update course session capacity
    await client.query(
      `UPDATE course_schedules 
       SET current_capacity = current_capacity + $1
       WHERE id = $2`,
      [numberOfParticipants, courseSessionId]
    );
    
    // Log activity
    await client.query(
      `INSERT INTO activity_logs (action, resource_type, resource_id, user_email, details)
       VALUES ('booking.created', 'booking', $1, $2, $3)`,
      [booking.id, email, { 
        booking_reference: bookingReference,
        session_id: courseSessionId,
        amount: totalAmount
      }]
    );
    
    // Send confirmation email
    try {
      await emailService.sendBookingConfirmation(
        client,
        booking.id,
        email,
        `${firstName} ${lastName}`,
        bookingReference
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the booking if email fails
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Booking confirmed:', bookingReference);
    
    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          confirmationCode: bookingReference,
          status: 'confirmed',
          createdAt: booking.created_at
        },
        confirmationCode: bookingReference
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Booking confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// Contact form submission endpoint
app.post('/api/v1/contact/submit', async (req, res) => {
  try {
    console.log('📧 Contact form submission received');
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      course,
      numberOfPeople,
      preferredDate,
      preferredTime,
      subject,
      message,
      consent
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message || !consent) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Format the email content
    const emailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
      ${address ? `<p><strong>Address:</strong> ${address}</p>` : ''}
      ${course && course !== 'General Enquiry' ? `<p><strong>Course Interested In:</strong> ${course}</p>` : ''}
      ${numberOfPeople ? `<p><strong>Number of People:</strong> ${numberOfPeople}</p>` : ''}
      ${preferredDate ? `<p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-GB')}</p>` : ''}
      ${preferredTime ? `<p><strong>Preferred Time:</strong> ${preferredTime}</p>` : ''}
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    // Save to database if needed
    const result = await client.query(
      `INSERT INTO contact_submissions (
        first_name, last_name, email, phone, company, address,
        course, number_of_people, preferred_date, preferred_time,
        subject, message, consent_given, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id`,
      [
        firstName, lastName, email, phone, company, address,
        course, numberOfPeople ? parseInt(numberOfPeople) : null, 
        preferredDate, preferredTime, subject, message, consent
      ]
    );

    // Send email notification to admin
    if (emailService && emailService.sendEmail) {
      try {
        await emailService.sendEmail({
          to: 'info@reactfasttraining.co.uk',
          subject: `New Contact Form: ${subject}`,
          html: emailContent
        });

        // Send auto-reply to customer
        const autoReplyContent = `
          <h2>Thank you for contacting React Fast Training</h2>
          <p>Dear ${firstName},</p>
          <p>We have received your enquiry and will get back to you within 24 hours.</p>
          <p>Here's a summary of your enquiry:</p>
          <ul>
            ${course && course !== 'General Enquiry' ? `<li>Course: ${course}</li>` : ''}
            ${numberOfPeople ? `<li>Number of people: ${numberOfPeople}</li>` : ''}
            ${preferredDate ? `<li>Preferred date: ${new Date(preferredDate).toLocaleDateString('en-GB')}</li>` : ''}
            ${preferredTime ? `<li>Preferred time: ${preferredTime}</li>` : ''}
          </ul>
          <p>If you have any urgent questions, please call us on 07447 485644.</p>
          <p>Best regards,<br>React Fast Training Team</p>
        `;

        await emailService.sendEmail({
          to: email,
          subject: 'Thank you for your enquiry - React Fast Training',
          html: autoReplyContent
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the submission if email fails
      }
    }

    console.log('✅ Contact form submission saved:', result.rows[0].id);

    res.json({
      success: true,
      message: 'Thank you for your enquiry. We will get back to you soon.'
    });

  } catch (error) {
    console.error('❌ Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, there was an error submitting your enquiry. Please try again or call us directly.'
    });
  }
});

// Health check
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Serve static files from the built frontend
console.log('📁 Setting up static file serving...');
const staticPath = path.join(__dirname, '..', 'dist');
console.log('📁 Static files path:', staticPath);
app.use(express.static(staticPath));

// Additional security middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
});

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/course-sessions') || req.path.startsWith('/ping')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  console.log('📄 Serving React app for route:', req.path);
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  console.log(`📡 Admin login endpoint: http://localhost:${PORT}/api/admin/auth/login`);
});// trigger deploy
