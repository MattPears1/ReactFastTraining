require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3003', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection failed:', err));

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

// Admin login endpoint
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}`);

    // Find user
    const result = await client.query(
      "SELECT * FROM users WHERE email = $1 AND role IN ('admin', 'instructor')",
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login
    await client.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log activity
    await client.query(
      `INSERT INTO admin_activity_logs (admin_id, action, entity_type, new_values, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [user.id, 'login', 'auth', JSON.stringify({ email })]
    );

    console.log('✅ Login successful');

    // Send response
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      },
      expiresIn: 900 // 15 minutes
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user endpoint
app.get('/api/admin/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const result = await client.query(
        'SELECT id, email, first_name, last_name, role, last_login FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      
      res.json({
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        lastLogin: user.last_login,
        permissions: user.role === 'admin' 
          ? ['courses.manage', 'bookings.manage', 'users.manage', 'analytics.view', 'settings.manage']
          : ['courses.view', 'bookings.view', 'analytics.view']
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Dashboard overview endpoint
app.get('/api/admin/dashboard/overview', async (req, res) => {
  try {
    console.log('📊 Dashboard request received');
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return res.status(401).json({ error: 'Unauthorized - No valid auth header' });
    }

    const token = authHeader.substring(7);
    console.log('🎫 Token length:', token.length);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token valid for user:', decoded.email);
    } catch (tokenError) {
      console.error('❌ Token verification error:', tokenError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
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

      // Get revenue by month for the last 6 months
      const revenueByMonth = await client.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COALESCE(SUM(payment_amount), 0) as revenue
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
            new: parseInt(stats[4].rows[0].count), // For now, same as total
            active: parseInt(stats[4].rows[0].count)
          },
          courses: {
            upcoming: parseInt(stats[3].rows[0].count),
            inProgress: 0, // TODO: Add logic for in-progress courses
            completed: parseInt(stats[5].rows[0].count)
          }
        },
        revenueData: revenueByMonth.rows.map(r => ({
          date: r.month,
          revenue: parseFloat(r.revenue),
          bookings: 0 // TODO: Add booking count per month
        })),
        bookingStatus: [
          { status: 'Confirmed', count: 0, percentage: 0 },
          { status: 'Pending', count: parseInt(stats[2].rows[0].count), percentage: 100 },
          { status: 'Cancelled', count: 0, percentage: 0 }
        ],
        upcomingSchedules: upcomingSessions.rows.map(session => ({
          id: session.id,
          courseName: session.course_name,
          date: session.session_date,
          time: `${session.start_time} - ${session.end_time}`,
          venue: session.location_name,
          currentCapacity: session.booked_count,
          maxCapacity: session.current_capacity || 20
        })),
        recentActivity: recentBookings.rows.slice(0, 5).map(booking => ({
          id: booking.id,
          action: 'New booking',
          user: `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'Guest',
          timestamp: booking.created_at,
          details: `Booked ${booking.course_name || 'course'}`
        }))
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

// Courses endpoints
app.get('/api/admin/courses', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      
      const courses = await client.query(`
        SELECT * FROM courses ORDER BY created_at DESC
      `);

      res.json(courses.rows);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activity logs endpoint
app.get('/api/admin/activity-logs', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      
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
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Activity logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bookings endpoint
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      
      const bookings = await client.query(`
        SELECT b.*, u.first_name, u.last_name, u.email, u.phone,
               c.name as course_name, 
               DATE(cs.start_datetime) as session_date,
               TO_CHAR(cs.start_datetime, 'HH24:MI') as start_time,
               v.name as location_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN course_schedules cs ON b.course_schedule_id = cs.id
        LEFT JOIN courses c ON cs.course_id = c.id
        LEFT JOIN venues v ON cs.venue_id = v.id
        ORDER BY b.created_at DESC
      `);

      res.json(bookings.rows);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule endpoint
app.get('/api/admin/schedule', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      
      const schedule = await client.query(`
        SELECT cs.*, c.name as course_name, c.duration, c.price,
               v.name as location_name, v.address as location_address,
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
        spotsAvailable: (session.current_capacity || 20) - (parseInt(session.booked_count) || 0),
        totalSpots: session.current_capacity || 20,
        price: session.price,
        status: session.status
      })));
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Settings endpoint
app.get('/api/admin/settings', async (req, res) => {
  try {
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
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users endpoint
app.get('/api/admin/users', async (req, res) => {
  try {
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
      
      const users = await client.query(`
        SELECT id, email, first_name, last_name, phone, role, is_active, 
               last_login, created_at
        FROM users
        ORDER BY created_at DESC
      `);

      res.json(users.rows);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  console.log(`📡 Admin login endpoint: http://localhost:${PORT}/api/admin/auth/login`);
});