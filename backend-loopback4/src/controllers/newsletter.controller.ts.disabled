import {
  post,
  requestBody,
  RestBindings,
  Request,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {EmailService} from '../services/email.service';

interface NewsletterSubscription {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface ContactFormSubmission {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  courseInterest?: string;
}

export class NewsletterController {
  constructor(
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  @post('/api/newsletter/subscribe')
  async subscribe(
    @requestBody() subscription: NewsletterSubscription,
    @inject(RestBindings.Http.REQUEST) request: Request,
  ): Promise<{message: string}> {
    try {
      // Send notification email to info@
      await this.emailService.sendEmail({
        to: 'info@reactfasttraining.co.uk',
        subject: 'New Newsletter Subscription',
        html: `
          <h2>New Newsletter Subscription</h2>
          <p><strong>Email:</strong> ${subscription.email}</p>
          ${subscription.firstName ? `<p><strong>First Name:</strong> ${subscription.firstName}</p>` : ''}
          ${subscription.lastName ? `<p><strong>Last Name:</strong> ${subscription.lastName}</p>` : ''}
          <p><strong>Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
          <p><strong>IP Address:</strong> ${request.ip}</p>
        `
      });

      // Send welcome email to subscriber
      await this.emailService.sendEmail({
        to: subscription.email,
        subject: 'Welcome to React Fast Training Newsletter',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 30px; background-color: #f8f9fa; }
              .footer { background-color: #1F2937; color: white; padding: 20px; text-align: center; font-size: 14px; }
              .button { display: inline-block; padding: 12px 30px; background: #0EA5E9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to React Fast Training!</h1>
              </div>
              
              <div class="content">
                <p>Hi${subscription.firstName ? ' ' + subscription.firstName : ''},</p>
                <p>Thank you for subscribing to our newsletter. You'll now receive:</p>
                <ul>
                  <li>Updates on new first aid courses</li>
                  <li>Special offers and early bird discounts</li>
                  <li>First aid tips and best practices</li>
                  <li>Training news and certification updates</li>
                </ul>
                <p>Stay tuned for valuable content to help you on your first aid journey!</p>
                <center>
                  <a href="https://reactfasttraining.co.uk/courses" class="button">View Our Courses</a>
                </center>
              </div>
              
              <div class="footer">
                <p>React Fast Training<br>
                South Yorkshire, UK<br>
                <a href="mailto:info@reactfasttraining.co.uk" style="color: #60A5FA;">info@reactfasttraining.co.uk</a><br>
                07447 485644</p>
                <p style="font-size: 12px; margin-top: 10px;">
                  You received this email because you subscribed to our newsletter. 
                  To unsubscribe, please contact us.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      return {message: 'Successfully subscribed to newsletter'};
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      throw new Error('Failed to subscribe to newsletter');
    }
  }

  @post('/api/contact/submit')
  async submitContactForm(
    @requestBody() formData: ContactFormSubmission,
    @inject(RestBindings.Http.REQUEST) request: Request,
  ): Promise<{message: string}> {
    try {
      // Send email to info@
      await this.emailService.sendEmail({
        to: 'info@reactfasttraining.co.uk',
        subject: `Contact Form: ${formData.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #0EA5E9; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f8f9fa; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #555; }
              .value { margin-top: 5px; }
              .message { background: white; padding: 15px; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Contact Form Submission</h2>
              </div>
              
              <div class="content">
                <div class="field">
                  <div class="label">Name:</div>
                  <div class="value">${formData.name}</div>
                </div>
                
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value"><a href="mailto:${formData.email}">${formData.email}</a></div>
                </div>
                
                ${formData.phone ? `
                <div class="field">
                  <div class="label">Phone:</div>
                  <div class="value">${formData.phone}</div>
                </div>
                ` : ''}
                
                ${formData.courseInterest ? `
                <div class="field">
                  <div class="label">Course Interest:</div>
                  <div class="value">${formData.courseInterest}</div>
                </div>
                ` : ''}
                
                <div class="field">
                  <div class="label">Subject:</div>
                  <div class="value">${formData.subject}</div>
                </div>
                
                <div class="message">
                  <div class="label">Message:</div>
                  <div class="value">${formData.message.replace(/\n/g, '<br>')}</div>
                </div>
                
                <hr style="margin: 20px 0; border: 1px solid #ddd;">
                
                <div class="field" style="font-size: 12px; color: #666;">
                  <div class="label">Submission Details:</div>
                  <div class="value">
                    Date: ${new Date().toLocaleString('en-GB')}<br>
                    IP Address: ${request.ip}
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });

      // Send confirmation email to user
      await this.emailService.sendEmail({
        to: formData.email,
        subject: 'Thank you for contacting React Fast Training',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 30px; background-color: #f8f9fa; }
              .footer { background-color: #1F2937; color: white; padding: 20px; text-align: center; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You for Contacting Us</h1>
              </div>
              
              <div class="content">
                <p>Dear ${formData.name},</p>
                <p>Thank you for getting in touch with React Fast Training. We've received your message and will respond as soon as possible.</p>
                <p><strong>Your enquiry:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Subject:</strong> ${formData.subject}</p>
                  <p><strong>Message:</strong><br>${formData.message.replace(/\n/g, '<br>')}</p>
                </div>
                <p>We typically respond within 24 hours during business days. If your enquiry is urgent, please call us on 07447 485644.</p>
                <p>Best regards,<br>The React Fast Training Team</p>
              </div>
              
              <div class="footer">
                <p>React Fast Training<br>
                South Yorkshire, UK<br>
                <a href="mailto:info@reactfasttraining.co.uk" style="color: #60A5FA;">info@reactfasttraining.co.uk</a><br>
                07447 485644</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      return {message: 'Your message has been sent successfully'};
    } catch (error) {
      console.error('Contact form submission error:', error);
      throw new Error('Failed to send message');
    }
  }
}