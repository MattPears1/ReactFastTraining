import { injectable } from '@loopback/core';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { EmailType } from './email.types';

@injectable()
export class EmailTemplateService {
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private templateDir: string;

  constructor() {
    this.templateDir = path.join(__dirname, '../../templates/email');
    this.registerHelpers();
    this.loadTemplates();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    });

    handlebars.registerHelper('formatTime', (date: Date) => {
      return new Date(date).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(amount);
    });
  }

  /**
   * Load email templates
   */
  private loadTemplates(): void {
    try {
      const templateFiles = fs.readdirSync(this.templateDir)
        .filter(file => file.endsWith('.hbs'));

      for (const file of templateFiles) {
        const templateName = path.basename(file, '.hbs');
        const templatePath = path.join(this.templateDir, file);
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const compiled = handlebars.compile(templateContent);
        this.templates.set(templateName, compiled);
      }
    } catch (error) {
      console.warn('Warning: Email templates directory not found, using inline templates');
    }
  }

  /**
   * Render an email template
   */
  render(templateName: string, data: Record<string, any>): string {
    const template = this.templates.get(templateName);
    
    if (template) {
      return template(data);
    }

    // Fallback to inline templates
    return this.getInlineTemplate(templateName, data);
  }

  /**
   * Get inline template as fallback
   */
  private getInlineTemplate(templateName: string, data: Record<string, any>): string {
    const baseStyles = `
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; }
      .content { padding: 30px; background-color: #f9f9f9; }
      .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
      .button { display: inline-block; padding: 12px 24px; background-color: #0EA5E9; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      .info-box { background-color: #e3f2fd; border-left: 4px solid #0EA5E9; padding: 15px; margin: 20px 0; }
      .warning-box { background-color: #fff3cd; border-left: 4px solid #F97316; padding: 15px; margin: 20px 0; }
    `;

    const baseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>React Fast Training</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>React Fast Training - Yorkshire's Premier First Aid Training Provider</p>
      <p>Email: info@reactfasttraining.co.uk | Phone: 07447 485644</p>
      <p>&copy; ${new Date().getFullYear()} React Fast Training. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    switch (templateName) {
      case EmailType.BOOKING_CONFIRMATION:
        return baseLayout(`
          <h2>Booking Confirmation</h2>
          <p>Dear ${data.userName},</p>
          <p>Thank you for booking your ${data.courseName} course with React Fast Training.</p>
          <div class="info-box">
            <h3>Course Details:</h3>
            <p><strong>Course:</strong> ${data.courseName}</p>
            <p><strong>Date:</strong> ${data.courseDate}</p>
            <p><strong>Time:</strong> ${data.courseTime}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p><strong>Reference:</strong> ${data.bookingReference}</p>
          </div>
          <div class="warning-box">
            <p><strong>Important:</strong> Please bring photo ID and arrive 10 minutes early.</p>
          </div>
          <p>If you have any questions, please contact us at bookings@reactfasttraining.co.uk</p>
        `);

      case EmailType.COURSE_REMINDER:
        return baseLayout(`
          <h2>Course Reminder</h2>
          <p>Dear ${data.userName},</p>
          <p>This is a reminder that your ${data.courseName} course is tomorrow.</p>
          <div class="info-box">
            <h3>Course Details:</h3>
            <p><strong>Date:</strong> ${data.courseDate}</p>
            <p><strong>Time:</strong> ${data.courseTime}</p>
            <p><strong>Location:</strong> ${data.location}</p>
          </div>
          <p>Please remember to bring:</p>
          <ul>
            <li>Photo ID</li>
            <li>Pen and paper for notes</li>
            <li>Comfortable clothing</li>
          </ul>
        `);

      default:
        return baseLayout(`<p>${JSON.stringify(data)}</p>`);
    }
  }
}