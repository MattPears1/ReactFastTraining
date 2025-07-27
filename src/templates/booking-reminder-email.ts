import { CourseSchedule } from '@/types/booking.types';
import { VENUE_CONFIG } from '@/config/venues.config';
import { formatDate, formatTime, formatCountdown } from '@/utils/dateFormatting';

interface BookingReminderEmailData {
  confirmationCode: string;
  firstName: string;
  lastName: string;
  email: string;
  courseSchedule: CourseSchedule;
  numberOfParticipants: number;
  daysUntilCourse: number;
}

export const generateBookingReminderEmail = (data: BookingReminderEmailData): {
  subject: string;
  htmlContent: string;
  textContent: string;
} => {
  const venue = VENUE_CONFIG[data.courseSchedule.venue as keyof typeof VENUE_CONFIG];
  const courseDate = formatDate(data.courseSchedule.startDate);
  const courseTime = `${formatTime(data.courseSchedule.startDate)} - ${formatTime(data.courseSchedule.endDate)}`;
  
  const reminderType = data.daysUntilCourse === 1 ? 'Tomorrow' : `${data.daysUntilCourse} Days`;
  const subject = `Course Reminder: ${data.courseSchedule.courseName} - ${reminderType}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Reminder</title>
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
      background-color: #F97316;
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .countdown-banner {
      background-color: #FEF3C7;
      padding: 20px;
      text-align: center;
      border-bottom: 3px solid #F59E0B;
    }
    .countdown-number {
      font-size: 48px;
      font-weight: bold;
      color: #D97706;
      margin: 10px 0;
    }
    .content {
      padding: 40px 30px;
    }
    .course-info {
      background-color: #F0F9FF;
      border: 2px solid #0EA5E9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .detail-label {
      font-weight: 600;
      color: #666;
    }
    .detail-value {
      text-align: right;
      color: #333;
    }
    .checklist {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .checklist h3 {
      margin-top: 0;
      color: #0284C7;
    }
    .checklist li {
      margin: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    .checklist li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10B981;
      font-weight: bold;
    }
    .map-button {
      display: inline-block;
      background-color: #0EA5E9;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
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
      <h1>Course Reminder!</h1>
    </div>
    
    <div class="countdown-banner">
      <p style="margin: 0; font-size: 18px;">Your course is in</p>
      <div class="countdown-number">${data.daysUntilCourse === 1 ? 'TOMORROW' : `${data.daysUntilCourse} DAYS`}</div>
    </div>
    
    <div class="content">
      <p>Hi ${data.firstName},</p>
      
      <p>This is a friendly reminder about your upcoming first aid training course with React Fast Training.</p>
      
      <div class="course-info">
        <h2 style="margin-top: 0; color: #0284C7;">Course Details</h2>
        <div class="detail-row">
          <span class="detail-label">Course:</span>
          <span class="detail-value"><strong>${data.courseSchedule.courseName}</strong></span>
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
          <span class="detail-label">Participants:</span>
          <span class="detail-value">${data.numberOfParticipants} ${data.numberOfParticipants === 1 ? 'person' : 'people'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Confirmation Code:</span>
          <span class="detail-value">${data.confirmationCode}</span>
        </div>
      </div>
      
      ${venue && venue.mapUrl ? `
      <div style="text-align: center;">
        <a href="${venue.mapUrl}" class="map-button">
          📍 Get Directions
        </a>
      </div>
      ` : ''}
      
      <div class="checklist">
        <h3>Before You Arrive</h3>
        <ul style="list-style: none; margin: 0; padding: 0;">
          <li>Arrive 15 minutes early for registration</li>
          <li>Bring photo ID and this confirmation</li>
          <li>Wear comfortable clothing for practical sessions</li>
          <li>Bring any required medication (inhaler, EpiPen, etc.)</li>
          <li>Have breakfast - it's going to be an active day!</li>
        </ul>
      </div>
      
      <div class="checklist">
        <h3>What We'll Provide</h3>
        <ul style="list-style: none; margin: 0; padding: 0;">
          <li>All training materials and equipment</li>
          <li>Lunch and refreshments throughout the day</li>
          <li>Free parking at the venue</li>
          <li>Certificate upon successful completion</li>
          <li>Access to online resources</li>
        </ul>
      </div>
      
      ${data.daysUntilCourse > 5 ? `
      <div style="background-color: #EFF6FF; border: 1px solid #3B82F6; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Need to reschedule?</strong> You can still make changes to your booking up to 5 working days before the course. Contact us at <a href="mailto:bookings@reactfasttraining.co.uk">bookings@reactfasttraining.co.uk</a></p>
      </div>
      ` : ''}
      
      <p>We're looking forward to seeing you on the course! If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      The React Fast Training Team</p>
    </div>
    
    <div class="footer">
      <p><strong>React Fast Training</strong><br>
      Yorkshire's Premier First Aid Training Provider</p>
      <p>Email: booking@reactfasttraining.co.uk | Phone: 01234 567890</p>
      <p>This reminder was sent to ${data.email}<br>
      © ${new Date().getFullYear()} React Fast Training. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  const textContent = `
Course Reminder - React Fast Training

Hi ${data.firstName},

Your first aid training course is ${data.daysUntilCourse === 1 ? 'TOMORROW' : `in ${data.daysUntilCourse} days`}!

COURSE DETAILS:
- Course: ${data.courseSchedule.courseName}
- Date: ${courseDate}
- Time: ${courseTime}
- Venue: ${data.courseSchedule.venueName}
${venue ? `- Address: ${venue.address}` : ''}
- Participants: ${data.numberOfParticipants} ${data.numberOfParticipants === 1 ? 'person' : 'people'}
- Confirmation Code: ${data.confirmationCode}

BEFORE YOU ARRIVE:
✓ Arrive 15 minutes early for registration
✓ Bring photo ID and this confirmation
✓ Wear comfortable clothing for practical sessions
✓ Bring any required medication (inhaler, EpiPen, etc.)
✓ Have breakfast - it's going to be an active day!

WHAT WE'LL PROVIDE:
✓ All training materials and equipment
✓ Lunch and refreshments throughout the day
✓ Free parking at the venue
✓ Certificate upon successful completion
✓ Access to online resources

${venue && venue.mapUrl ? `GET DIRECTIONS: ${venue.mapUrl}` : ''}

${data.daysUntilCourse > 5 ? `Need to reschedule? You can still make changes to your booking up to 5 working days before the course. Contact us at booking@reactfasttraining.co.uk` : ''}

We're looking forward to seeing you on the course! If you have any questions, please don't hesitate to contact us.

Best regards,
The React Fast Training Team

---
React Fast Training
Yorkshire's Premier First Aid Training Provider
Email: booking@reactfasttraining.co.uk
Phone: 01234 567890

This reminder was sent to ${data.email}
© ${new Date().getFullYear()} React Fast Training. All rights reserved.
  `.trim();
  
  return {
    subject,
    htmlContent,
    textContent
  };
};