import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authValidation } from '../validations/auth.validation';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Admin authentication routes
// These routes mirror the regular auth routes but with admin-specific endpoints
// to match the frontend expectations

router.post(
  '/login',
  strictRateLimiter,
  validate(authValidation.login),
  authController.login
);

router.post(
  '/refresh',
  validate(authValidation.refreshToken),
  authController.refreshToken
);

router.post(
  '/logout',
  authController.logout
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

export default router;