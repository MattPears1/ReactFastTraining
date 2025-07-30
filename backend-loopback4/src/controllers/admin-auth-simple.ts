// Simplified admin auth controller without account locking
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Ensure client is connected
client.connect().catch(err => console.error('Admin auth DB connection error:', err));

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 [Admin Auth] Login attempt for: ${email}`);

    // Find admin user - NO LOCKOUT CHECKS
    const result = await client.query(
      "SELECT * FROM users WHERE email = $1 AND role = 'admin'",
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ [Admin Auth] Admin user not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('✅ [Admin Auth] Admin user found:', user.email);

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      console.log('❌ [Admin Auth] Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ [Admin Auth] Password verified');

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.first_name} ${user.last_name}`
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' } // Longer expiry for admin
    );

    // Update last login
    await client.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    console.log('✅ [Admin Auth] Login successful, token generated');

    // Send response
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      },
      expiresIn: 86400 // 24 hours in seconds
    });

  } catch (error) {
    console.error('❌ [Admin Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const adminMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Get fresh user data
    const result = await client.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE id = $1",
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
      permissions: ['all'] // Admin has all permissions
    });

  } catch (error) {
    console.error('❌ [Admin Auth] Me endpoint error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};