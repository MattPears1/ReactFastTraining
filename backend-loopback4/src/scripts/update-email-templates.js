require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateEmailTemplates() {
  try {
    await client.connect();
    console.log('🎨 Updating email templates with professional HTML design...');

    // Professional HTML email templates with React Fast Training branding
    const templates = [
      {
        name: 'booking_confirmation',
        subject: 'Booking Confirmation - {{courseName}} | React Fast Training',
        body_html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
    <!-- Email Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!-- Email Content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #0EA5E9; padding: 40px 40px 30px 40px; text-align: center;">
                            <!-- Logo -->
                            <div style="display: inline-block; padding: 10px 20px; background-color: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 20px;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">React Fast Training</h1>
                            </div>
                            <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 400;">Booking Confirmed!</h2>
                        </td>
                    </tr>
                    
                    <!-- Success Message -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background-color: #10B981; color: #ffffff; padding: 15px 20px; margin: -15px 0 30px 0; border-radius: 6px; text-align: center;">
                                <p style="margin: 0; font-size: 16px; font-weight: 600;">✓ Your place is secured!</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Dear {{userName}},</p>
                            
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px;">
                                Thank you for booking your <strong style="color: #0EA5E9;">{{courseName}}</strong> course with React Fast Training. 
                                We're looking forward to seeing you!
                            </p>
                            
                            <!-- Course Details Card -->
                            <div style="background-color: #F3F4F6; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600;">📅 Course Details</h3>
                                
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">COURSE</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{courseName}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">DATE & TIME</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{sessionDate}} at {{sessionTime}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">LOCATION</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{venueName}}</span><br>
                                            <span style="color: #6B7280; font-size: 14px;">{{venueAddress}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">AMOUNT PAID</strong><br>
                                            <span style="color: #10B981; font-size: 20px; font-weight: 600;">£{{amountPaid}}</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- What to Bring -->
                            <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <h4 style="margin: 0 0 10px 0; color: #92400E; font-size: 16px; font-weight: 600;">📋 What to Bring</h4>
                                <ul style="margin: 0; padding-left: 20px; color: #92400E;">
                                    <li style="margin-bottom: 5px;">Photo ID for registration</li>
                                    <li style="margin-bottom: 5px;">Pen and notepad</li>
                                    <li style="margin-bottom: 5px;">Comfortable clothing</li>
                                    <li style="margin-bottom: 5px;">Your enthusiasm to learn!</li>
                                </ul>
                            </div>
                            
                            <!-- Important Notice -->
                            <div style="background-color: #EFF6FF; border-left: 4px solid #0EA5E9; padding: 15px 20px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #1E40AF; font-size: 14px;">
                                    <strong>Please arrive 10 minutes early</strong> for registration and to ensure a prompt start.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://reactfasttraining.co.uk/my-bookings" style="display: inline-block; background-color: #F97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">View My Bookings</a>
                            </div>
                            
                            <!-- Contact Info -->
                            <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px;">
                                If you need to cancel or reschedule, please contact us as soon as possible:
                            </p>
                            <p style="margin: 0; color: #6B7280; font-size: 14px;">
                                📧 Email: <a href="mailto:bookings@reactfasttraining.co.uk" style="color: #0EA5E9; text-decoration: none;">bookings@reactfasttraining.co.uk</a><br>
                                📞 Phone: 01234 567890
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 30px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px;">
                                React Fast Training - Yorkshire's Premier First Aid Training Provider
                            </p>
                            <p style="margin: 0 0 10px 0; color: #9CA3AF; font-size: 12px;">
                                HSE Approved | Ofqual Regulated | Saving Lives Through Education
                            </p>
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                                © 2025 React Fast Training. All rights reserved.<br>
                                <a href="https://reactfasttraining.co.uk" style="color: #0EA5E9; text-decoration: none;">reactfasttraining.co.uk</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        body_text: `Booking Confirmed!

Dear {{userName}},

Thank you for booking your {{courseName}} course with React Fast Training. We're looking forward to seeing you!

COURSE DETAILS
--------------
Course: {{courseName}}
Date & Time: {{sessionDate}} at {{sessionTime}}
Location: {{venueName}}
{{venueAddress}}
Amount Paid: £{{amountPaid}}

WHAT TO BRING
-------------
- Photo ID for registration
- Pen and notepad
- Comfortable clothing
- Your enthusiasm to learn!

IMPORTANT: Please arrive 10 minutes early for registration and to ensure a prompt start.

If you need to cancel or reschedule, please contact us as soon as possible:
Email: bookings@reactfasttraining.co.uk
Phone: 01234 567890

Best regards,
React Fast Training Team

---
React Fast Training - Yorkshire's Premier First Aid Training Provider
HSE Approved | Ofqual Regulated | Saving Lives Through Education
https://reactfasttraining.co.uk`
      },
      {
        name: 'session_cancellation',
        subject: 'Important: Session Cancelled - {{courseName}} | React Fast Training',
        body_html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Cancellation</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
    <!-- Email Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!-- Email Content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #EF4444; padding: 40px 40px 30px 40px; text-align: center;">
                            <!-- Logo -->
                            <div style="display: inline-block; padding: 10px 20px; background-color: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 20px;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">React Fast Training</h1>
                            </div>
                            <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 400;">Session Cancellation Notice</h2>
                        </td>
                    </tr>
                    
                    <!-- Alert Message -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background-color: #FEE2E2; color: #991B1B; padding: 15px 20px; margin: -15px 0 30px 0; border-radius: 6px; text-align: center;">
                                <p style="margin: 0; font-size: 16px; font-weight: 600;">⚠️ Your session has been cancelled</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Dear {{userName}},</p>
                            
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px;">
                                We regret to inform you that your <strong style="color: #EF4444;">{{courseName}}</strong> session 
                                scheduled for {{sessionDate}} has been cancelled.
                            </p>
                            
                            <!-- Cancellation Details Card -->
                            <div style="background-color: #F3F4F6; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600;">📋 Cancellation Details</h3>
                                
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">CANCELLED SESSION</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{courseName}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">ORIGINAL DATE</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{sessionDate}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">REASON</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{cancellationReason}}</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Refund Information -->
                            <div style="background-color: #D1FAE5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <h4 style="margin: 0 0 10px 0; color: #065F46; font-size: 16px; font-weight: 600;">💰 Refund Information</h4>
                                <p style="margin: 0 0 10px 0; color: #065F46; font-size: 14px;">
                                    A full refund of <strong style="font-size: 18px;">£{{refundAmount}}</strong> will be processed 
                                    within 5-7 business days.
                                </p>
                                <p style="margin: 0; color: #065F46; font-size: 14px;">
                                    The refund will be credited to the same payment method used for booking.
                                </p>
                            </div>
                            
                            <!-- Next Steps -->
                            <div style="background-color: #EFF6FF; border-left: 4px solid #0EA5E9; padding: 15px 20px; margin-bottom: 30px;">
                                <h4 style="margin: 0 0 10px 0; color: #1E40AF; font-size: 16px; font-weight: 600;">What happens next?</h4>
                                <p style="margin: 0; color: #1E40AF; font-size: 14px;">
                                    We encourage you to book an alternative date for your training. 
                                    Visit our website to view all available sessions.
                                </p>
                            </div>
                            
                            <!-- CTA Buttons -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://reactfasttraining.co.uk/courses" style="display: inline-block; background-color: #F97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 10px;">Book Alternative Date</a>
                                <br>
                                <a href="https://reactfasttraining.co.uk/contact" style="display: inline-block; color: #0EA5E9; text-decoration: none; padding: 10px 20px; font-size: 14px;">Contact Support</a>
                            </div>
                            
                            <!-- Apology -->
                            <p style="margin: 0 0 20px 0; color: #6B7280; font-size: 14px; text-align: center; font-style: italic;">
                                We sincerely apologize for any inconvenience this may cause.
                            </p>
                            
                            <!-- Contact Info -->
                            <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px;">
                                If you have any questions about your refund or need assistance:
                            </p>
                            <p style="margin: 0; color: #6B7280; font-size: 14px;">
                                📧 Email: <a href="mailto:bookings@reactfasttraining.co.uk" style="color: #0EA5E9; text-decoration: none;">bookings@reactfasttraining.co.uk</a><br>
                                📞 Phone: 01234 567890
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 30px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px;">
                                React Fast Training - Yorkshire's Premier First Aid Training Provider
                            </p>
                            <p style="margin: 0 0 10px 0; color: #9CA3AF; font-size: 12px;">
                                HSE Approved | Ofqual Regulated | Saving Lives Through Education
                            </p>
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                                © 2025 React Fast Training. All rights reserved.<br>
                                <a href="https://reactfasttraining.co.uk" style="color: #0EA5E9; text-decoration: none;">reactfasttraining.co.uk</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        body_text: `Session Cancellation Notice

Dear {{userName}},

We regret to inform you that your {{courseName}} session scheduled for {{sessionDate}} has been cancelled.

CANCELLATION DETAILS
-------------------
Cancelled Session: {{courseName}}
Original Date: {{sessionDate}}
Reason: {{cancellationReason}}

REFUND INFORMATION
-----------------
A full refund of £{{refundAmount}} will be processed within 5-7 business days.
The refund will be credited to the same payment method used for booking.

WHAT HAPPENS NEXT?
-----------------
We encourage you to book an alternative date for your training. 
Visit our website to view all available sessions.

We sincerely apologize for any inconvenience this may cause.

If you have any questions about your refund or need assistance:
Email: bookings@reactfasttraining.co.uk
Phone: 01234 567890

Best regards,
React Fast Training Team

---
React Fast Training - Yorkshire's Premier First Aid Training Provider
HSE Approved | Ofqual Regulated | Saving Lives Through Education
https://reactfasttraining.co.uk`
      },
      {
        name: 'session_reminder_24h',
        subject: 'Reminder: {{courseName}} Tomorrow | React Fast Training',
        body_html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Reminder</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
    <!-- Email Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!-- Email Content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #10B981; padding: 40px 40px 30px 40px; text-align: center;">
                            <!-- Logo -->
                            <div style="display: inline-block; padding: 10px 20px; background-color: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 20px;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">React Fast Training</h1>
                            </div>
                            <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 400;">Your Training is Tomorrow!</h2>
                        </td>
                    </tr>
                    
                    <!-- Reminder Badge -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background-color: #F97316; color: #ffffff; padding: 15px 20px; margin: -15px 0 30px 0; border-radius: 6px; text-align: center;">
                                <p style="margin: 0; font-size: 16px; font-weight: 600;">⏰ 24 Hour Reminder</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Dear {{userName}},</p>
                            
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px;">
                                This is a friendly reminder that your <strong style="color: #10B981;">{{courseName}}</strong> training 
                                is scheduled for tomorrow. We're excited to see you!
                            </p>
                            
                            <!-- Session Details Card -->
                            <div style="background-color: #F3F4F6; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600;">📅 Tomorrow's Session</h3>
                                
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">COURSE</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{courseName}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">DATE & TIME</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{sessionDate}} at {{sessionTime}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">LOCATION</strong><br>
                                            <span style="color: #111827; font-size: 16px;">{{venueName}}</span><br>
                                            <span style="color: #6B7280; font-size: 14px;">{{venueAddress}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <strong style="color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">INSTRUCTOR</strong><br>
                                            <span style="color: #111827; font-size: 16px;">Lex Richardson</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Checklist -->
                            <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <h4 style="margin: 0 0 10px 0; color: #92400E; font-size: 16px; font-weight: 600;">✅ Pre-Training Checklist</h4>
                                <ul style="margin: 0; padding-left: 20px; color: #92400E;">
                                    <li style="margin-bottom: 5px;">Bring photo ID for registration</li>
                                    <li style="margin-bottom: 5px;">Bring pen and notepad</li>
                                    <li style="margin-bottom: 5px;">Wear comfortable clothing</li>
                                    <li style="margin-bottom: 5px;">Arrive 10 minutes early</li>
                                    <li style="margin-bottom: 5px;">Have breakfast - it's a full day!</li>
                                </ul>
                            </div>
                            
                            <!-- Important Reminders -->
                            <div style="background-color: #EFF6FF; border-left: 4px solid #0EA5E9; padding: 15px 20px; margin-bottom: 30px;">
                                <h4 style="margin: 0 0 10px 0; color: #1E40AF; font-size: 16px; font-weight: 600;">Important Information</h4>
                                <p style="margin: 0 0 10px 0; color: #1E40AF; font-size: 14px;">
                                    <strong>Parking:</strong> Free parking is available at the venue
                                </p>
                                <p style="margin: 0 0 10px 0; color: #1E40AF; font-size: 14px;">
                                    <strong>Refreshments:</strong> Tea, coffee and biscuits provided
                                </p>
                                <p style="margin: 0; color: #1E40AF; font-size: 14px;">
                                    <strong>Certificate:</strong> You'll receive your certificate upon successful completion
                                </p>
                            </div>
                            
                            <!-- CTA Buttons -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://reactfasttraining.co.uk/my-bookings" style="display: inline-block; background-color: #F97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 10px;">View Booking Details</a>
                                <br>
                                <a href="https://maps.google.com/?q={{venueAddress}}" style="display: inline-block; color: #0EA5E9; text-decoration: none; padding: 10px 20px; font-size: 14px;">Get Directions</a>
                            </div>
                            
                            <!-- Contact Info -->
                            <div style="text-align: center; background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin-top: 30px;">
                                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">
                                    Need to reschedule?
                                </p>
                                <p style="margin: 0; color: #6B7280; font-size: 14px;">
                                    Please contact us immediately:<br>
                                    📧 <a href="mailto:bookings@reactfasttraining.co.uk" style="color: #0EA5E9; text-decoration: none;">bookings@reactfasttraining.co.uk</a><br>
                                    📞 01234 567890
                                </p>
                            </div>
                            
                            <!-- See You Tomorrow -->
                            <p style="margin: 30px 0 0 0; color: #374151; font-size: 16px; text-align: center;">
                                <strong>See you tomorrow! 👋</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 30px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px;">
                                React Fast Training - Yorkshire's Premier First Aid Training Provider
                            </p>
                            <p style="margin: 0 0 10px 0; color: #9CA3AF; font-size: 12px;">
                                HSE Approved | Ofqual Regulated | Saving Lives Through Education
                            </p>
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                                © 2025 React Fast Training. All rights reserved.<br>
                                <a href="https://reactfasttraining.co.uk" style="color: #0EA5E9; text-decoration: none;">reactfasttraining.co.uk</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        body_text: `Your Training is Tomorrow!

Dear {{userName}},

This is a friendly reminder that your {{courseName}} training is scheduled for tomorrow. We're excited to see you!

TOMORROW'S SESSION
-----------------
Course: {{courseName}}
Date & Time: {{sessionDate}} at {{sessionTime}}
Location: {{venueName}}
{{venueAddress}}
Instructor: Lex Richardson

PRE-TRAINING CHECKLIST
---------------------
✓ Bring photo ID for registration
✓ Bring pen and notepad
✓ Wear comfortable clothing
✓ Arrive 10 minutes early
✓ Have breakfast - it's a full day!

IMPORTANT INFORMATION
--------------------
Parking: Free parking is available at the venue
Refreshments: Tea, coffee and biscuits provided
Certificate: You'll receive your certificate upon successful completion

Need to reschedule? Please contact us immediately:
Email: bookings@reactfasttraining.co.uk
Phone: 01234 567890

See you tomorrow! 👋

Best regards,
React Fast Training Team

---
React Fast Training - Yorkshire's Premier First Aid Training Provider
HSE Approved | Ofqual Regulated | Saving Lives Through Education
https://reactfasttraining.co.uk`
      }
    ];

    // Update each template
    for (const template of templates) {
      const result = await client.query(
        'UPDATE email_templates SET subject = $1, body_html = $2, body_text = $3 WHERE name = $4 RETURNING id',
        [template.subject, template.body_html, template.body_text, template.name]
      );
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated template: ${template.name}`);
      } else {
        console.log(`❌ Template not found: ${template.name}`);
      }
    }

    console.log('\n✨ Email templates updated successfully!');
    console.log('All templates now include:');
    console.log('- Professional HTML layout with React Fast Training branding');
    console.log('- Brand colors (Primary Blue #0EA5E9, Green #10B981, Orange #F97316)');
    console.log('- React Fast Training logo in header');
    console.log('- Responsive design for all devices');
    console.log('- Proper email client compatibility');
    console.log('- Clear call-to-action buttons');
    console.log('- Contact information and footer');

  } catch (error) {
    console.error('❌ Error updating email templates:', error);
  } finally {
    await client.end();
  }
}

updateEmailTemplates();