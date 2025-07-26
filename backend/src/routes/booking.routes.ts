import { Router } from 'express'
import { validate } from '../middleware/validate'
import { bookingController } from '../controllers/booking.controller'
import { bookingValidation } from '../validations/booking.validation'
import { authenticate, authorize } from '../middleware/auth'
import { strictRateLimiter } from '../middleware/rateLimiter'

const router = Router()

// Public routes
router.get(
  '/courses/available',
  validate(bookingValidation.getAvailableCourses),
  bookingController.getAvailableCourses
)

router.get(
  '/confirmation/:code',
  validate(bookingValidation.getBookingByCode),
  bookingController.getBookingByCode
)

// Protected routes
router.post(
  '/create',
  strictRateLimiter,
  validate(bookingValidation.createBooking),
  bookingController.createBooking
)

router.get(
  '/my-bookings',
  authenticate,
  validate(bookingValidation.getUserBookings),
  bookingController.getUserBookings
)

router.put(
  '/:id/cancel',
  authenticate,
  validate(bookingValidation.cancelBooking),
  bookingController.cancelBooking
)

export default router