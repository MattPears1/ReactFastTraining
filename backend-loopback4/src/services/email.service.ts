import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Booking, Certificate, CourseSession} from '../models';
import {BookingRepository} from '../repositories';
import * as nodemailer from 'nodemailer';
import {User} from '../db/schema/users';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

@injectable({scope: BindingScope.TRANSIENT})
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'React Fast Training <info@reactfasttraining.co.uk>',
      ...options,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendBookingConfirmation(booking: Booking, session: CourseSession): Promise<void> {
    const html = `
      <h2>Booking Confirmation - React Fast Training</h2>
      <p>Dear ${booking.contactDetails.firstName} ${booking.contactDetails.lastName},</p>
      <p>Thank you for booking with React Fast Training. Your booking has been confirmed.</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Booking Reference:</strong> ${booking.bookingReference}</li>
        <li><strong>Course:</strong> ${session.courseId}</li>
        <li><strong>Date:</strong> ${new Date(session.startDate).toLocaleDateString('en-GB')} - ${new Date(session.endDate).toLocaleDateString('en-GB')}</li>
        <li><strong>Time:</strong> ${session.startTime} - ${session.endTime}</li>
        <li><strong>Number of Participants:</strong> ${booking.numberOfParticipants}</li>
        <li><strong>Total Amount:</strong> £${booking.finalAmount}</li>
      </ul>
      
      <h3>Location Details:</h3>
      <p>Full location details will be sent in a separate email closer to the course date.</p>
      
      <h3>What to Bring:</h3>
      <ul>
        <li>Photo ID (passport or driving license)</li>
        <li>Pen and notepad</li>
        <li>Comfortable clothing suitable for practical exercises</li>
      </ul>
      
      <h3>Important Information:</h3>
      <ul>
        <li>Please arrive 15 minutes before the start time</li>
        <li>Lunch and refreshments will be provided</li>
        <li>Minimum age requirement: 16 years</li>
        <li>English Level 2 requirement applies</li>
      </ul>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      React Fast Training Team<br>
      Yorkshire's Premier First Aid Training Provider</p>
    `;

    await this.sendEmail({
      to: booking.contactDetails.email,
      subject: `Booking Confirmation - ${booking.bookingReference}`,
      html,
    });

    await this.bookingRepository.updateById(booking.id, {
      confirmationSentAt: new Date(),
    });
  }

  async sendCourseReminder(booking: Booking, session: CourseSession): Promise<void> {
    const html = `
      <h2>Course Reminder - React Fast Training</h2>
      <p>Dear ${booking.contactDetails.firstName},</p>
      <p>This is a friendly reminder about your upcoming first aid training course.</p>
      
      <h3>Course Details:</h3>
      <ul>
        <li><strong>Booking Reference:</strong> ${booking.bookingReference}</li>
        <li><strong>Date:</strong> ${new Date(session.startDate).toLocaleDateString('en-GB')}</li>
        <li><strong>Time:</strong> ${session.startTime}</li>
      </ul>
      
      <p>Please remember to bring photo ID and wear comfortable clothing.</p>
      
      <p>We look forward to seeing you!</p>
      
      <p>Best regards,<br>
      React Fast Training Team</p>
    `;

    await this.sendEmail({
      to: booking.contactDetails.email,
      subject: `Course Reminder - ${booking.bookingReference}`,
      html,
    });

    await this.bookingRepository.updateById(booking.id, {
      reminderSentAt: new Date(),
    });
  }

  async sendCertificate(certificate: Certificate, recipientEmail: string): Promise<void> {
    const html = `
      <h2>Certificate of Completion - React Fast Training</h2>
      <p>Congratulations ${certificate.participantDetails.firstName}!</p>
      <p>You have successfully completed your ${certificate.courseName} training.</p>
      
      <h3>Certificate Details:</h3>
      <ul>
        <li><strong>Certificate Number:</strong> ${certificate.certificateNumber}</li>
        <li><strong>Completion Date:</strong> ${new Date(certificate.completionDate).toLocaleDateString('en-GB')}</li>
        <li><strong>Valid Until:</strong> ${new Date(certificate.expiryDate).toLocaleDateString('en-GB')}</li>
        <li><strong>Certification Body:</strong> ${certificate.certificationBody}</li>
      </ul>
      
      <p>Your certificate is attached to this email. Please keep it safe for your records.</p>
      
      <p>To verify your certificate online, visit: ${certificate.verificationUrl}</p>
      
      <p>Thank you for choosing React Fast Training!</p>
      
      <p>Best regards,<br>
      React Fast Training Team</p>
    `;

    const attachments = certificate.pdfUrl ? [{
      filename: `Certificate_${certificate.certificateNumber}.pdf`,
      path: certificate.pdfUrl,
    }] : [];

    await this.sendEmail({
      to: recipientEmail,
      subject: `Your First Aid Certificate - ${certificate.certificateNumber}`,
      html,
      attachments,
    });
  }

  async sendOnsiteEnquiryNotification(enquiry: any): Promise<void> {
    const html = `
      <h2>New Onsite Training Enquiry</h2>
      <h3>Contact Details:</h3>
      <ul>
        <li><strong>Company:</strong> ${enquiry.company}</li>
        <li><strong>Contact Name:</strong> ${enquiry.contactName}</li>
        <li><strong>Email:</strong> ${enquiry.email}</li>
        <li><strong>Phone:</strong> ${enquiry.phone}</li>
      </ul>
      
      <h3>Training Requirements:</h3>
      <ul>
        <li><strong>Course Type:</strong> ${enquiry.courseType}</li>
        <li><strong>Number of Participants:</strong> ${enquiry.numberOfParticipants}</li>
        <li><strong>Preferred Dates:</strong> ${enquiry.preferredDates}</li>
        <li><strong>Location:</strong> ${enquiry.location}</li>
      </ul>
      
      <h3>Additional Information:</h3>
      <p>${enquiry.additionalInfo || 'None provided'}</p>
    `;

    await this.sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@reactfasttraining.co.uk',
      subject: `New Onsite Training Enquiry - ${enquiry.company}`,
      html,
    });
  }

  async sendVerificationEmail(user: User): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0EA5E9; 
                     color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to React Fast Training</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Hi ${user.name},</p>
              <p>Thank you for signing up with React Fast Training. To complete your registration, 
                 please verify your email address by clicking the button below:</p>
              <center>
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </center>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 12px;">${verificationUrl}</p>
              <p>This link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 React Fast Training. All rights reserved.</p>
              <p>Yorkshire's Premier First Aid Training Provider</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email - React Fast Training',
      html,
    });
  }

  async sendAccountLockedEmail(user: User): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0EA5E9; 
                     color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .warning { background-color: #FEF3C7; border: 1px solid #F59E0B; 
                      padding: 15px; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Locked</h1>
            </div>
            <div class="content">
              <h2>Your Account Has Been Locked</h2>
              <p>Hi ${user.name},</p>
              
              <div class="warning">
                <strong>⚠️ Security Alert:</strong> Your account has been locked due to 
                multiple failed login attempts.
              </div>
              
              <p>For your security, we've temporarily locked your account. This helps 
                 protect your account from unauthorized access attempts.</p>
              
              <p>To unlock your account, you'll need to reset your password:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              
              <p>If you didn't attempt to log in, please reset your password immediately 
                 as someone may be trying to access your account.</p>
              
              <h3>Security Tips:</h3>
              <ul>
                <li>Use a strong, unique password</li>
                <li>Never share your password with anyone</li>
                <li>Be cautious of phishing emails</li>
                <li>Consider using a password manager</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2024 React Fast Training. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Account Locked - Action Required',
      html,
    });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0EA5E9; 
                     color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .security-note { background-color: #FEF3C7; padding: 10px; border-radius: 4px; 
                            margin: 15px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hi ${user.name},</p>
              <p>We received a request to reset your password. Click the button below to 
                 create a new password:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 12px;">${resetUrl}</p>
              
              <div class="security-note">
                <strong>⏰ This link expires in 1 hour</strong> for security reasons.
              </div>
              
              <p>If you didn't request this password reset, please ignore this email. 
                 Your password won't be changed.</p>
              
              <p><strong>Note:</strong> If your account was locked due to failed login 
                 attempts, it will be automatically unlocked when you reset your password.</p>
            </div>
            <div class="footer">
              <p>© 2024 React Fast Training. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - React Fast Training',
      html,
    });
  }

  async sendPasswordChangedEmail(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .security-note { background-color: #D1FAE5; border: 1px solid #10B981; 
                            padding: 15px; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed Successfully</h1>
            </div>
            <div class="content">
              <h2>Your Password Has Been Reset</h2>
              <p>Hi ${user.name},</p>
              <p>This email confirms that your password has been successfully changed.</p>
              
              <div class="security-note">
                <strong>🔓 Account Unlocked:</strong> If your account was previously 
                locked, it has now been unlocked.
              </div>
              
              <p>You can now log in with your new password.</p>
              
              <p>If you didn't make this change, please contact us immediately.</p>
              
              <h3>Security Tips:</h3>
              <ul>
                <li>Use a unique password for each account</li>
                <li>Enable two-factor authentication when available</li>
                <li>Never share your password</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2024 React Fast Training. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Password Changed - React Fast Training',
      html,
    });
  }
}