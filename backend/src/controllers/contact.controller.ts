import { Request, Response, NextFunction } from 'express'
import { EmailService } from '../services/email/email.service'
import { logger } from '../utils/logger'

export class ContactController {
  private emailService: EmailService
  
  constructor() {
    this.emailService = new EmailService()
  }

  async submitForm(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        company,
        subject,
        message
      } = req.body

      // Log the contact form submission
      logger.info('Contact form submission received', {
        email,
        subject,
        company
      })

      // Send email notification to admin
      await this.emailService.send({
        to: process.env.ADMIN_EMAIL || 'info@reactfasttraining.co.uk',
        subject: `Contact Form: ${subject}`,
        template: 'contact-form-admin',
        context: {
          firstName,
          lastName,
          email,
          phone,
          company,
          subject,
          message,
          submittedAt: new Date().toISOString()
        }
      })

      // Send confirmation email to user
      await this.emailService.send({
        to: email,
        subject: 'Thank you for contacting React Fast Training',
        template: 'contact-form-confirmation',
        context: {
          firstName,
          subject
        }
      })

      logger.info('Contact form emails sent successfully', { email })

      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully. We\'ll get back to you soon.'
      })
    } catch (error) {
      logger.error('Error processing contact form submission', error)
      next(error)
    }
  }
}

export const contactController = new ContactController(new EmailService())