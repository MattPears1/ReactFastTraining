import {
  post,
  requestBody,
  response,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { EmailService } from '../services/email.service';

interface ContactSubmission {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  timestamp?: Date;
}

interface NewsletterSubscription {
  email: string;
  timestamp?: Date;
}

export class ContactController {
  constructor(
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  @post('/api/contact/submit', {
    responses: {
      '200': {
        description: 'Contact form submission',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {type: 'boolean'},
                message: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  async submitContactForm(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'email', 'subject', 'message'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              subject: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    })
    submission: ContactSubmission,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Add timestamp
      submission.timestamp = new Date();

      // Send email to info@reactfasttraining.co.uk
      await this.emailService.sendEmail({
        to: 'info@reactfasttraining.co.uk',
        subject: `Contact Form: ${submission.subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${submission.name}</p>
          <p><strong>Email:</strong> ${submission.email}</p>
          ${submission.phone ? `<p><strong>Phone:</strong> ${submission.phone}</p>` : ''}
          <p><strong>Subject:</strong> ${submission.subject}</p>
          <p><strong>Message:</strong></p>
          <p>${submission.message.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#039;').replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Submitted at: ${submission.timestamp.toLocaleString('en-GB')}</small></p>
        `,
      });

      // Send confirmation email to user
      await this.emailService.sendEmail({
        to: submission.email,
        subject: 'Thank you for contacting React Fast Training',
        html: `
          <h2>Thank you for your enquiry</h2>
          <p>Dear ${submission.name},</p>
          <p>We have received your message and will respond as soon as possible.</p>
          <p>If your enquiry is urgent, please call us on 07447 485644.</p>
          <br>
          <p>Best regards,<br>React Fast Training Team</p>
        `,
      });

      return {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon.',
      };
    } catch (error) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error sending your message. Please try again or call us directly.',
      };
    }
  }

  @post('/newsletter/subscribe', {
    responses: {
      '200': {
        description: 'Newsletter subscription',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {type: 'boolean'},
                message: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  async subscribeNewsletter(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' },
            },
          },
        },
      },
    })
    subscription: NewsletterSubscription,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Add timestamp
      subscription.timestamp = new Date();

      // Send notification to info@reactfasttraining.co.uk
      await this.emailService.sendEmail({
        to: 'info@reactfasttraining.co.uk',
        subject: 'New Newsletter Subscription',
        html: `
          <h2>New Newsletter Subscription</h2>
          <p><strong>Email:</strong> ${subscription.email}</p>
          <p><strong>Subscribed at:</strong> ${subscription.timestamp.toLocaleString('en-GB')}</p>
        `,
      });

      // Send welcome email to subscriber
      await this.emailService.sendEmail({
        to: subscription.email,
        subject: 'Welcome to React Fast Training Newsletter',
        html: `
          <h2>Welcome to React Fast Training</h2>
          <p>Thank you for subscribing to our newsletter!</p>
          <p>You'll receive updates about:</p>
          <ul>
            <li>Upcoming first aid courses</li>
            <li>Special offers and discounts</li>
            <li>First aid tips and best practices</li>
            <li>Important regulatory updates</li>
          </ul>
          <p>If you have any questions about our courses, please don't hesitate to contact us.</p>
          <br>
          <p>Best regards,<br>React Fast Training Team</p>
          <hr>
          <p><small>You can unsubscribe at any time by contacting us at info@reactfasttraining.co.uk</small></p>
        `,
      });

      return {
        success: true,
        message: 'Thank you for subscribing! Please check your email for confirmation.',
      };
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error processing your subscription. Please try again later.',
      };
    }
  }
}