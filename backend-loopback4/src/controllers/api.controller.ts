import { inject } from '@loopback/core';
import { post, requestBody, get, Request, Response, RestBindings } from '@loopback/rest';
import { EmailService } from '../services/email.service';
import { repository } from '@loopback/repository';
import { TestimonialRepository, BookingRepository, ContactSubmissionRepository, CourseSessionRepository } from '../repositories';
import { Testimonial, Booking, ContactSubmission, CourseSession } from '../models';
import * as multer from 'multer';

export class ApiController {
  constructor(
    @inject('services.EmailService')
    private emailService: EmailService,
    @repository(TestimonialRepository)
    public testimonialRepository: TestimonialRepository,
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @repository(ContactSubmissionRepository)
    public contactSubmissionRepository: ContactSubmissionRepository,
    @repository(CourseSessionRepository)
    public courseSessionRepository: CourseSessionRepository,
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
  ) {}

  @get('/ping')
  ping() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'React Fast Training API'
    };
  }

  @get('/api/testimonials/approved')
  async getApprovedTestimonials() {
    const testimonials = await this.testimonialRepository.find({
      where: { status: 'approved' },
      order: ['is_homepage_featured DESC', 'created_at DESC'],
      limit: 20,
    });
    return { testimonials };
  }

  @post('/api/bookings/create-payment-intent')
  async createPaymentIntent(
    @requestBody() body: { amount: number; courseId: string; customerInfo: any },
  ) {
    const { amount, courseId, customerInfo } = body;
    if (!amount || !courseId || !customerInfo) {
      throw new Error('Missing required fields: amount, courseId, customerInfo');
    }
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      client_secret: `pi_${Date.now()}_secret_mock`,
      amount: amount,
      currency: 'gbp',
      status: 'requires_payment_method'
    };
    return { paymentIntent };
  }

  @post('/api/bookings/confirm-with-payment')
  async confirmBookingWithPayment(
    @requestBody() body: {
      paymentIntentId: string;
      courseId: string;
      sessionId?: string;
      customerInfo: any;
      specialRequirements?: string;
    },
  ) {
    const { paymentIntentId, courseId, sessionId, customerInfo, specialRequirements } = body;
    if (!paymentIntentId || !courseId || !customerInfo) {
      throw new Error('Missing required booking information');
    }

    const booking = await this.bookingRepository.create({
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      company: customerInfo.company,
      courseId,
      sessionId,
      amount: customerInfo.amount,
      paymentIntentId,
      specialRequirements,
      status: 'confirmed',
    });

    await this.emailService.sendBookingConfirmation(booking, { courseId: customerInfo.courseName, startDate: new Date() } as CourseSession);

    return {
      success: true,
      bookingId: booking.id,
      message: 'Booking confirmed successfully'
    };
  }

  @post('/api/contact/submit')
  async submitContactForm(
    @requestBody() body: {
      name: string;
      email: string;
      phone?: string;
      subject?: string;
      message: string;
      type?: string;
    },
  ) {
    const { name, email, phone, subject, message, type } = body;
    if (!name || !email || !message) {
      throw new Error('Missing required fields: name, email, message');
    }

    const submission = await this.contactSubmissionRepository.create({
      name,
      email,
      phone,
      subject: subject || 'General Enquiry',
      message,
      type: type || 'contact',
      status: 'new',
    });

    // await this.emailService.sendContactNotification(submission);

    return {
      success: true,
      message: 'Thank you for your enquiry. We will get back to you soon.',
      submissionId: submission.id
    };
  }

  @get('/course-sessions/available')
  async getAvailableCourseSessions() {
    const sessions = await this.courseSessionRepository.find({
      where: {
        status: 'active',
        // start_datetime: { gt: new Date() },
        // and: [
        //   { max_participants: { gt: 'current_participants' } }
        // ]
      },
      order: ['start_datetime ASC'],
    });
    return { sessions };
  }

  @post('/api/testimonials/submit')
  async submitTestimonial(
    @requestBody({
      description: 'Testimonial submission with optional photo',
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              authorName: { type: 'string' },
              authorEmail: { type: 'string' },
              authorLocation: { type: 'string' },
              courseTaken: { type: 'string' },
              courseDate: { type: 'string' },
              content: { type: 'string' },
              rating: { type: 'string' },
              showFullName: { type: 'string' },
              photoConsent: { type: 'string' },
              bookingReference: { type: 'string' },
              photo: {
                type: 'string',
                format: 'binary'
              }
            },
            required: ['authorName', 'authorEmail', 'courseTaken', 'content', 'rating']
          }
        }
      }
    })
    body: any,
  ) {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }).single('photo');

    return new Promise((resolve, reject) => {
      upload(this.req, this.res, async (err) => {
        if (err) {
          reject(new Error(`File upload error: ${err.message}`));
          return;
        }

        try {
          const file = (this.req as any).file;
          const {
            authorName,
            authorEmail,
            authorLocation,
            courseTaken,
            courseDate,
            content,
            rating,
            showFullName,
            photoConsent,
            bookingReference
          } = this.req.body;

          // Validate required fields
          if (!authorName || !authorEmail || !courseTaken || !content || !rating) {
            throw new Error('Missing required fields: authorName, authorEmail, courseTaken, content, rating');
          }

          const testimonialData = {
            authorName,
            authorEmail,
            authorLocation,
            courseTaken,
            courseDate,
            content,
            rating: parseInt(rating),
            showFullName: showFullName === 'true',
            photoConsent,
            bookingReference,
            photoFile: file
          };

          // Send notification email to info@reactfasttraining.co.uk
          await this.emailService.sendTestimonialNotification(testimonialData);

          // Send confirmation copy to the user
          await this.emailService.sendTestimonialConfirmation(testimonialData);

          resolve({
            success: true,
            message: 'Testimonial submitted successfully. We will review it shortly.'
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}