import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Booking, Certificate, CourseSession} from '../models';
import {BookingRepository} from '../repositories';
import * as nodemailer from 'nodemailer';

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
}