import { Router } from 'express';
import { validate } from '../middleware/validate';
import { contactController } from '../controllers/contact.controller';
import { contactValidation } from '../validations/contact.validation';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/submit',
  strictRateLimiter,
  validate(contactValidation.submitForm),
  contactController.submitForm
);

export default router;