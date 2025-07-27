import Stripe from 'stripe';
import { PDFService } from './pdf.service';
import { CalendarService } from './calendar.service';

interface PaymentIntentData {
  amount: number;
  bookingId: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

interface BookingDetails {
  bookingReference: string;
  courseDetails: {
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
    price: number;
  };
  attendees: Array<{ name: string; email: string }>;
  totalAmount: string;
}

export class PaymentService {
  private static stripe: Stripe;

  static initialize() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
  }

  static async createPaymentIntent(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      this.initialize();
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to pence
        currency: 'gbp',
        payment_method_types: ['card'],
        receipt_email: data.customerEmail,
        metadata: {
          bookingId: data.bookingId,
          ...data.metadata,
        },
        description: `React Fast Training - Booking ${data.metadata?.bookingReference || ''}`,
        // Enable 3D Secure authentication when required
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error('Payment processing failed');
    }
  }

  static async verifyPaymentIntent(paymentIntentId: string): Promise<boolean> {
    if (!this.stripe) {
      this.initialize();
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status === 'succeeded';
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  static async refundPayment(paymentIntentId: string, reason?: string): Promise<Stripe.Refund> {
    if (!this.stripe) {
      this.initialize();
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          refundReason: reason || 'Customer requested cancellation',
        },
      });

      return refund;
    } catch (error) {
      console.error('Refund processing failed:', error);
      throw new Error('Refund processing failed');
    }
  }

  static async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    if (!this.stripe) {
      this.initialize();
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      return customer;
    } catch (error) {
      console.error('Customer creation failed:', error);
      throw new Error('Customer creation failed');
    }
  }

  static async generateBookingPDF(booking: BookingDetails): Promise<Buffer> {
    return PDFService.generateBookingConfirmation(booking);
  }

  static async generateCalendarFile(booking: BookingDetails): Promise<string> {
    return CalendarService.generateICS({
      title: booking.courseDetails.courseType,
      start: new Date(`${booking.courseDetails.sessionDate}T${booking.courseDetails.startTime}`),
      end: new Date(`${booking.courseDetails.sessionDate}T${booking.courseDetails.endTime}`),
      location: booking.courseDetails.location,
      description: `React Fast Training - ${booking.courseDetails.courseType}\nBooking Reference: ${booking.bookingReference}`,
    });
  }

  // Webhook handler for Stripe events
  static async handleWebhook(payload: string, signature: string): Promise<void> {
    if (!this.stripe) {
      this.initialize();
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new Error('Invalid webhook signature');
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Handle successful payment
        console.log('Payment succeeded:', paymentIntent.id);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        // Handle failed payment
        console.log('Payment failed:', failedPayment.id);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}