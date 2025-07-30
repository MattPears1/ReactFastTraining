import {
  post,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {EmailService} from '../services';

export class EnquiryController {
  constructor(
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  @post('/enquiries/onsite-training')
  @response(200, {
    description: 'Submit onsite training enquiry',
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
  })
  async submitOnsiteEnquiry(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['company', 'contactName', 'email', 'phone', 'courseType', 'numberOfParticipants', 'location'],
            properties: {
              company: {type: 'string', minLength: 2},
              contactName: {type: 'string', minLength: 2},
              email: {type: 'string', format: 'email'},
              phone: {type: 'string', minLength: 10},
              courseType: {
                type: 'string',
                enum: ['EFAW', 'FAW', 'FAW_REQUALIFICATION', 'PAEDIATRIC', 'BESPOKE'],
              },
              numberOfParticipants: {type: 'number', minimum: 4},
              preferredDates: {type: 'string'},
              location: {type: 'string'},
              additionalInfo: {type: 'string'},
            },
          },
        },
      },
    })
    enquiry: any,
  ): Promise<object> {
    try {
      // Validate participant count
      if (enquiry.numberOfParticipants < 4) {
        throw new HttpErrors.BadRequest('Minimum 4 participants required for onsite training');
      }

      // Send notification email
      await this.emailService.sendOnsiteEnquiryNotification(enquiry);

      // Send confirmation to enquirer
      const confirmationHtml = `
        <h2>Thank you for your enquiry</h2>
        <p>Dear ${enquiry.contactName},</p>
        <p>We have received your onsite training enquiry for ${enquiry.company}.</p>
        <p>One of our team members will contact you within 24 hours (during business hours) to discuss your requirements.</p>
        <p>Best regards,<br>React Fast Training Team</p>
      `;

      await this.emailService.sendEmail({
        to: enquiry.email,
        subject: 'Onsite Training Enquiry - React Fast Training',
        html: confirmationHtml,
      });

      return {
        success: true,
        message: 'Your enquiry has been submitted successfully. We will contact you within 24 hours.',
      };
    } catch (error) {
      console.error('Failed to process onsite enquiry:', error);
      throw new HttpErrors.InternalServerError('Failed to submit enquiry. Please try again later.');
    }
  }

  @post('/enquiries/general')
  @response(200, {
    description: 'Submit general enquiry',
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
  })
  async submitGeneralEnquiry(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'email', 'subject', 'message'],
            properties: {
              name: {type: 'string', minLength: 2},
              email: {type: 'string', format: 'email'},
              phone: {type: 'string'},
              subject: {type: 'string', minLength: 5},
              message: {type: 'string', minLength: 10},
            },
          },
        },
      },
    })
    enquiry: any,
  ): Promise<object> {
    try {
      // Send notification email
      const notificationHtml = `
        <h2>New General Enquiry</h2>
        <h3>Contact Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${enquiry.name}</li>
          <li><strong>Email:</strong> ${enquiry.email}</li>
          <li><strong>Phone:</strong> ${enquiry.phone || 'Not provided'}</li>
        </ul>
        
        <h3>Subject:</h3>
        <p>${enquiry.subject}</p>
        
        <h3>Message:</h3>
        <p>${enquiry.message}</p>
      `;

      await this.emailService.sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@reactfasttraining.co.uk',
        subject: `General Enquiry - ${enquiry.subject}`,
        html: notificationHtml,
      });

      // Send confirmation to enquirer
      const confirmationHtml = `
        <h2>Thank you for contacting us</h2>
        <p>Dear ${enquiry.name},</p>
        <p>We have received your enquiry and will respond within 24 hours (during business hours).</p>
        <p>Best regards,<br>React Fast Training Team</p>
      `;

      await this.emailService.sendEmail({
        to: enquiry.email,
        subject: 'Enquiry Received - React Fast Training',
        html: confirmationHtml,
      });

      return {
        success: true,
        message: 'Your enquiry has been submitted successfully. We will respond within 24 hours.',
      };
    } catch (error) {
      console.error('Failed to process general enquiry:', error);
      throw new HttpErrors.InternalServerError('Failed to submit enquiry. Please try again later.');
    }
  }
}