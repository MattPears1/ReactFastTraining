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

export interface EmailTemplate {
  subject: string;
  templateName: string;
  data: Record<string, any>;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export enum EmailType {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  COURSE_REMINDER = 'course_reminder',
  CERTIFICATE_READY = 'certificate_ready',
  PAYMENT_RECEIPT = 'payment_receipt',
  REFUND_CONFIRMATION = 'refund_confirmation',
  TESTIMONIAL_REQUEST = 'testimonial_request',
  TESTIMONIAL_RECEIVED = 'testimonial_received',
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome',
  CONTACT_FORM = 'contact_form',
}