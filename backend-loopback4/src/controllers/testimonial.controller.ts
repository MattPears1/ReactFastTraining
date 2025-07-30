import {
  Request,
  Response,
  RestBindings,
  post,
  requestBody,
  HttpErrors,
} from '@loopback/rest';
import {inject, service} from '@loopback/core';
import {EmailService, TestimonialSubmission} from '../services/email.service';
import * as multer from 'multer';

export class TestimonialController {
  constructor(
    @service(EmailService)
    private emailService: EmailService,
  ) {}

  @post('/testimonials/submit')
  async submitTestimonial(
    @inject(RestBindings.Http.REQUEST) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<{success: boolean; message: string}> {
    try {
      console.log('📝 [TestimonialController] Processing testimonial submission');

      // Set up multer for handling form data with file uploads
      const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req, file, cb) => {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'));
          }
        },
      });

      // Parse the multipart form data
      const uploadPromise = new Promise<void>((resolve, reject) => {
        upload.single('photo')(request, response, (err) => {
          if (err) {
            console.error('❌ [TestimonialController] Multer error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      await uploadPromise;

      // Extract form data
      const testimonialData: TestimonialSubmission = {
        authorName: request.body.authorName,
        authorEmail: request.body.authorEmail,
        authorLocation: request.body.authorLocation,
        courseTaken: request.body.courseTaken,
        courseDate: request.body.courseDate,
        content: request.body.content,
        rating: parseInt(request.body.rating, 10),
        showFullName: request.body.showFullName === 'true',
        photoConsent: request.body.photoConsent || 'not_given',
        bookingReference: request.body.bookingReference,
        photoFile: (request as any).file as Express.Multer.File,
      };

      console.log('📋 [TestimonialController] Testimonial data:', {
        authorName: testimonialData.authorName,
        authorEmail: testimonialData.authorEmail,
        courseTaken: testimonialData.courseTaken,
        rating: testimonialData.rating,
        hasPhoto: !!testimonialData.photoFile,
        photoSize: testimonialData.photoFile?.size,
      });

      // Validate required fields
      if (!testimonialData.authorName || !testimonialData.authorEmail || !testimonialData.content || !testimonialData.courseTaken || !testimonialData.rating) {
        throw new HttpErrors.BadRequest('Missing required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testimonialData.authorEmail)) {
        throw new HttpErrors.BadRequest('Invalid email format');
      }

      // Validate rating
      if (testimonialData.rating < 1 || testimonialData.rating > 5) {
        throw new HttpErrors.BadRequest('Rating must be between 1 and 5');
      }

      // Validate content length
      if (testimonialData.content.length < 50 || testimonialData.content.length > 1000) {
        throw new HttpErrors.BadRequest('Testimonial content must be between 50 and 1000 characters');
      }

      // Send notification email to business
      await this.emailService.sendTestimonialNotification(testimonialData);

      // Send confirmation email to customer
      await this.emailService.sendTestimonialConfirmation(testimonialData);

      console.log('✅ [TestimonialController] Testimonial processed successfully');

      return {
        success: true,
        message: 'Thank you for your testimonial! We appreciate your feedback and will review it shortly.',
      };
    } catch (error) {
      console.error('❌ [TestimonialController] Error processing testimonial:', error);

      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }

      throw new HttpErrors.InternalServerError('Failed to process testimonial submission');
    }
  }
}