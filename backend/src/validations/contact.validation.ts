import Joi from 'joi'

export const contactValidation = {
  submitForm: {
    body: Joi.object({
      firstName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
          'string.min': 'First name must be at least 2 characters',
          'string.max': 'First name must not exceed 50 characters',
          'any.required': 'First name is required'
        }),
      lastName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
          'string.min': 'Last name must be at least 2 characters',
          'string.max': 'Last name must not exceed 50 characters',
          'any.required': 'Last name is required'
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please enter a valid email address',
          'any.required': 'Email is required'
        }),
      phone: Joi.string()
        .allow('')
        .optional()
        .pattern(/^[\d\s\-\+\(\)]+$/)
        .messages({
          'string.pattern.base': 'Please enter a valid phone number'
        }),
      company: Joi.string()
        .allow('')
        .max(100)
        .optional()
        .messages({
          'string.max': 'Company name must not exceed 100 characters'
        }),
      subject: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
          'string.min': 'Subject must be at least 5 characters',
          'string.max': 'Subject must not exceed 200 characters',
          'any.required': 'Subject is required'
        }),
      message: Joi.string()
        .min(20)
        .max(5000)
        .required()
        .messages({
          'string.min': 'Message must be at least 20 characters',
          'string.max': 'Message must not exceed 5000 characters',
          'any.required': 'Message is required'
        }),
      consent: Joi.boolean()
        .valid(true)
        .required()
        .messages({
          'any.only': 'You must agree to the privacy policy',
          'any.required': 'Consent is required'
        })
    })
  }
}