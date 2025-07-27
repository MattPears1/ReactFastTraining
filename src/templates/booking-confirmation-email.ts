import { CourseSchedule } from '@/types/booking.types';
import { VENUE_CONFIG } from '@/config/venues.config';
import { formatDate, formatTime } from '@/utils/dateFormatting';

interface BookingConfirmationEmailData {
  confirmationCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courseSchedule: CourseSchedule;
  numberOfParticipants: number;
  totalPrice: number;
  participants?: Array<{
    firstName: string;
    lastName: string;
  }>;
}

export const generateBookingConfirmationEmail = (data: BookingConfirmationEmailData): {
  subject: string;
  htmlContent: string;
  textContent: string;
} => {
  const venue = VENUE_CONFIG[data.courseSchedule.venue as keyof typeof VENUE_CONFIG];
  const courseDate = formatDate(data.courseSchedule.startDate);
  const courseTime = `${formatTime(data.courseSchedule.startDate)} - ${formatTime(data.courseSchedule.endDate)}`;
  
  const subject = `Booking Confirmation - ${data.courseSchedule.courseName} - ${data.confirmationCode}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #0EA5E9;
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .confirmation-box {
      background-color: #F0F9FF;
      border: 2px solid #0EA5E9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .confirmation-code {
      font-size: 24px;
      font-weight: bold;
      color: #0284C7;
      margin: 10px 0;
    }
    .details-section {
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #666;
    }
    .detail-value {
      text-align: right;
      color: #333;
    }
    .important-info {
      background-color: #FEF3C7;
      border: 1px solid #F59E0B;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .important-info h3 {
      margin-top: 0;
      color: #D97706;
    }
    .participants-list {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #0EA5E9;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-value {
        text-align: left;
        margin-top: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed!</h1>
    </div>
    
    <div class="content">
      <p>Dear ${data.firstName} ${data.lastName},</p>
      
      <p>Thank you for booking your first aid training with React Fast Training. Your booking has been confirmed and we look forward to seeing you on the course.</p>
      
      <div class="confirmation-box">
        <p style="margin: 0;">Your Confirmation Code:</p>
        <div class="confirmation-code">${data.confirmationCode}</div>
        <p style="margin: 0; font-size: 14px;">Please keep this code for your records</p>
      </div>
      
      <div class="details-section">
        <h2>Course Details</h2>
        <div class="detail-row">
          <span class="detail-label">Course:</span>
          <span class="detail-value">${data.courseSchedule.courseName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${courseDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${courseTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">${data.courseSchedule.venueName}</span>
        </div>
        ${venue ? `
        <div class="detail-row">
          <span class="detail-label">Address:</span>
          <span class="detail-value">${venue.address}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Instructor:</span>
          <span class="detail-value">${data.courseSchedule.instructorName}</span>
        </div>
      </div>
      
      <div class="details-section">
        <h2>Booking Summary</h2>
        <div class="detail-row">
          <span class="detail-label">Number of Participants:</span>
          <span class="detail-value">${data.numberOfParticipants}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Paid:</span>
          <span class="detail-value" style="font-weight: bold; color: #0EA5E9;">£${data.totalPrice.toFixed(2)}</span>
        </div>
      </div>
      
      ${data.participants && data.participants.length > 0 ? `
      <div class="participants-list">
        <h3>Registered Participants</h3>
        <ol>
          <li>${data.firstName} ${data.lastName} (Primary Contact)</li>
          ${data.participants.map(p => `<li>${p.firstName} ${p.lastName}</li>`).join('')}
        </ol>
      </div>
      ` : ''}
      
      <div class="important-info">
        <h3>Important Information</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Please arrive 15 minutes before the course start time</li>
          <li>Bring a form of ID and this confirmation email</li>
          <li>Wear comfortable clothing suitable for practical exercises</li>
          <li>Lunch and refreshments will be provided</li>
          <li>Free parking is available at the venue</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://reactfasttraining.co.uk/client/bookings/${data.confirmationCode}" class="button">
          View Booking Details
        </a>
      </div>
      
      <div style="margin-top: 30px;">
        <h3>Need to Make Changes?</h3>
        <p>If you need to cancel or reschedule your booking, please contact us at least 5 working days before the course date:</p>
        <ul>
          <li>Email: <a href="mailto:booking@reactfasttraining.co.uk">booking@reactfasttraining.co.uk</a></li>
          <li>Phone: <a href="tel:01234567890">01234 567890</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>React Fast Training</strong><br>
      Yorkshire's Premier First Aid Training Provider</p>
      <p>This email was sent to ${data.email}<br>
      © ${new Date().getFullYear()} React Fast Training. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  const textContent = `
Booking Confirmation - React Fast Training

Dear ${data.firstName} ${data.lastName},

Thank you for booking your first aid training with React Fast Training. Your booking has been confirmed.

CONFIRMATION CODE: ${data.confirmationCode}
(Please keep this code for your records)

COURSE DETAILS:
- Course: ${data.courseSchedule.courseName}
- Date: ${courseDate}
- Time: ${courseTime}
- Venue: ${data.courseSchedule.venueName}
${venue ? `- Address: ${venue.address}` : ''}
- Instructor: ${data.courseSchedule.instructorName}

BOOKING SUMMARY:
- Number of Participants: ${data.numberOfParticipants}
- Total Paid: £${data.totalPrice.toFixed(2)}

${data.participants && data.participants.length > 0 ? `
REGISTERED PARTICIPANTS:
1. ${data.firstName} ${data.lastName} (Primary Contact)
${data.participants.map((p, i) => `${i + 2}. ${p.firstName} ${p.lastName}`).join('\n')}
` : ''}

IMPORTANT INFORMATION:
- Please arrive 15 minutes before the course start time
- Bring a form of ID and this confirmation email
- Wear comfortable clothing suitable for practical exercises
- Lunch and refreshments will be provided
- Free parking is available at the venue

To view your booking details online, visit:
https://reactfasttraining.co.uk/client/bookings/${data.confirmationCode}

NEED TO MAKE CHANGES?
If you need to cancel or reschedule your booking, please contact us at least 5 working days before the course date:
- Email: booking@reactfasttraining.co.uk
- Phone: 01234 567890

Best regards,
React Fast Training Team

---
React Fast Training
Yorkshire's Premier First Aid Training Provider
https://reactfasttraining.co.uk

This email was sent to ${data.email}
© ${new Date().getFullYear()} React Fast Training. All rights reserved.
  `.trim();
  
  return {
    subject,
    htmlContent,
    textContent
  };
};