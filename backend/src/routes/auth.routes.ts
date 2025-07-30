import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authController } from '../controllers/auth.controller';
import { authValidation } from '../validations/auth.validation';
import { authenticate } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post(
  '/register',
  strictRateLimiter,
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  strictRateLimiter,
  validate(authValidation.login),
  authController.login
);

router.post(
  '/refresh-token',
  validate(authValidation.refreshToken),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  strictRateLimiter,
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  strictRateLimiter,
  validate(authValidation.resetPassword),
  authController.resetPassword
);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validate(authValidation.changePassword), authController.changePassword);

export default router;