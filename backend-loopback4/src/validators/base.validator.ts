import {HttpErrors} from '@loopback/rest';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  sanitizedData?: any;
}

export class BaseValidator {
  protected errors: Array<{field: string; message: string; code?: string}> = [];

  protected addError(field: string, message: string, code?: string): void {
    this.errors.push({field, message, code});
  }

  protected hasErrors(): boolean {
    return this.errors.length > 0;
  }

  protected getErrors(): Array<{field: string; message: string; code?: string}> {
    return this.errors;
  }

  protected reset(): void {
    this.errors = [];
  }

  // Sanitization methods
  protected sanitizeString(input: any): string {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    }).trim();
  }

  protected sanitizeHtml(input: any): string {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    });
  }

  protected sanitizeEmail(email: any): string {
    if (typeof email !== 'string') return '';
    return validator.normalizeEmail(email.toLowerCase().trim()) || '';
  }

  protected sanitizePhone(phone: any): string {
    if (typeof phone !== 'string') return '';
    // Remove all non-numeric characters except + for international
    return phone.replace(/[^0-9+]/g, '');
  }

  protected sanitizeUrl(url: any): string {
    if (typeof url !== 'string') return '';
    try {
      const parsed = new URL(url);
      return parsed.toString();
    } catch {
      return '';
    }
  }

  // Validation methods
  protected validateRequired(value: any, field: string): boolean {
    if (value === null || value === undefined || value === '') {
      this.addError(field, `${field} is required`, 'REQUIRED');
      return false;
    }
    return true;
  }

  protected validateEmail(email: any, field: string): boolean {
    if (!validator.isEmail(email)) {
      this.addError(field, `${field} must be a valid email address`, 'INVALID_EMAIL');
      return false;
    }
    return true;
  }

  protected validatePhone(phone: any, field: string): boolean {
    // UK phone number validation
    const ukPhoneRegex = /^(\+44|0)[1-9]\d{9,10}$/;
    if (!ukPhoneRegex.test(phone)) {
      this.addError(field, `${field} must be a valid UK phone number`, 'INVALID_PHONE');
      return false;
    }
    return true;
  }

  protected validateLength(
    value: string,
    field: string,
    options: {min?: number; max?: number}
  ): boolean {
    if (options.min && value.length < options.min) {
      this.addError(
        field,
        `${field} must be at least ${options.min} characters`,
        'MIN_LENGTH'
      );
      return false;
    }
    if (options.max && value.length > options.max) {
      this.addError(
        field,
        `${field} must not exceed ${options.max} characters`,
        'MAX_LENGTH'
      );
      return false;
    }
    return true;
  }

  protected validatePattern(
    value: string,
    field: string,
    pattern: RegExp,
    message?: string
  ): boolean {
    if (!pattern.test(value)) {
      this.addError(
        field,
        message || `${field} format is invalid`,
        'PATTERN_MISMATCH'
      );
      return false;
    }
    return true;
  }

  protected validateNumber(
    value: any,
    field: string,
    options?: {min?: number; max?: number; integer?: boolean}
  ): boolean {
    const num = Number(value);
    
    if (isNaN(num)) {
      this.addError(field, `${field} must be a number`, 'INVALID_NUMBER');
      return false;
    }

    if (options?.integer && !Number.isInteger(num)) {
      this.addError(field, `${field} must be an integer`, 'NOT_INTEGER');
      return false;
    }

    if (options?.min !== undefined && num < options.min) {
      this.addError(field, `${field} must be at least ${options.min}`, 'MIN_VALUE');
      return false;
    }

    if (options?.max !== undefined && num > options.max) {
      this.addError(field, `${field} must not exceed ${options.max}`, 'MAX_VALUE');
      return false;
    }

    return true;
  }

  protected validateDate(
    value: any,
    field: string,
    options?: {future?: boolean; past?: boolean; after?: Date; before?: Date}
  ): boolean {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      this.addError(field, `${field} must be a valid date`, 'INVALID_DATE');
      return false;
    }

    const now = new Date();
    
    if (options?.future && date <= now) {
      this.addError(field, `${field} must be in the future`, 'DATE_NOT_FUTURE');
      return false;
    }

    if (options?.past && date >= now) {
      this.addError(field, `${field} must be in the past`, 'DATE_NOT_PAST');
      return false;
    }

    if (options?.after && date <= options.after) {
      this.addError(
        field,
        `${field} must be after ${options.after.toISOString()}`,
        'DATE_TOO_EARLY'
      );
      return false;
    }

    if (options?.before && date >= options.before) {
      this.addError(
        field,
        `${field} must be before ${options.before.toISOString()}`,
        'DATE_TOO_LATE'
      );
      return false;
    }

    return true;
  }

  protected validateEnum(
    value: any,
    field: string,
    allowedValues: any[]
  ): boolean {
    if (!allowedValues.includes(value)) {
      this.addError(
        field,
        `${field} must be one of: ${allowedValues.join(', ')}`,
        'INVALID_ENUM'
      );
      return false;
    }
    return true;
  }

  protected validateArray(
    value: any,
    field: string,
    options?: {
      minLength?: number;
      maxLength?: number;
      itemValidator?: (item: any, index: number) => boolean;
    }
  ): boolean {
    if (!Array.isArray(value)) {
      this.addError(field, `${field} must be an array`, 'NOT_ARRAY');
      return false;
    }

    if (options?.minLength && value.length < options.minLength) {
      this.addError(
        field,
        `${field} must contain at least ${options.minLength} items`,
        'ARRAY_TOO_SHORT'
      );
      return false;
    }

    if (options?.maxLength && value.length > options.maxLength) {
      this.addError(
        field,
        `${field} must not exceed ${options.maxLength} items`,
        'ARRAY_TOO_LONG'
      );
      return false;
    }

    if (options?.itemValidator) {
      let allValid = true;
      value.forEach((item, index) => {
        if (!options.itemValidator!(item, index)) {
          allValid = false;
        }
      });
      return allValid;
    }

    return true;
  }

  protected validateUUID(value: any, field: string): boolean {
    if (!validator.isUUID(value)) {
      this.addError(field, `${field} must be a valid UUID`, 'INVALID_UUID');
      return false;
    }
    return true;
  }

  protected validatePostcode(postcode: any, field: string): boolean {
    // UK postcode validation
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    if (!ukPostcodeRegex.test(postcode)) {
      this.addError(field, `${field} must be a valid UK postcode`, 'INVALID_POSTCODE');
      return false;
    }
    return true;
  }

  protected throwIfInvalid(): void {
    if (this.hasErrors()) {
      const error = new HttpErrors.UnprocessableEntity('Validation failed');
      error.details = this.getErrors();
      throw error;
    }
  }
}