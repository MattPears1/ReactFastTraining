import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import contactRoutes from './contact.routes';
import newsletterRoutes from './newsletter.routes';
import analyticsRoutes from './analytics.routes';
import bookingRoutes from './booking.routes';

const router = Router();

// API version
router.get('/v1', (req, res) => {
  res.json({
    message: 'Lex Business API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      contact: '/api/v1/contact',
      newsletter: '/api/v1/newsletter',
      analytics: '/api/v1/analytics',
      bookings: '/api/v1/bookings',
    },
  });
});

// Routes
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/contact', contactRoutes);
router.use('/v1/newsletter', newsletterRoutes);
router.use('/v1/analytics', analyticsRoutes);
router.use('/v1/bookings', bookingRoutes);

export default router;