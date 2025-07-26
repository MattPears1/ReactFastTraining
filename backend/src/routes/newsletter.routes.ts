import { Router } from 'express';
import { validate } from '../middleware/validate';
import { newsletterController } from '../controllers/newsletter.controller';
import { newsletterValidation } from '../validations/newsletter.validation';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/subscribe',
  strictRateLimiter,
  validate(newsletterValidation.subscribe),
  newsletterController.subscribe
);

router.post(
  '/unsubscribe',
  validate(newsletterValidation.unsubscribe),
  newsletterController.unsubscribe
);

export default router;