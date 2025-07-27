import { EmailService } from '../email.service';
import { PDFService } from '../pdf.service';
import { CalendarService } from '../calendar.service';
import { format } from 'date-fns';

interface BookingWithDetails {
  id: string;
  bookingReference: string;
  numberOfAttendees: number;
  totalAmount: string;
  specialRequirements?: string;
  courseDetails: {
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
    duration: string;
    price: number;
  };
  attendees: Array<{
    name: string;
    email: string;
    isPrimary: boolean;
  }>;
}

export class BookingEmailService extends EmailService {
  static async sendBookingConfirmation(booking: BookingWithDetails) {
    // Generate PDF confirmation
    const pdfBuffer = await PDFService.generateBookingConfirmation(booking);
    
    // Generate calendar file
    const sessionDate = new Date(booking.courseDetails.sessionDate);
    const [startHour, startMinute] = booking.courseDetails.startTime.split(':').map(Number);
    const [endHour, endMinute] = booking.courseDetails.endTime.split(':').map(Number);
    
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
    
    const icsContent = CalendarService.generateICS({
      title: booking.courseDetails.courseType,
      start: startDateTime,
      end: endDateTime,
      location: booking.courseDetails.location,
      description: `React Fast Training - ${booking.courseDetails.courseType}\nBooking Reference: ${booking.bookingReference}\n\nPlease arrive 15 minutes before the start time.\nBring photo ID for registration.`,
    });

    // Send to primary attendee
    const primaryAttendee = booking.attendees.find(a => a.isPrimary) || booking.attendees[0];
    
    await this.sendEmail({
      to: primaryAttendee.email,
      subject: `Booking Confirmed - ${booking.courseDetails.courseType} on ${format(sessionDate, 'dd/MM/yyyy')} | React Fast Training`,
      html: this.renderBookingConfirmationEmail(booking, primaryAttendee),
      attachments: [
        {
          filename: `booking-${booking.bookingReference}.pdf`,
          content: pdfBuffer,
        },
        {
          filename: 'course-booking.ics',
          content: Buffer.from(icsContent),
        },
      ],
    });

    // Send to additional attendees
    const additionalAttendees = booking.attendees.filter(a => !a.isPrimary);
    for (const attendee of additionalAttendees) {
      await this.sendEmail({
        to: attendee.email,
        subject: `You're registered for ${booking.courseDetails.courseType} | React Fast Training`,
        html: this.renderAttendeeEmail(booking, attendee, primaryAttendee),
      });
    }
  }

  private static renderBookingConfirmationEmail(booking: BookingWithDetails, attendee: any): string {
    const sessionDate = new Date(booking.courseDetails.sessionDate);
    const formattedDate = format(sessionDate, 'EEEE, d MMMM yyyy');
    
    const attendeeListHtml = booking.attendees
      .map((a, index) => `${index + 1}. ${a.name} (${a.email})`)
      .join('<br>');
    
    const specialRequirementsHtml = booking.specialRequirements 
      ? `<p><strong>Special Requirements:</strong><br>${booking.specialRequirements}</p>`
      : '';

    const downloadUrl = `${process.env.FRONTEND_URL || 'https://reactfasttraining.co.uk'}/bookings/${booking.bookingReference}/download`;
    const calendarUrl = `${process.env.FRONTEND_URL || 'https://reactfasttraining.co.uk'}/bookings/${booking.bookingReference}/calendar`;
    const manageBookingUrl = `${process.env.FRONTEND_URL || 'https://reactfasttraining.co.uk'}/my-bookings`;
    const termsUrl = `${process.env.FRONTEND_URL || 'https://reactfasttraining.co.uk'}/terms`;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px 20px; background-color: #f8f9fa; }
        .booking-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .booking-ref { font-size: 24px; font-weight: bold; color: #0EA5E9; text-align: center; padding: 15px; background: #E0F2FE; border-radius: 8px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { color: #666; }
        .detail-value { font-weight: 600; }
        .button { display: inline-block; padding: 12px 30px; background-color: #0EA5E9; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .button-secondary { background-color: #6B7280; }
        .footer { background-color: #1F2937; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .important-box { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .attendee-list { background: #F3F4F6; padding: 15px; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Booking Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for booking with React Fast Training</p>
        </div>
        
        <div class="content">
            <div class="booking-box">
                <div class="booking-ref">
                    Booking Reference: ${booking.bookingReference}
                </div>
            </div>

            <div class="booking-box">
                <h2 style="margin-top: 0; color: #1F2937;">Course Details</h2>
                <div class="detail-row">
                    <span class="detail-label">Course:</span>
                    <span class="detail-value">${booking.courseDetails.courseType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${booking.courseDetails.startTime} - ${booking.courseDetails.endTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${booking.courseDetails.location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${booking.courseDetails.duration}</span>
                </div>
            </div>

            <div class="booking-box">
                <h2 style="margin-top: 0; color: #1F2937;">Attendee Information</h2>
                <p>This booking is for <strong>${booking.numberOfAttendees} attendee(s)</strong>:</p>
                <div class="attendee-list">
                    ${attendeeListHtml}
                </div>
                ${specialRequirementsHtml}
            </div>

            <div class="booking-box">
                <h2 style="margin-top: 0; color: #1F2937;">Payment Summary</h2>
                <div class="detail-row">
                    <span class="detail-label">Course Fee (${booking.numberOfAttendees} × £${booking.courseDetails.price}):</span>
                    <span class="detail-value">£${booking.totalAmount}</span>
                </div>
                <div class="detail-row" style="border-bottom: none; font-size: 18px;">
                    <span class="detail-label"><strong>Total Paid:</strong></span>
                    <span class="detail-value" style="color: #10B981;"><strong>£${booking.totalAmount}</strong></span>
                </div>
            </div>

            <div class="important-box">
                <h3 style="margin-top: 0;">📋 Important Information</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Please arrive 15 minutes before the start time</li>
                    <li>Wear comfortable clothing suitable for practical exercises</li>
                    <li>Bring a form of photo ID for registration</li>
                    <li>Lunch and refreshments will be provided</li>
                    <li>Free parking available at the venue</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${downloadUrl}" class="button">Download Confirmation</a>
                <a href="${calendarUrl}" class="button button-secondary">Add to Calendar</a>
            </div>

            <div class="booking-box">
                <h3 style="margin-top: 0;">Need to Make Changes?</h3>
                <p>You can manage your booking online:</p>
                <ul>
                    <li>View or download your booking confirmation</li>
                    <li>Request to reschedule (subject to availability)</li>
                    <li>Update attendee information</li>
                    <li>Cancel your booking (see our <a href="${termsUrl}">cancellation policy</a>)</li>
                </ul>
                <p style="text-align: center;">
                    <a href="${manageBookingUrl}" class="button">Manage Booking</a>
                </p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0;"><strong>React Fast Training</strong></p>
            <p style="margin: 0 0 10px 0;">Yorkshire's Premier First Aid Training Provider</p>
            <p style="margin: 0 0 10px 0;">
                📧 info@reactfasttraining.co.uk | 📞 07447 485644
            </p>
            <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                This is an automated email. Please do not reply directly to this message.
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  private static renderAttendeeEmail(booking: BookingWithDetails, attendee: any, primaryAttendee: any): string {
    const sessionDate = new Date(booking.courseDetails.sessionDate);
    const formattedDate = format(sessionDate, 'EEEE, d MMMM yyyy');

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px 20px; background-color: #f8f9fa; }
        .booking-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .important-box { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { background-color: #1F2937; color: white; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Registered!</h1>
        </div>
        
        <div class="content">
            <p>Hi ${attendee.name},</p>
            
            <p>${primaryAttendee.name} has registered you for the following course:</p>
            
            <div class="booking-box">
                <h2 style="margin-top: 0; color: #1F2937;">Course Details</h2>
                <p><strong>Course:</strong> ${booking.courseDetails.courseType}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${booking.courseDetails.startTime} - ${booking.courseDetails.endTime}</p>
                <p><strong>Location:</strong> ${booking.courseDetails.location}</p>
                <p><strong>Duration:</strong> ${booking.courseDetails.duration}</p>
            </div>
            
            <div class="important-box">
                <h3 style="margin-top: 0;">What to Bring</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Please arrive 15 minutes before the start time</li>
                    <li>Wear comfortable clothing suitable for practical exercises</li>
                    <li>Bring a form of photo ID for registration</li>
                    <li>Lunch and refreshments will be provided</li>
                    <li>Free parking available at the venue</li>
                </ul>
            </div>
            
            <p>If you have any questions, please contact the primary booking holder (${primaryAttendee.name} - ${primaryAttendee.email}) 
               or call us on 07447 485644.</p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;"><strong>React Fast Training</strong></p>
            <p style="margin: 0 0 10px 0;">Yorkshire's Premier First Aid Training Provider</p>
            <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                This is an automated email. Please do not reply directly to this message.
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  static async sendBookingReminder(booking: BookingWithDetails) {
    const subject = `Reminder: ${booking.courseDetails.courseType} tomorrow`;
    const html = this.renderReminderEmail(booking);

    // Send to all attendees
    for (const attendee of booking.attendees) {
      await this.sendEmail({
        to: attendee.email,
        subject,
        html,
      });
    }
  }

  private static renderReminderEmail(booking: BookingWithDetails): string {
    // Implementation for reminder email template
    return `<p>Reminder email template</p>`;
  }
}