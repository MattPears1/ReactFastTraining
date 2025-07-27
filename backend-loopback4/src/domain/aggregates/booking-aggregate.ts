import {v4 as uuid} from 'uuid';
import {HttpErrors} from '@loopback/rest';
import {
  BookingCreatedEvent,
  BookingConfirmedEvent,
  PaymentReceivedEvent,
  BookingCancelledEvent,
  RefundIssuedEvent,
  AttendeeAddedEvent,
  AttendeeRemovedEvent,
  SpecialRequirementsUpdatedEvent,
  BookingDomainEvent,
} from '../events/booking-events';
import {DomainEvent} from '../../services/event-sourcing/event-store';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  specialRequirements?: string;
}

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
}

/**
 * Booking Aggregate Root
 * Implements event sourcing pattern
 */
export class BookingAggregate {
  private _id: string;
  private _version: number = 0;
  private _status: BookingStatus = BookingStatus.PENDING;
  private _bookingReference: string = '';
  private _sessionId: string = '';
  private _courseId: string = '';
  private _userId: string = '';
  private _attendees: Attendee[] = [];
  private _totalAmount: number = 0;
  private _contactDetails?: ContactDetails;
  private _paymentId?: string;
  private _paidAmount: number = 0;
  private _refundedAmount: number = 0;
  private _createdAt?: Date;
  private _confirmedAt?: Date;
  private _paidAt?: Date;
  private _cancelledAt?: Date;
  
  private uncommittedEvents: BookingDomainEvent[] = [];

  constructor(id?: string) {
    this._id = id || uuid();
  }

  /**
   * Create a new booking
   */
  static create(
    userId: string,
    sessionId: string,
    courseId: string,
    attendees: Omit<Attendee, 'id'>[],
    totalAmount: number,
    contactDetails: ContactDetails
  ): BookingAggregate {
    const booking = new BookingAggregate();
    
    // Validate business rules
    if (attendees.length === 0) {
      throw new HttpErrors.BadRequest('At least one attendee is required');
    }
    
    if (attendees.length > 12) {
      throw new HttpErrors.BadRequest('Maximum 12 attendees allowed per booking');
    }
    
    if (totalAmount <= 0) {
      throw new HttpErrors.BadRequest('Total amount must be greater than zero');
    }

    // Generate booking reference
    const bookingReference = booking.generateBookingReference();
    
    // Create attendees with IDs
    const attendeesWithIds = attendees.map(a => ({
      ...a,
      id: uuid(),
    }));

    // Apply event
    booking.apply(new BookingCreatedEvent(
      booking._id,
      userId,
      {
        bookingReference,
        sessionId,
        courseId,
        attendees: attendeesWithIds,
        totalAmount,
        contactDetails,
      }
    ));

    return booking;
  }

  /**
   * Confirm the booking
   */
  confirmBooking(userId: string, paymentIntentId?: string): void {
    if (this._status !== BookingStatus.PENDING) {
      throw new HttpErrors.Conflict(
        `Cannot confirm booking in ${this._status} status`
      );
    }

    this.apply(new BookingConfirmedEvent(
      this._id,
      userId,
      {
        confirmedAt: new Date(),
        paymentIntentId,
      }
    ));
  }

  /**
   * Record payment received
   */
  recordPayment(
    userId: string,
    paymentId: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ): void {
    if (this._status === BookingStatus.CANCELLED || this._status === BookingStatus.REFUNDED) {
      throw new HttpErrors.Conflict(
        `Cannot record payment for ${this._status} booking`
      );
    }

    if (amount !== this._totalAmount) {
      throw new HttpErrors.BadRequest(
        `Payment amount ${amount} does not match booking total ${this._totalAmount}`
      );
    }

    this.apply(new PaymentReceivedEvent(
      this._id,
      userId,
      {
        paymentId,
        amount,
        currency,
        paymentMethod,
        paidAt: new Date(),
      }
    ));
  }

  /**
   * Cancel the booking
   */
  cancelBooking(userId: string, reason: string): void {
    if (this._status === BookingStatus.CANCELLED || this._status === BookingStatus.REFUNDED) {
      throw new HttpErrors.Conflict(
        `Booking is already ${this._status}`
      );
    }

    this.apply(new BookingCancelledEvent(
      this._id,
      userId,
      {
        reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
      }
    ));
  }

  /**
   * Issue a refund
   */
  issueRefund(
    userId: string,
    refundId: string,
    amount: number,
    reason: string
  ): void {
    if (this._status !== BookingStatus.PAID && this._status !== BookingStatus.CANCELLED) {
      throw new HttpErrors.Conflict(
        `Cannot refund booking in ${this._status} status`
      );
    }

    if (amount > this._paidAmount - this._refundedAmount) {
      throw new HttpErrors.BadRequest(
        `Refund amount exceeds available amount`
      );
    }

    this.apply(new RefundIssuedEvent(
      this._id,
      userId,
      {
        refundId,
        amount,
        reason,
        issuedAt: new Date(),
      }
    ));
  }

  /**
   * Add an attendee
   */
  addAttendee(userId: string, attendee: Omit<Attendee, 'id'>): void {
    if (this._status !== BookingStatus.PENDING && this._status !== BookingStatus.CONFIRMED) {
      throw new HttpErrors.Conflict(
        `Cannot modify attendees for ${this._status} booking`
      );
    }

    if (this._attendees.length >= 12) {
      throw new HttpErrors.BadRequest(
        'Maximum attendee limit reached'
      );
    }

    const newAttendee = {
      ...attendee,
      id: uuid(),
    };

    this.apply(new AttendeeAddedEvent(
      this._id,
      userId,
      {
        attendee: newAttendee,
        addedAt: new Date(),
      }
    ));
  }

  /**
   * Remove an attendee
   */
  removeAttendee(userId: string, attendeeId: string): void {
    if (this._status !== BookingStatus.PENDING && this._status !== BookingStatus.CONFIRMED) {
      throw new HttpErrors.Conflict(
        `Cannot modify attendees for ${this._status} booking`
      );
    }

    if (this._attendees.length <= 1) {
      throw new HttpErrors.BadRequest(
        'Cannot remove last attendee'
      );
    }

    const attendee = this._attendees.find(a => a.id === attendeeId);
    if (!attendee) {
      throw new HttpErrors.NotFound('Attendee not found');
    }

    this.apply(new AttendeeRemovedEvent(
      this._id,
      userId,
      {
        attendeeId,
        removedAt: new Date(),
      }
    ));
  }

  /**
   * Update special requirements
   */
  updateSpecialRequirements(
    userId: string,
    requirements: string,
    priority: 'standard' | 'high' | 'critical',
    attendeeId?: string
  ): void {
    this.apply(new SpecialRequirementsUpdatedEvent(
      this._id,
      userId,
      {
        attendeeId,
        requirements,
        priority,
        updatedAt: new Date(),
      }
    ));
  }

  /**
   * Apply event to aggregate
   */
  private apply(event: BookingDomainEvent): void {
    // Apply event to update state
    this.when(event);
    
    // Add to uncommitted events
    this.uncommittedEvents.push(event);
    
    // Increment version
    this._version++;
  }

  /**
   * Event handlers
   */
  private when(event: BookingDomainEvent): void {
    switch (event.eventType) {
      case 'BookingCreated':
        this.onBookingCreated(event as BookingCreatedEvent);
        break;
      case 'BookingConfirmed':
        this.onBookingConfirmed(event as BookingConfirmedEvent);
        break;
      case 'PaymentReceived':
        this.onPaymentReceived(event as PaymentReceivedEvent);
        break;
      case 'BookingCancelled':
        this.onBookingCancelled(event as BookingCancelledEvent);
        break;
      case 'RefundIssued':
        this.onRefundIssued(event as RefundIssuedEvent);
        break;
      case 'AttendeeAdded':
        this.onAttendeeAdded(event as AttendeeAddedEvent);
        break;
      case 'AttendeeRemoved':
        this.onAttendeeRemoved(event as AttendeeRemovedEvent);
        break;
      case 'SpecialRequirementsUpdated':
        this.onSpecialRequirementsUpdated(event as SpecialRequirementsUpdatedEvent);
        break;
    }
  }

  private onBookingCreated(event: BookingCreatedEvent): void {
    this._bookingReference = event.payload.bookingReference;
    this._sessionId = event.payload.sessionId;
    this._courseId = event.payload.courseId;
    this._attendees = event.payload.attendees;
    this._totalAmount = event.payload.totalAmount;
    this._contactDetails = event.payload.contactDetails;
    this._userId = event.userId;
    this._createdAt = new Date();
    this._status = BookingStatus.PENDING;
  }

  private onBookingConfirmed(event: BookingConfirmedEvent): void {
    this._status = BookingStatus.CONFIRMED;
    this._confirmedAt = event.payload.confirmedAt;
  }

  private onPaymentReceived(event: PaymentReceivedEvent): void {
    this._status = BookingStatus.PAID;
    this._paymentId = event.payload.paymentId;
    this._paidAmount = event.payload.amount;
    this._paidAt = event.payload.paidAt;
  }

  private onBookingCancelled(event: BookingCancelledEvent): void {
    this._status = BookingStatus.CANCELLED;
    this._cancelledAt = event.payload.cancelledAt;
  }

  private onRefundIssued(event: RefundIssuedEvent): void {
    this._refundedAmount += event.payload.amount;
    if (this._refundedAmount >= this._paidAmount) {
      this._status = BookingStatus.REFUNDED;
    }
  }

  private onAttendeeAdded(event: AttendeeAddedEvent): void {
    this._attendees.push(event.payload.attendee);
  }

  private onAttendeeRemoved(event: AttendeeRemovedEvent): void {
    this._attendees = this._attendees.filter(
      a => a.id !== event.payload.attendeeId
    );
  }

  private onSpecialRequirementsUpdated(event: SpecialRequirementsUpdatedEvent): void {
    if (event.payload.attendeeId) {
      const attendee = this._attendees.find(a => a.id === event.payload.attendeeId);
      if (attendee) {
        attendee.specialRequirements = event.payload.requirements;
      }
    }
  }

  /**
   * Load aggregate from events
   */
  static loadFromHistory(events: DomainEvent[]): BookingAggregate {
    const booking = new BookingAggregate(events[0]?.aggregateId);
    
    for (const event of events) {
      booking.when(event as BookingDomainEvent);
      booking._version = event.sequenceNumber;
    }
    
    return booking;
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents(): BookingDomainEvent[] {
    return this.uncommittedEvents;
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Generate booking reference
   */
  private generateBookingReference(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `RFT${year}${month}${random}`;
  }

  // Getters
  get id(): string { return this._id; }
  get version(): number { return this._version; }
  get status(): BookingStatus { return this._status; }
  get bookingReference(): string { return this._bookingReference; }
  get sessionId(): string { return this._sessionId; }
  get courseId(): string { return this._courseId; }
  get userId(): string { return this._userId; }
  get attendees(): Attendee[] { return [...this._attendees]; }
  get totalAmount(): number { return this._totalAmount; }
  get contactDetails(): ContactDetails | undefined { return this._contactDetails; }
  get paymentId(): string | undefined { return this._paymentId; }
  get paidAmount(): number { return this._paidAmount; }
  get refundedAmount(): number { return this._refundedAmount; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get confirmedAt(): Date | undefined { return this._confirmedAt; }
  get paidAt(): Date | undefined { return this._paidAt; }
  get cancelledAt(): Date | undefined { return this._cancelledAt; }

  /**
   * Create snapshot of current state
   */
  toSnapshot(): any {
    return {
      id: this._id,
      version: this._version,
      status: this._status,
      bookingReference: this._bookingReference,
      sessionId: this._sessionId,
      courseId: this._courseId,
      userId: this._userId,
      attendees: this._attendees,
      totalAmount: this._totalAmount,
      contactDetails: this._contactDetails,
      paymentId: this._paymentId,
      paidAmount: this._paidAmount,
      refundedAmount: this._refundedAmount,
      createdAt: this._createdAt,
      confirmedAt: this._confirmedAt,
      paidAt: this._paidAt,
      cancelledAt: this._cancelledAt,
    };
  }

  /**
   * Load from snapshot
   */
  static loadFromSnapshot(snapshot: any): BookingAggregate {
    const booking = new BookingAggregate(snapshot.id);
    
    booking._version = snapshot.version;
    booking._status = snapshot.status;
    booking._bookingReference = snapshot.bookingReference;
    booking._sessionId = snapshot.sessionId;
    booking._courseId = snapshot.courseId;
    booking._userId = snapshot.userId;
    booking._attendees = snapshot.attendees;
    booking._totalAmount = snapshot.totalAmount;
    booking._contactDetails = snapshot.contactDetails;
    booking._paymentId = snapshot.paymentId;
    booking._paidAmount = snapshot.paidAmount;
    booking._refundedAmount = snapshot.refundedAmount;
    booking._createdAt = snapshot.createdAt;
    booking._confirmedAt = snapshot.confirmedAt;
    booking._paidAt = snapshot.paidAt;
    booking._cancelledAt = snapshot.cancelledAt;
    
    return booking;
  }
}