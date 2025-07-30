import {BaseValidator, ValidationResult} from './base.validator';
import {Booking} from '../models';

export interface CreateBookingInput {
  sessionId: string;
  numberOfParticipants: number;
  contactDetails: {
    name: string;
    email: string;
    phone: string;
  };
  additionalAttendees?: Array<{
    name: string;
    email?: string;
    specialRequirements?: string;
  }>;
  specialRequirements?: string;
  acceptedTerms: boolean;
  marketingOptIn?: boolean;
}

export interface PaymentInput {
  bookingId: string;
  paymentIntentId: string;
  paymentMethodId?: string;
  amount: number;
}

export class BookingValidator extends BaseValidator {
  validateCreateBooking(input: any): ValidationResult {
    this.reset();
    const sanitized: CreateBookingInput = {} as CreateBookingInput;

    // Validate and sanitize sessionId
    if (this.validateRequired(input.sessionId, 'sessionId')) {
      if (this.validateUUID(input.sessionId, 'sessionId')) {
        sanitized.sessionId = input.sessionId;
      }
    }

    // Validate numberOfParticipants
    if (this.validateRequired(input.numberOfParticipants, 'numberOfParticipants')) {
      if (this.validateNumber(input.numberOfParticipants, 'numberOfParticipants', {
        min: 1,
        max: 12,
        integer: true
      })) {
        sanitized.numberOfParticipants = parseInt(input.numberOfParticipants);
      }
    }

    // Validate contact details
    if (this.validateRequired(input.contactDetails, 'contactDetails')) {
      sanitized.contactDetails = {} as any;

      // Name
      if (this.validateRequired(input.contactDetails?.name, 'contactDetails.name')) {
        const name = this.sanitizeString(input.contactDetails.name);
        if (this.validateLength(name, 'contactDetails.name', {min: 2, max: 100})) {
          sanitized.contactDetails.name = name;
        }
      }

      // Email
      if (this.validateRequired(input.contactDetails?.email, 'contactDetails.email')) {
        const email = this.sanitizeEmail(input.contactDetails.email);
        if (this.validateEmail(email, 'contactDetails.email')) {
          sanitized.contactDetails.email = email;
        }
      }

      // Phone
      if (this.validateRequired(input.contactDetails?.phone, 'contactDetails.phone')) {
        const phone = this.sanitizePhone(input.contactDetails.phone);
        if (this.validatePhone(phone, 'contactDetails.phone')) {
          sanitized.contactDetails.phone = phone;
        }
      }
    }

    // Validate additional attendees
    if (input.additionalAttendees) {
      if (this.validateArray(input.additionalAttendees, 'additionalAttendees', {
        maxLength: 11, // Max 12 total including primary
        itemValidator: (attendee, index) => {
          if (!attendee.name) {
            this.addError(
              `additionalAttendees[${index}].name`,
              'Attendee name is required',
              'REQUIRED'
            );
            return false;
          }

          const name = this.sanitizeString(attendee.name);
          if (!this.validateLength(name, `additionalAttendees[${index}].name`, {
            min: 2,
            max: 100
          })) {
            return false;
          }

          if (attendee.email) {
            const email = this.sanitizeEmail(attendee.email);
            if (!this.validateEmail(email, `additionalAttendees[${index}].email`)) {
              return false;
            }
          }

          return true;
        }
      })) {
        sanitized.additionalAttendees = input.additionalAttendees.map((attendee: any) => ({
          name: this.sanitizeString(attendee.name),
          email: attendee.email ? this.sanitizeEmail(attendee.email) : undefined,
          specialRequirements: attendee.specialRequirements ? 
            this.sanitizeString(attendee.specialRequirements) : undefined
        }));

        // Validate total participants
        const totalParticipants = 1 + (sanitized.additionalAttendees?.length || 0);
        if (totalParticipants !== sanitized.numberOfParticipants) {
          this.addError(
            'numberOfParticipants',
            `Number of participants (${sanitized.numberOfParticipants}) must match total attendees (${totalParticipants})`,
            'PARTICIPANT_MISMATCH'
          );
        }
      }
    }

    // Validate special requirements
    if (input.specialRequirements) {
      sanitized.specialRequirements = this.sanitizeString(input.specialRequirements);
      if (!this.validateLength(sanitized.specialRequirements, 'specialRequirements', {
        max: 1000
      })) {
        // Error already added
      }
    }

    // Validate terms acceptance
    if (!input.acceptedTerms) {
      this.addError('acceptedTerms', 'You must accept the terms and conditions', 'REQUIRED');
    } else {
      sanitized.acceptedTerms = true;
    }

    // Marketing opt-in
    sanitized.marketingOptIn = !!input.marketingOptIn;

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }

  validatePaymentInput(input: any): ValidationResult {
    this.reset();
    const sanitized: PaymentInput = {} as PaymentInput;

    // Validate bookingId
    if (this.validateRequired(input.bookingId, 'bookingId')) {
      if (this.validateUUID(input.bookingId, 'bookingId')) {
        sanitized.bookingId = input.bookingId;
      }
    }

    // Validate paymentIntentId
    if (this.validateRequired(input.paymentIntentId, 'paymentIntentId')) {
      if (this.validatePattern(
        input.paymentIntentId,
        'paymentIntentId',
        /^pi_[a-zA-Z0-9]+$/,
        'Invalid payment intent ID format'
      )) {
        sanitized.paymentIntentId = input.paymentIntentId;
      }
    }

    // Validate paymentMethodId if provided
    if (input.paymentMethodId) {
      if (this.validatePattern(
        input.paymentMethodId,
        'paymentMethodId',
        /^pm_[a-zA-Z0-9]+$/,
        'Invalid payment method ID format'
      )) {
        sanitized.paymentMethodId = input.paymentMethodId;
      }
    }

    // Validate amount
    if (this.validateRequired(input.amount, 'amount')) {
      if (this.validateNumber(input.amount, 'amount', {min: 0.01})) {
        sanitized.amount = parseFloat(input.amount);
      }
    }

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }

  validateUpdateBooking(id: string, input: any): ValidationResult {
    this.reset();
    const sanitized: Partial<Booking> = {};

    // Validate ID
    if (!this.validateUUID(id, 'id')) {
      return {
        valid: false,
        errors: this.getErrors()
      };
    }

    // Only allow updating certain fields
    const allowedFields = ['specialRequirements', 'contactDetails', 'additionalAttendees'];
    const providedFields = Object.keys(input);
    
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      this.addError(
        'fields',
        `Cannot update fields: ${invalidFields.join(', ')}`,
        'INVALID_FIELDS'
      );
    }

    // Validate special requirements if provided
    if (input.specialRequirements !== undefined) {
      sanitized.specialRequirements = this.sanitizeString(input.specialRequirements);
      this.validateLength(sanitized.specialRequirements, 'specialRequirements', {max: 1000});
    }

    // Validate contact details if provided
    if (input.contactDetails) {
      const contactResult = this.validateContactDetails(input.contactDetails);
      if (contactResult.valid && contactResult.sanitizedData) {
        sanitized.contactDetails = contactResult.sanitizedData;
      }
    }

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }

  private validateContactDetails(input: any): ValidationResult {
    const sanitized: any = {};
    let hasErrors = false;

    if (input.name !== undefined) {
      const name = this.sanitizeString(input.name);
      if (this.validateLength(name, 'contactDetails.name', {min: 2, max: 100})) {
        sanitized.name = name;
      } else {
        hasErrors = true;
      }
    }

    if (input.email !== undefined) {
      const email = this.sanitizeEmail(input.email);
      if (this.validateEmail(email, 'contactDetails.email')) {
        sanitized.email = email;
      } else {
        hasErrors = true;
      }
    }

    if (input.phone !== undefined) {
      const phone = this.sanitizePhone(input.phone);
      if (this.validatePhone(phone, 'contactDetails.phone')) {
        sanitized.phone = phone;
      } else {
        hasErrors = true;
      }
    }

    return {
      valid: !hasErrors,
      errors: [],
      sanitizedData: sanitized
    };
  }

  validateCancellationRequest(input: any): ValidationResult {
    this.reset();
    const sanitized: any = {};

    // Validate booking reference or ID
    if (input.bookingReference) {
      const reference = this.sanitizeString(input.bookingReference);
      if (this.validatePattern(
        reference,
        'bookingReference',
        /^RFT\d{6}$/,
        'Invalid booking reference format'
      )) {
        sanitized.bookingReference = reference;
      }
    } else if (input.bookingId) {
      if (this.validateUUID(input.bookingId, 'bookingId')) {
        sanitized.bookingId = input.bookingId;
      }
    } else {
      this.addError('booking', 'Either bookingReference or bookingId is required', 'REQUIRED');
    }

    // Validate reason
    if (this.validateRequired(input.reason, 'reason')) {
      const reason = this.sanitizeString(input.reason);
      if (this.validateLength(reason, 'reason', {min: 10, max: 500})) {
        sanitized.reason = reason;
      }
    }

    // Validate email for verification
    if (this.validateRequired(input.email, 'email')) {
      const email = this.sanitizeEmail(input.email);
      if (this.validateEmail(email, 'email')) {
        sanitized.email = email;
      }
    }

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }

  validateSearchCriteria(input: any): ValidationResult {
    this.reset();
    const sanitized: any = {};

    // Date range validation
    if (input.startDate) {
      if (this.validateDate(input.startDate, 'startDate')) {
        sanitized.startDate = new Date(input.startDate);
      }
    }

    if (input.endDate) {
      if (this.validateDate(input.endDate, 'endDate')) {
        sanitized.endDate = new Date(input.endDate);
        
        if (sanitized.startDate && sanitized.endDate < sanitized.startDate) {
          this.addError('endDate', 'End date must be after start date', 'INVALID_RANGE');
        }
      }
    }

    // Status filter
    if (input.status) {
      const validStatuses = ['pending', 'confirmed', 'paid', 'cancelled', 'expired'];
      if (Array.isArray(input.status)) {
        const invalidStatuses = input.status.filter((s: string) => !validStatuses.includes(s));
        if (invalidStatuses.length > 0) {
          this.addError('status', `Invalid status values: ${invalidStatuses.join(', ')}`, 'INVALID_STATUS');
        } else {
          sanitized.status = input.status;
        }
      } else if (this.validateEnum(input.status, 'status', validStatuses)) {
        sanitized.status = [input.status];
      }
    }

    // Pagination
    if (input.page) {
      if (this.validateNumber(input.page, 'page', {min: 1, integer: true})) {
        sanitized.page = parseInt(input.page);
      }
    }

    if (input.pageSize) {
      if (this.validateNumber(input.pageSize, 'pageSize', {min: 1, max: 100, integer: true})) {
        sanitized.pageSize = parseInt(input.pageSize);
      }
    }

    // Search text
    if (input.search) {
      sanitized.search = this.sanitizeString(input.search);
      if (!this.validateLength(sanitized.search, 'search', {min: 2, max: 100})) {
        // Error already added
      }
    }

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }
}