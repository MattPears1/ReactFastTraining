import Joi from 'joi'

export const bookingValidation = {
  getAvailableCourses: {
    query: Joi.object({
      courseType: Joi.string()
        .valid('EFAW', 'FAW', 'PAEDIATRIC', 'MENTAL_HEALTH')
        .optional(),
      venue: Joi.string()
        .valid('LEEDS', 'SHEFFIELD', 'BRADFORD', 'ON_SITE', 'ONLINE')
        .optional(),
      month: Joi.date()
        .optional()
    })
  },

  createBooking: {
    body: Joi.object({
      courseScheduleId: Joi.number()
        .integer()
        .required()
        .messages({
          'any.required': 'Course schedule is required'
        }),
      numberOfParticipants: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .required()
        .messages({
          'number.min': 'At least 1 participant is required',
          'number.max': 'Maximum 20 participants allowed',
          'any.required': 'Number of participants is required'
        }),
      contactName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.min': 'Contact name must be at least 2 characters',
          'string.max': 'Contact name must not exceed 100 characters',
          'any.required': 'Contact name is required'
        }),
      contactEmail: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please enter a valid email address',
          'any.required': 'Contact email is required'
        }),
      contactPhone: Joi.string()
        .pattern(/^[\d\s\-\+\(\)]+$/)
        .required()
        .messages({
          'string.pattern.base': 'Please enter a valid phone number',
          'any.required': 'Contact phone is required'
        }),
      companyName: Joi.string()
        .max(200)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Company name must not exceed 200 characters'
        }),
      companyAddress: Joi.string()
        .max(500)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Company address must not exceed 500 characters'
        }),
      specialRequirements: Joi.string()
        .max(1000)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Special requirements must not exceed 1000 characters'
        }),
      participantDetails: Joi.array()
        .items(Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().optional(),
          dietaryRequirements: Joi.string().optional(),
          medicalConditions: Joi.string().optional()
        }))
        .optional()
    })
  },

  getBookingByCode: {
    params: Joi.object({
      code: Joi.string()
        .required()
        .pattern(/^[A-Z]{3}-\d{6}-[A-Z0-9]{4}$/)
        .messages({
          'string.pattern.base': 'Invalid confirmation code format',
          'any.required': 'Confirmation code is required'
        })
    })
  },

  getUserBookings: {
    query: Joi.object({
      status: Joi.string()
        .valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
        .optional()
    })
  },

  cancelBooking: {
    params: Joi.object({
      id: Joi.number()
        .integer()
        .required()
        .messages({
          'any.required': 'Booking ID is required'
        })
    }),
    body: Joi.object({
      reason: Joi.string()
        .min(10)
        .max(500)
        .required()
        .messages({
          'string.min': 'Cancellation reason must be at least 10 characters',
          'string.max': 'Cancellation reason must not exceed 500 characters',
          'any.required': 'Cancellation reason is required'
        })
    })
  }
}