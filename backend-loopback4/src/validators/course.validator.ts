import {BaseValidator, ValidationResult} from './base.validator';

export interface CreateCourseInput {
  name: string;
  description: string;
  duration: string;
  pricePerPerson: number;
  maxParticipants: number;
  category: string;
  level: string;
  accreditation?: string;
  prerequisites?: string;
  learningOutcomes: string[];
  certificateValidity?: number;
}

export interface CreateSessionInput {
  courseId: string;
  startDate: Date;
  endDate: Date;
  location: string;
  trainerId: string;
  maxParticipants: number;
  pricePerPerson?: number;
  status?: string;
}

export class CourseValidator extends BaseValidator {
  validateCreateCourse(input: any): ValidationResult {
    this.reset();
    const sanitized: CreateCourseInput = {} as CreateCourseInput;

    // Name validation
    if (this.validateRequired(input.name, 'name')) {
      const name = this.sanitizeString(input.name);
      if (this.validateLength(name, 'name', {min: 3, max: 200})) {
        sanitized.name = name;
      }
    }

    // Description validation
    if (this.validateRequired(input.description, 'description')) {
      const description = this.sanitizeHtml(input.description);
      if (this.validateLength(description, 'description', {min: 10, max: 2000})) {
        sanitized.description = description;
      }
    }

    // Duration validation
    if (this.validateRequired(input.duration, 'duration')) {
      const duration = this.sanitizeString(input.duration);
      if (this.validatePattern(
        duration,
        'duration',
        /^\d+\s*(hour|hours|day|days)$/i,
        'Duration must be in format: "1 day", "6 hours", etc.'
      )) {
        sanitized.duration = duration;
      }
    }

    // Price validation
    if (this.validateRequired(input.pricePerPerson, 'pricePerPerson')) {
      if (this.validateNumber(input.pricePerPerson, 'pricePerPerson', {min: 0})) {
        sanitized.pricePerPerson = parseFloat(input.pricePerPerson);
      }
    }

    // Max participants validation
    if (this.validateRequired(input.maxParticipants, 'maxParticipants')) {
      if (this.validateNumber(input.maxParticipants, 'maxParticipants', {
        min: 1,
        max: 50,
        integer: true
      })) {
        sanitized.maxParticipants = parseInt(input.maxParticipants);
      }
    }

    // Category validation
    if (this.validateRequired(input.category, 'category')) {
      const validCategories = ['first-aid', 'emergency', 'paediatric', 'refresher', 'specialist'];
      if (this.validateEnum(input.category, 'category', validCategories)) {
        sanitized.category = input.category;
      }
    }

    // Level validation
    if (this.validateRequired(input.level, 'level')) {
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      if (this.validateEnum(input.level, 'level', validLevels)) {
        sanitized.level = input.level;
      }
    }

    // Accreditation (optional)
    if (input.accreditation) {
      sanitized.accreditation = this.sanitizeString(input.accreditation);
      this.validateLength(sanitized.accreditation, 'accreditation', {max: 200});
    }

    // Prerequisites (optional)
    if (input.prerequisites) {
      sanitized.prerequisites = this.sanitizeString(input.prerequisites);
      this.validateLength(sanitized.prerequisites, 'prerequisites', {max: 500});
    }

    // Learning outcomes
    if (this.validateRequired(input.learningOutcomes, 'learningOutcomes')) {
      if (this.validateArray(input.learningOutcomes, 'learningOutcomes', {
        minLength: 1,
        maxLength: 10,
        itemValidator: (outcome, index) => {
          if (typeof outcome !== 'string') {
            this.addError(
              `learningOutcomes[${index}]`,
              'Learning outcome must be a string',
              'INVALID_TYPE'
            );
            return false;
          }
          const sanitized = this.sanitizeString(outcome);
          if (!this.validateLength(sanitized, `learningOutcomes[${index}]`, {
            min: 5,
            max: 200
          })) {
            return false;
          }
          return true;
        }
      })) {
        sanitized.learningOutcomes = input.learningOutcomes.map((outcome: any) => 
          this.sanitizeString(outcome)
        );
      }
    }

    // Certificate validity (optional)
    if (input.certificateValidity) {
      if (this.validateNumber(input.certificateValidity, 'certificateValidity', {
        min: 1,
        max: 60,
        integer: true
      })) {
        sanitized.certificateValidity = parseInt(input.certificateValidity);
      }
    }

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }

  validateUpdateCourse(id: string, input: any): ValidationResult {
    this.reset();
    const sanitized: Partial<CreateCourseInput> = {};

    // Validate ID
    if (!this.validateUUID(id, 'id')) {
      return {
        valid: false,
        errors: this.getErrors()
      };
    }

    // Validate only provided fields
    if (input.name !== undefined) {
      const name = this.sanitizeString(input.name);
      if (this.validateLength(name, 'name', {min: 3, max: 200})) {
        sanitized.name = name;
      }
    }

    if (input.description !== undefined) {
      const description = this.sanitizeHtml(input.description);
      if (this.validateLength(description, 'description', {min: 10, max: 2000})) {
        sanitized.description = description;
      }
    }

    if (input.pricePerPerson !== undefined) {
      if (this.validateNumber(input.pricePerPerson, 'pricePerPerson', {min: 0})) {
        sanitized.pricePerPerson = parseFloat(input.pricePerPerson);
      }
    }

    if (input.maxParticipants !== undefined) {
      if (this.validateNumber(input.maxParticipants, 'maxParticipants', {
        min: 1,
        max: 50,
        integer: true
      })) {
        sanitized.maxParticipants = parseInt(input.maxParticipants);
      }
    }

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }

  validateCreateSession(input: any): ValidationResult {
    this.reset();
    const sanitized: CreateSessionInput = {} as CreateSessionInput;

    // Course ID validation
    if (this.validateRequired(input.courseId, 'courseId')) {
      if (this.validateUUID(input.courseId, 'courseId')) {
        sanitized.courseId = input.courseId;
      }
    }

    // Start date validation
    if (this.validateRequired(input.startDate, 'startDate')) {
      if (this.validateDate(input.startDate, 'startDate', {future: true})) {
        sanitized.startDate = new Date(input.startDate);
      }
    }

    // End date validation
    if (this.validateRequired(input.endDate, 'endDate')) {
      if (this.validateDate(input.endDate, 'endDate', {future: true})) {
        sanitized.endDate = new Date(input.endDate);
        
        if (sanitized.startDate && sanitized.endDate <= sanitized.startDate) {
          this.addError('endDate', 'End date must be after start date', 'INVALID_RANGE');
        }
      }
    }

    // Location validation
    if (this.validateRequired(input.location, 'location')) {
      const location = this.sanitizeString(input.location);
      if (this.validateLength(location, 'location', {min: 3, max: 200})) {
        sanitized.location = location;
      }
    }

    // Trainer ID validation
    if (this.validateRequired(input.trainerId, 'trainerId')) {
      if (this.validateUUID(input.trainerId, 'trainerId')) {
        sanitized.trainerId = input.trainerId;
      }
    }

    // Max participants validation
    if (this.validateRequired(input.maxParticipants, 'maxParticipants')) {
      if (this.validateNumber(input.maxParticipants, 'maxParticipants', {
        min: 1,
        max: 50,
        integer: true
      })) {
        sanitized.maxParticipants = parseInt(input.maxParticipants);
      }
    }

    // Price per person (optional, defaults to course price)
    if (input.pricePerPerson !== undefined) {
      if (this.validateNumber(input.pricePerPerson, 'pricePerPerson', {min: 0})) {
        sanitized.pricePerPerson = parseFloat(input.pricePerPerson);
      }
    }

    // Status (optional, defaults to 'scheduled')
    if (input.status) {
      const validStatuses = ['draft', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'];
      if (this.validateEnum(input.status, 'status', validStatuses)) {
        sanitized.status = input.status;
      }
    }

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }

  validateSessionSearch(input: any): ValidationResult {
    this.reset();
    const sanitized: any = {};

    // Location search
    if (input.location) {
      sanitized.location = this.sanitizeString(input.location);
      if (sanitized.location.length < 2) {
        this.addError('location', 'Location search must be at least 2 characters', 'MIN_LENGTH');
      }
    }

    // Date range
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

    // Category filter
    if (input.category) {
      const validCategories = ['first-aid', 'emergency', 'paediatric', 'refresher', 'specialist'];
      if (this.validateEnum(input.category, 'category', validCategories)) {
        sanitized.category = input.category;
      }
    }

    // Available spots
    if (input.minAvailableSpots) {
      if (this.validateNumber(input.minAvailableSpots, 'minAvailableSpots', {
        min: 1,
        integer: true
      })) {
        sanitized.minAvailableSpots = parseInt(input.minAvailableSpots);
      }
    }

    // Price range
    if (input.minPrice !== undefined) {
      if (this.validateNumber(input.minPrice, 'minPrice', {min: 0})) {
        sanitized.minPrice = parseFloat(input.minPrice);
      }
    }

    if (input.maxPrice !== undefined) {
      if (this.validateNumber(input.maxPrice, 'maxPrice', {min: 0})) {
        sanitized.maxPrice = parseFloat(input.maxPrice);
        
        if (sanitized.minPrice && sanitized.maxPrice < sanitized.minPrice) {
          this.addError('maxPrice', 'Max price must be greater than min price', 'INVALID_RANGE');
        }
      }
    }

    return {
      valid: !this.hasErrors(),
      errors: this.getErrors(),
      sanitizedData: sanitized
    };
  }
}