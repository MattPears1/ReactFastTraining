import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Booking, Certificate, CourseSession} from '../models';
import {BookingRepository} from '../repositories';
import * as nodemailer from 'nodemailer';
import {User} from '../db/schema/users';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

/**
 * Email Configuration & Routing:
 * - info@reactfasttraining.co.uk: General info, help & troubleshooting (default sender)
 * - bookings@reactfasttraining.co.uk: Booking queries & course administration
 * - lex@reactfasttraining.co.uk: Course content & instructor communication
 */

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

export interface TestimonialSubmission {
  authorName: string;
  authorEmail: string;
  authorLocation?: string;
  courseTaken: string;
  courseDate?: string;
  content: string;
  rating: number;
  showFullName: boolean;
  photoConsent?: string;
  bookingReference?: string;
  photoFile?: Express.Multer.File;
}

@injectable({scope: BindingScope.TRANSIENT})
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
  ) {
    const transportConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // for STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? '********' : 'NOT SET',
      },
    };
    console.log('📧 [EmailService] Initializing transporter with config:', transportConfig);

    this.transporter = nodemailer.createTransport(transportConfig);
    console.log('✅ [EmailService] Nodemailer transporter created.');
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'React Fast Training <info@reactfasttraining.co.uk>',
      ...options,
    };

    console.log('📤 [EmailService] Attempting to send email to:', mailOptions.to);
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [EmailService] Email sent successfully. Message ID:', info.messageId);
    } catch (error) {
      console.error('❌ [EmailService] Error sending email:', {
        code: error.code,
        message: error.message,
      });
      throw error;
    }
  }

  async sendBookingConfirmation(booking: Booking, session: CourseSession): Promise<void> {
    const sessionDate = new Date(session.startDate);
    const formattedDate = sessionDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f8f9fa; }
    .booking-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .booking-ref { font-size: 24px; font-weight: bold; color: #0EA5E9; text-align: center; padding: 15px; background: #E0F2FE; border-radius: 8px; margin-bottom: 20px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { color: #666; }
    .detail-value { font-weight: 600; }
    .important-box { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { background-color: #1F2937; color: white; padding: 20px; text-align: center; font-size: 14px; border-radius: 0 0 10px 10px; }
    .footer a { color: #60A5FA; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Booking Confirmed!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for booking with React Fast Training</p>
    </div>
    
    <div class="content">
      <div class="booking-ref">
        Booking Reference: ${booking.bookingReference}
      </div>

      <p>Dear ${booking.contactDetails.firstName} ${booking.contactDetails.lastName},</p>
      <p>Thank you for booking your first aid training with React Fast Training. Your place has been confirmed on the following course:</p>

      <div class="booking-box">
        <h2 style="margin-top: 0; color: #1F2937;">Course Details</h2>
        <div class="detail-row">
          <span class="detail-label">Course:</span>
          <span class="detail-value">${session.courseId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${session.startTime || '9:00 AM'} - ${session.endTime || '5:00 PM'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">South Yorkshire (full address to be provided)</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Number of Participants:</span>
          <span class="detail-value">${booking.numberOfParticipants}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Total Amount Paid:</span>
          <span class="detail-value" style="color: #10B981;">£${booking.finalAmount || booking.totalAmount}</span>
        </div>
      </div>

      <div class="important-box">
        <h3 style="margin-top: 0;">📋 Important Information</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Please arrive 15 minutes before the start time for registration</li>
          <li>Bring photo ID (passport or driving license)</li>
          <li>Wear comfortable clothing suitable for practical exercises</li>
          <li>Lunch and refreshments will be provided</li>
          <li>Free parking is available at the venue</li>
          <li>Minimum age requirement: 16 years</li>
        </ul>
      </div>

      <div class="booking-box">
        <h3 style="margin-top: 0;">Venue Location</h3>
        <p>The exact venue address and directions will be sent to you via email approximately 3-5 days before your course date.</p>
        <p>The venue will be in <strong>South Yorkshire</strong> with easy access and free parking.</p>
      </div>

      ${booking.participants && booking.participants.length > 1 ? `
      <div class="booking-box">
        <h3 style="margin-top: 0;">Participant Details</h3>
        <p>The following participants are registered for this course:</p>
        <ol style="margin: 10px 0; padding-left: 20px;">
          ${booking.participants.map(p => `
            <li>${p.firstName} ${p.lastName}${p.email ? ` (${p.email})` : ''}</li>
          `).join('')}
        </ol>
      </div>
      ` : ''}

      ${booking.specialRequirements ? `
      <div class="booking-box">
        <h3 style="margin-top: 0;">Special Requirements</h3>
        <p>${booking.specialRequirements}</p>
        <p style="font-style: italic;">We have noted your requirements and will ensure appropriate arrangements are made.</p>
      </div>
      ` : ''}

      <div class="booking-box">
        <h3 style="margin-top: 0;">Need to Make Changes?</h3>
        <p>If you need to reschedule or cancel your booking, please contact us as soon as possible:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Email: <a href="mailto:bookings@reactfasttraining.co.uk">bookings@reactfasttraining.co.uk</a></li>
          <li>Phone: 07447 485644</li>
        </ul>
        <p><small>Please note our cancellation policy applies. See our website for full terms and conditions.</small></p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 10px 0;"><strong>React Fast Training</strong></p>
      <p style="margin: 0 0 10px 0;">Yorkshire's Premier First Aid Training Provider</p>
      <p style="margin: 0 0 10px 0;">
        📧 <a href="mailto:info@reactfasttraining.co.uk">info@reactfasttraining.co.uk</a> |
        📞 07447 485644 |
        🌐 <a href="https://reactfasttraining.co.uk">reactfasttraining.co.uk</a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
        This email was sent to ${booking.contactDetails.email}. If you have any questions, please don't hesitate to contact us.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: booking.contactDetails.email,
      subject: `Booking Confirmation - ${session.courseId} - ${booking.bookingReference}`,
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

  async sendVenueDetails(booking: Booking, session: CourseSession): Promise<void> {
    const sessionDate = new Date(session.startDate);
    const formattedDate = sessionDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f8f9fa; }
    .venue-box { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; border-left: 4px solid #0EA5E9; }
    .map-button { display: inline-block; padding: 12px 30px; background-color: #0EA5E9; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .detail-row { padding: 8px 0; }
    .footer { background-color: #1F2937; color: white; padding: 20px; text-align: center; font-size: 14px; }
    .footer a { color: #60A5FA; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📍 Venue Details for Your Course</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">${formattedDate}</p>
    </div>
    
    <div class="content">
      <p>Dear ${booking.contactDetails.firstName},</p>
      <p>Your <strong>${session.courseId}</strong> course is coming up soon! Here are the venue details for your training:</p>

      <div class="venue-box">
        <h2 style="margin-top: 0; color: #1F2937;">Venue Information</h2>
        <div class="detail-row">
          <strong>Venue:</strong> React Fast Training Centre
        </div>
        <div class="detail-row">
          <strong>Address:</strong> [Specific venue address will be provided here]
        </div>
        <div class="detail-row">
          <strong>City:</strong> South Yorkshire
        </div>
        <div class="detail-row">
          <strong>Postcode:</strong> [Postcode]
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://maps.google.com/?q=[venue+address]" class="map-button">📍 Get Directions</a>
        </div>
      </div>

      <div class="venue-box">
        <h3 style="margin-top: 0;">Course Schedule</h3>
        <div class="detail-row">
          <strong>Date:</strong> ${formattedDate}
        </div>
        <div class="detail-row">
          <strong>Time:</strong> ${session.startTime || '9:00 AM'} - ${session.endTime || '5:00 PM'}
        </div>
        <div class="detail-row">
          <strong>Registration:</strong> Please arrive 15 minutes early
        </div>
      </div>

      <div class="venue-box">
        <h3 style="margin-top: 0;">Parking & Transport</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Free parking available on-site</li>
          <li>Accessible by public transport</li>
          <li>Wheelchair accessible venue</li>
        </ul>
      </div>

      <div class="venue-box">
        <h3 style="margin-top: 0;">Remember to Bring</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Photo ID (passport or driving license)</li>
          <li>Comfortable clothing for practical exercises</li>
          <li>Any medication you may need during the day</li>
        </ul>
      </div>

      <div style="background: #E0F2FE; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Need Help?</strong> If you have any questions or need assistance finding the venue, please call us on <strong>07447 485644</strong>.</p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 10px 0;"><strong>React Fast Training</strong></p>
      <p style="margin: 0 0 10px 0;">
        📧 <a href="mailto:info@reactfasttraining.co.uk">info@reactfasttraining.co.uk</a> |
        📞 07447 485644
      </p>
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
        Your booking reference: ${booking.bookingReference}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: booking.contactDetails.email,
      subject: `Venue Details - ${session.courseId} - ${formattedDate}`,
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

  async sendTestimonialNotification(testimonial: TestimonialSubmission): Promise<void> {
    console.log('📝 [EmailService] Sending testimonial notification email');

    try {
      // Read and compile the Handlebars template
      const templatePath = path.join(__dirname, '../templates/emails/testimonial-submission.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // Prepare template data
      const stars = Array.from({ length: 5 }, (_, i) => i < testimonial.rating);
      const templateData = {
        ...testimonial,
        stars,
        hasPhoto: !!testimonial.photoFile,
        photoConsent: testimonial.photoConsent === 'given',
        courseDate: testimonial.courseDate ? new Date(testimonial.courseDate).toLocaleDateString('en-GB') : null,
        submittedAt: new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const html = template(templateData);

      // Prepare attachments
      const attachments: Array<{filename: string; content: Buffer}> = [];
      if (testimonial.photoFile) {
        attachments.push({
          filename: testimonial.photoFile.originalname || 'testimonial-photo.jpg',
          content: testimonial.photoFile.buffer
        });
      }

      await this.sendEmail({
        to: 'info@reactfasttraining.co.uk',
        subject: `New Testimonial Submission - ${testimonial.rating} Stars - ${testimonial.courseTaken}`,
        html,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      console.log('✅ [EmailService] Testimonial notification sent successfully');
    } catch (error) {
      console.error('❌ [EmailService] Error sending testimonial notification:', error);
      throw error;
    }
  }

  async sendTestimonialConfirmation(testimonial: TestimonialSubmission): Promise<void> {
    console.log('📬 [EmailService] Sending testimonial confirmation copy to user');

    try {
      // Read and compile the confirmation template
      const templatePath = path.join(__dirname, '../templates/emails/testimonial-confirmation.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // Prepare template data
      const stars = Array.from({ length: 5 }, (_, i) => i < testimonial.rating);
      const templateData = {
        ...testimonial,
        stars,
        hasPhoto: !!testimonial.photoFile,
        photoConsent: testimonial.photoConsent === 'given',
        courseDate: testimonial.courseDate ? new Date(testimonial.courseDate).toLocaleDateString('en-GB') : null,
        submittedAt: new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const html = template(templateData);

      // Prepare attachments (include photo if uploaded)
      const attachments: Array<{filename: string; content: Buffer}> = [];
      if (testimonial.photoFile) {
        attachments.push({
          filename: testimonial.photoFile.originalname || 'your-testimonial-photo.jpg',
          content: testimonial.photoFile.buffer
        });
      }

      await this.sendEmail({
        to: testimonial.authorEmail,
        subject: `Thank you for your testimonial - React Fast Training`,
        html,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      console.log('✅ [EmailService] Testimonial confirmation sent successfully to user');
    } catch (error) {
      console.error('❌ [EmailService] Error sending testimonial confirmation:', error);
      throw error;
    }
  }
}