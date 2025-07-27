import {DomainEvent} from '../../services/event-sourcing/event-store';

/**
 * Base class for booking domain events
 */
export abstract class BookingDomainEvent implements Omit<DomainEvent, 'eventId' | 'sequenceNumber' | 'timestamp'> {
  abstract eventType: string;
  eventVersion = 1;
  aggregateType = 'Booking';
  
  constructor(
    public aggregateId: string,
    public userId: string,
    public payload: any,
    public metadata?: Record<string, any>
  ) {}
}

/**
 * Booking Created Event
 */
export class BookingCreatedEvent extends BookingDomainEvent {
  eventType = 'BookingCreated';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      bookingReference: string;
      sessionId: string;
      courseId: string;
      attendees: Array<{
        name: string;
        email: string;
        specialRequirements?: string;
      }>;
      totalAmount: number;
      contactDetails: {
        name: string;
        email: string;
        phone: string;
      };
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Booking Confirmed Event
 */
export class BookingConfirmedEvent extends BookingDomainEvent {
  eventType = 'BookingConfirmed';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      confirmedAt: Date;
      paymentIntentId?: string;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Payment Received Event
 */
export class PaymentReceivedEvent extends BookingDomainEvent {
  eventType = 'PaymentReceived';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      paymentId: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      paidAt: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Booking Cancelled Event
 */
export class BookingCancelledEvent extends BookingDomainEvent {
  eventType = 'BookingCancelled';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      reason: string;
      cancelledAt: Date;
      cancelledBy: string;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Refund Issued Event
 */
export class RefundIssuedEvent extends BookingDomainEvent {
  eventType = 'RefundIssued';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      refundId: string;
      amount: number;
      reason: string;
      issuedAt: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Attendee Added Event
 */
export class AttendeeAddedEvent extends BookingDomainEvent {
  eventType = 'AttendeeAdded';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      attendee: {
        id: string;
        name: string;
        email: string;
        specialRequirements?: string;
      };
      addedAt: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Attendee Removed Event
 */
export class AttendeeRemovedEvent extends BookingDomainEvent {
  eventType = 'AttendeeRemoved';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      attendeeId: string;
      removedAt: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Special Requirements Updated Event
 */
export class SpecialRequirementsUpdatedEvent extends BookingDomainEvent {
  eventType = 'SpecialRequirementsUpdated';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      attendeeId?: string;
      requirements: string;
      priority: 'standard' | 'high' | 'critical';
      updatedAt: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Certificate Issued Event
 */
export class CertificateIssuedEvent extends BookingDomainEvent {
  eventType = 'CertificateIssued';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      certificateId: string;
      attendeeId: string;
      certificateNumber: string;
      issuedAt: Date;
      expiresAt?: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Reminder Sent Event
 */
export class ReminderSentEvent extends BookingDomainEvent {
  eventType = 'ReminderSent';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      reminderType: 'booking_confirmation' | 'course_reminder' | 'certificate_expiry';
      sentTo: string[];
      sentAt: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Course events
 */
export abstract class CourseDomainEvent implements Omit<DomainEvent, 'eventId' | 'sequenceNumber' | 'timestamp'> {
  abstract eventType: string;
  eventVersion = 1;
  aggregateType = 'Course';
  
  constructor(
    public aggregateId: string,
    public userId: string,
    public payload: any,
    public metadata?: Record<string, any>
  ) {}
}

/**
 * Session Created Event
 */
export class SessionCreatedEvent extends CourseDomainEvent {
  eventType = 'SessionCreated';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      sessionId: string;
      courseId: string;
      date: Date;
      location: string;
      maxCapacity: number;
      pricePerPerson: number;
      trainerId: string;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Session Capacity Changed Event
 */
export class SessionCapacityChangedEvent extends CourseDomainEvent {
  eventType = 'SessionCapacityChanged';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      oldCapacity: number;
      newCapacity: number;
      reason: string;
      changedAt: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Session Cancelled Event
 */
export class SessionCancelledEvent extends CourseDomainEvent {
  eventType = 'SessionCancelled';
  
  constructor(
    aggregateId: string,
    userId: string,
    payload: {
      reason: string;
      affectedBookings: string[];
      cancelledAt: Date;
    },
    metadata?: Record<string, any>
  ) {
    super(aggregateId, userId, payload, metadata);
  }
}

/**
 * Event factory for creating domain events
 */
export class BookingEventFactory {
  static createBookingCreated(
    bookingId: string,
    userId: string,
    bookingData: any
  ): BookingCreatedEvent {
    return new BookingCreatedEvent(
      bookingId,
      userId,
      {
        bookingReference: bookingData.bookingReference,
        sessionId: bookingData.sessionId,
        courseId: bookingData.courseId,
        attendees: bookingData.attendees,
        totalAmount: bookingData.totalAmount,
        contactDetails: bookingData.contactDetails,
      },
      {
        ip: bookingData.metadata?.ip,
        userAgent: bookingData.metadata?.userAgent,
      }
    );
  }

  static createPaymentReceived(
    bookingId: string,
    userId: string,
    paymentData: any
  ): PaymentReceivedEvent {
    return new PaymentReceivedEvent(
      bookingId,
      userId,
      {
        paymentId: paymentData.paymentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        paidAt: new Date(),
      }
    );
  }

  static createBookingCancelled(
    bookingId: string,
    userId: string,
    reason: string
  ): BookingCancelledEvent {
    return new BookingCancelledEvent(
      bookingId,
      userId,
      {
        reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
      }
    );
  }
}