import { post, get, requestBody, param, HttpErrors } from '@loopback/rest';
import { inject } from '@loopback/core';
import { EmailService } from '../services/email.service';
import { db } from '../config/database.config';
import { courseSessions } from '../db/schema';
import { bookingInquiries } from '../db/schema/booking-inquiries';
import { eq, and, gt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface BookingInquiryRequest {
  courseScheduleId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  numberOfPeople: number;
  questions: string;
  preferredPaymentMethod: 'online' | 'bank_transfer' | 'cash';
  marketingConsent: boolean;
  courseDetails: {
    courseName: string;
    date: string;
    time: string;
    venue: string;
    price: number;
  };
}

export class BookingInquiryController {
  constructor(
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  @post('/api/bookings/inquiry')
  async createInquiry(
    @requestBody() inquiryData: BookingInquiryRequest
  ) {
    try {
      // Generate inquiry reference
      const inquiryReference = `INQ-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      // Calculate expiry time (24 hours from now)
      const holdExpiresAt = new Date();
      holdExpiresAt.setHours(holdExpiresAt.getHours() + 24);
      
      // Validate course session exists
      const session = await db.select()
        .from(courseSessions)
        .where(eq(courseSessions.id, inquiryData.courseScheduleId))
        .limit(1);
        
      if (!session.length) {
        throw new HttpErrors.NotFound('Course session not found');
      }
      
      // Check if there are enough available spaces
      const availableSpaces = session[0].maxCapacity - session[0].currentCapacity;
      if (availableSpaces < inquiryData.numberOfPeople) {
        throw new HttpErrors.BadRequest(`Only ${availableSpaces} spaces available for this session`);
      }
      
      // Save inquiry to database
      const [savedInquiry] = await db.insert(bookingInquiries).values({
        inquiryReference,
        courseSessionId: inquiryData.courseScheduleId,
        firstName: inquiryData.firstName,
        lastName: inquiryData.lastName,
        email: inquiryData.email,
        phone: inquiryData.phone,
        companyName: inquiryData.companyName,
        numberOfPeople: inquiryData.numberOfPeople,
        questions: inquiryData.questions,
        preferredPaymentMethod: inquiryData.preferredPaymentMethod,
        marketingConsent: inquiryData.marketingConsent,
        courseDetails: inquiryData.courseDetails,
        holdExpiresAt,
        continuationUrl: `${process.env.FRONTEND_URL}/booking?inquiry=${inquiryReference}`
      }).returning();
      
      // Create continuation URL
      const continuationUrl = `${process.env.FRONTEND_URL || 'https://reactfasttraining.co.uk'}/booking?inquiry=${inquiryReference}`;

      // Format payment method for display
      const paymentMethodText = {
        'online': 'Online payment (card)',
        'bank_transfer': 'Bank transfer',
        'cash': 'Cash on the day'
      }[inquiryData.preferredPaymentMethod];

      // Send email to instructor
      const instructorEmail = process.env.INSTRUCTOR_EMAIL || 'instructor@reactfasttraining.co.uk';
      await this.emailService.sendEmail({
        to: instructorEmail,
        subject: `New Course Inquiry - ${inquiryData.courseDetails.courseName} on ${inquiryData.courseDetails.date}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0EA5E9;">New Course Inquiry</h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Inquiry Reference</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #0369A1;">${inquiryReference}</p>
            </div>
            
            <h3 style="color: #0369A1;">Contact Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${inquiryData.firstName} ${inquiryData.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                  <a href="mailto:${inquiryData.email}" style="color: #0EA5E9;">${inquiryData.email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                  <a href="tel:${inquiryData.phone}" style="color: #0EA5E9;">${inquiryData.phone}</a>
                </td>
              </tr>
              ${inquiryData.companyName ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Company:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${inquiryData.companyName}</td>
              </tr>
              ` : ''}
            </table>
            
            <h3 style="color: #0369A1; margin-top: 20px;">Course Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Course:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${inquiryData.courseDetails.courseName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${inquiryData.courseDetails.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Time:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${inquiryData.courseDetails.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Venue:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${inquiryData.courseDetails.venue}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Number of People:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${inquiryData.numberOfPeople}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Total Price:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">£${(inquiryData.courseDetails.price * inquiryData.numberOfPeople).toFixed(2)}
                ${inquiryData.numberOfPeople >= 5 ? ' <em>(Eligible for 10% group discount)</em>' : ''}
                </td>
              </tr>
            </table>
            
            <h3 style="color: #0369A1; margin-top: 20px;">Additional Information</h3>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p style="margin: 0 0 10px 0;"><strong>Preferred Payment Method:</strong> ${paymentMethodText}</p>
              <p style="margin: 0;"><strong>Marketing Consent:</strong> ${inquiryData.marketingConsent ? 'Yes' : 'No'}</p>
            </div>
            
            ${inquiryData.questions ? `
            <h3 style="color: #0369A1;">Questions/Requirements</h3>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #fbbf24;">
              <p style="margin: 0; white-space: pre-wrap;">${inquiryData.questions}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background-color: #0EA5E9; color: white; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">Action Required</h3>
              <p style="margin: 0 0 15px 0;">Please respond to this inquiry within 24 hours</p>
              <div style="background-color: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <p style="margin: 0; font-weight: bold;">⚠️ IMPORTANT: The customer MUST complete their booking online</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Their place is temporarily held for 24 hours</p>
              </div>
              <a href="mailto:${inquiryData.email}?subject=Re: Course Inquiry - ${inquiryData.courseDetails.courseName} on ${inquiryData.courseDetails.date}&body=Dear ${inquiryData.firstName},%0D%0A%0D%0AThank you for your inquiry about our ${inquiryData.courseDetails.courseName} on ${inquiryData.courseDetails.date}.%0D%0A%0D%0A[ANSWER ANY QUESTIONS HERE]%0D%0A%0D%0AI can confirm we have availability for ${inquiryData.numberOfPeople} people on this date. Your place is being held for 24 hours.%0D%0A%0D%0ATo secure your booking, please complete the online booking process using this link:%0D%0A${continuationUrl}%0D%0A%0D%0AThis link will pre-fill your details and take you directly to payment. Please note that bookings must be completed online to ensure your place is secured and you receive all necessary documentation.%0D%0A%0D%0AIf you have any issues with online booking, please let me know and I can assist.%0D%0A%0D%0ABest regards,%0D%0ALex%0D%0AReact Fast Training%0D%0A%0D%0AInquiry Reference: ${inquiryReference}" 
                 style="display: inline-block; padding: 10px 20px; background-color: white; color: #0EA5E9; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reply to Inquiry
              </a>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
              This is an automated email from React Fast Training booking system
            </p>
          </div>
        `
      });

      // Send confirmation email to user
      await this.emailService.sendEmail({
        to: inquiryData.email,
        subject: `Inquiry Received - ${inquiryData.courseDetails.courseName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0EA5E9;">Thank You for Your Inquiry</h2>
            
            <p>Dear ${inquiryData.firstName},</p>
            
            <p>We have received your inquiry for the following course:</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #0369A1;">${inquiryData.courseDetails.courseName}</h3>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${inquiryData.courseDetails.date}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${inquiryData.courseDetails.time}</p>
              <p style="margin: 5px 0;"><strong>Venue:</strong> ${inquiryData.courseDetails.venue}</p>
              <p style="margin: 5px 0;"><strong>Number of People:</strong> ${inquiryData.numberOfPeople}</p>
              <p style="margin: 5px 0;"><strong>Inquiry Reference:</strong> ${inquiryReference}</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #fbbf24; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Important: Your Place is Temporarily Reserved</h3>
              <p style="margin: 0; color: #92400e;">We're holding ${inquiryData.numberOfPeople} space(s) for you for the next 24 hours. To secure your booking, you must complete the online booking process.</p>
            </div>
            
            <p>Our instructor will respond within 24 hours to:</p>
            <ul>
              <li>Answer any questions you may have</li>
              <li>Confirm availability (currently reserved for you)</li>
              <li>Provide a link to complete your booking online</li>
            </ul>
            
            <p><strong>Please note:</strong> All bookings must be completed through our online system to ensure your place is secured and you receive proper confirmation and documentation.</p>
            
            ${inquiryData.questions ? `
            <p><strong>Your questions/requirements:</strong></p>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #fbbf24;">
              <p style="margin: 0; white-space: pre-wrap;">${inquiryData.questions}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background-color: #e0f2fe; border-radius: 8px; border: 1px solid #0EA5E9;">
              <h3 style="margin: 0 0 10px 0; color: #0369A1;">What Happens Next?</h3>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Your place is being held for 24 hours</li>
                <li>Our instructor will respond with answers to your questions</li>
                <li>You'll receive a special link to complete your booking online</li>
                <li>Once payment is processed, you'll receive full course details</li>
              </ol>
              <p style="margin: 15px 0 0 0; padding: 10px; background-color: white; border-radius: 5px;">
                <strong style="color: #0369A1;">Why book online?</strong><br>
                ✓ Instant confirmation<br>
                ✓ Secure payment processing<br>
                ✓ Automatic certificate generation<br>
                ✓ Access to pre-course materials
              </p>
            </div>
            
            <p style="margin-top: 20px;">If you have any urgent questions, please call us on <a href="tel:01234567890" style="color: #0EA5E9;">01234 567890</a>.</p>
            
            <p>Best regards,<br>
            React Fast Training Team</p>
            
            <hr style="margin: 30px 0; border: 1px solid #e2e8f0;">
            
            <p style="font-size: 12px; color: #64748b;">
              React Fast Training<br>
              Yorkshire's Premier First Aid Training Provider<br>
              <a href="https://reactfasttraining.co.uk" style="color: #0EA5E9;">www.reactfasttraining.co.uk</a>
            </p>
          </div>
        `
      });

      return {
        success: true,
        inquiryReference,
        message: 'Your inquiry has been sent successfully. We will respond within 24 hours.'
      };
      
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.InternalServerError('Failed to submit inquiry');
    }
  }
  
  @get('/api/bookings/inquiry/{reference}')
  async getInquiry(
    @param.path.string('reference') reference: string
  ) {
    try {
      // Find inquiry by reference
      const [inquiry] = await db.select()
        .from(bookingInquiries)
        .where(
          and(
            eq(bookingInquiries.inquiryReference, reference),
            gt(bookingInquiries.holdExpiresAt, new Date())
          )
        )
        .limit(1);
        
      if (!inquiry) {
        throw new HttpErrors.NotFound('Inquiry not found or has expired');
      }
      
      // Check if already converted
      if (inquiry.status === 'converted') {
        throw new HttpErrors.BadRequest('This inquiry has already been converted to a booking');
      }
      
      // Get current availability for the session
      const [session] = await db.select()
        .from(courseSessions)
        .where(eq(courseSessions.id, inquiry.courseSessionId))
        .limit(1);
        
      if (!session) {
        throw new HttpErrors.NotFound('Course session no longer available');
      }
      
      const availableSpaces = session.maxCapacity - session.currentCapacity;
      
      return {
        inquiry: {
          reference: inquiry.inquiryReference,
          firstName: inquiry.firstName,
          lastName: inquiry.lastName,
          email: inquiry.email,
          phone: inquiry.phone,
          companyName: inquiry.companyName,
          numberOfPeople: inquiry.numberOfPeople,
          questions: inquiry.questions,
          courseDetails: inquiry.courseDetails,
          expiresAt: inquiry.holdExpiresAt,
          status: inquiry.status
        },
        session: {
          id: session.id,
          availableSpaces,
          stillAvailable: availableSpaces >= inquiry.numberOfPeople
        }
      };
      
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.InternalServerError('Failed to retrieve inquiry');
    }
  }
  
  @post('/api/bookings/inquiry/{reference}/expire')
  async expireInquiry(
    @param.path.string('reference') reference: string
  ) {
    try {
      await db.update(bookingInquiries)
        .set({ status: 'expired' })
        .where(eq(bookingInquiries.inquiryReference, reference));
        
      return { success: true };
    } catch (error) {
      throw new HttpErrors.InternalServerError('Failed to expire inquiry');
    }
  }
}