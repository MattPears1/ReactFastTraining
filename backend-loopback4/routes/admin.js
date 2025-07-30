const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Admin authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Generate CSRF token middleware
function generateCSRFTokenMiddleware() {
  return (req, res, next) => {
    if (!req.session) {
      return res.status(500).json({ error: 'Session not initialized' });
    }
    
    if (!req.session.csrfToken) {
      req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
  };
}

function setupAdminRoutes(app, db) {
  console.log('🔧 [ADMIN] Setting up admin routes...');

  // Apply CSRF token generation to all routes
  app.use(generateCSRFTokenMiddleware());

  // Admin login
  const adminLogin = async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      // Check admin credentials (you should store these in database with proper hashing)
      const validAdmin = username === process.env.ADMIN_USERNAME && 
                        await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

      if (!validAdmin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({ token, user: { username, role: 'admin' } });
    } catch (error) {
      console.error('❌ [ADMIN] Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Admin user info
  const adminMe = async (req, res) => {
    res.json({ user: req.user });
  };

  // Admin routes
  app.post('/api/admin/auth/login', adminLogin);
  app.get('/api/admin/auth/me', adminMe);
  
  app.post('/api/admin/auth/refresh', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const newToken = jwt.sign(
        { username: decoded.username, role: decoded.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({ token: newToken });
    } catch (error) {
      console.error('❌ [ADMIN] Token refresh error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.post('/api/admin/auth/logout', async (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
  });

  // Dashboard overview
  app.get('/api/admin/dashboard/overview', async (req, res) => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const queries = await Promise.allSettled([
        // Total bookings this month
        db.query(`
          SELECT COUNT(*) as count 
          FROM bookings 
          WHERE created_at >= $1 AND created_at <= $2
        `, [startOfMonth, endOfMonth]),

        // Total revenue this month  
        db.query(`
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM bookings 
          WHERE status = 'confirmed' 
          AND created_at >= $1 AND created_at <= $2
        `, [startOfMonth, endOfMonth]),

        // Upcoming courses count
        db.query(`
          SELECT COUNT(*) as count 
          FROM course_sessions 
          WHERE start_datetime > NOW()
        `),

        // Recent activity
        db.query(`
          SELECT 
            b.id,
            b.first_name,
            b.last_name,
            b.email,
            b.status,
            b.created_at,
            c.name as course_name
          FROM bookings b
          JOIN courses c ON b.course_id = c.id
          ORDER BY b.created_at DESC
          LIMIT 10
        `)
      ]);

      const [bookingsResult, revenueResult, coursesResult, activityResult] = queries;

      const stats = {
        totalBookings: bookingsResult.status === 'fulfilled' ? 
          parseInt(bookingsResult.value.rows[0]?.count || 0) : 0,
        totalRevenue: revenueResult.status === 'fulfilled' ? 
          parseFloat(revenueResult.value.rows[0]?.total || 0) : 0,
        upcomingCourses: coursesResult.status === 'fulfilled' ? 
          parseInt(coursesResult.value.rows[0]?.count || 0) : 0,
        recentActivity: activityResult.status === 'fulfilled' ? 
          activityResult.value.rows : []
      };

      res.json(stats);
    } catch (error) {
      console.error('❌ [ADMIN] Dashboard overview error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  // More admin routes would go here...
  // For brevity, I'm not including all routes but they would follow the same pattern

  console.log('✅ [ADMIN] Admin routes configured');
}

module.exports = { setupAdminRoutes };