// TEMPORARY: Super simple admin login - NO CHECKS AT ALL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 BYPASS LOGIN for: ${email}`);
    
    // HARDCODED CHECK FOR ADMIN
    if (email === 'lex@reactfasttraining.co.uk' && password === 'Bumblebee21!') {
      console.log('✅ ADMIN CREDENTIALS MATCH - BYPASSING ALL CHECKS');
      
      // Generate token with hardcoded values
      const accessToken = jwt.sign(
        {
          id: 1, // Assuming admin is user ID 1
          email: 'lex@reactfasttraining.co.uk',
          role: 'admin',
          name: 'Lex Admin'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      return res.json({
        accessToken,
        user: {
          id: 1,
          email: 'lex@reactfasttraining.co.uk',
          name: 'Lex Admin',
          role: 'admin'
        },
        expiresIn: 86400
      });
    }
    
    // For any other user, do normal check
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.first_name} ${user.last_name}`
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      },
      expiresIn: 86400
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const adminMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // HARDCODED RESPONSE FOR ADMIN
    if (decoded.email === 'lex@reactfasttraining.co.uk') {
      return res.json({
        id: 1,
        email: 'lex@reactfasttraining.co.uk',
        name: 'Lex Admin',
        role: 'admin',
        lastLogin: new Date(),
        permissions: ['all']
      });
    }
    
    // Normal user lookup
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
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
      lastLogin: new Date(),
      permissions: user.role === 'admin' ? ['all'] : ['limited']
    });
    
  } catch (error) {
    console.error('❌ Me endpoint error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { adminLogin, adminMe };