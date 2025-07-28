import { z } from "zod";

/**
 * Shared validation schemas for authentication and business rules
 * Ensures consistency between frontend and backend
 */

// Business rule constants
export const BUSINESS_RULES = {
  MAX_PARTICIPANTS: 12,
  MIN_PARTICIPANTS: 1,
  MAX_BOOKING_ADVANCE_DAYS: 90,
  MIN_BOOKING_ADVANCE_HOURS: 24,
  VALID_LOCATIONS: ["Location A", "Location B"] as const,
  SESSION_DURATION: {
    MIN_HOURS: 2,
    MAX_HOURS: 6,
  },
  PRICING: {
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 10000,
  },
  COURSE_TYPES: [
    "Emergency First Aid at Work",
    "First Aid at Work",
    "Paediatric First Aid",
    "CPR and AED",
    "Mental Health First Aid",
    "Annual Skills Refresher",
  ] as const,
} as const;

// Password validation rules matching backend requirements
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

// Email validation with normalization
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .transform((email) => email.toLowerCase().trim());

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes",
  );

// Phone validation for UK numbers
export const phoneSchema = z
  .string()
  .regex(/^(\+44|0)[1-9]\d{9,10}$/, "Invalid UK phone number")
  .transform((val) => val.replace(/\s/g, ""));

// UK postcode validation
export const postcodeSchema = z
  .string()
  .regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, "Invalid UK postcode")
  .transform((val) => val.toUpperCase());

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset schema
export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Date validation helpers
export const createDateValidation = (options?: {
  minDate?: Date;
  maxDate?: Date;
  businessDaysOnly?: boolean;
}) => {
  return z.date().refine(
    (date) => {
      if (options?.minDate && date < options.minDate) {
        return false;
      }
      if (options?.maxDate && date > options.maxDate) {
        return false;
      }
      if (options?.businessDaysOnly) {
        const day = date.getDay();
        return day !== 0 && day !== 6; // Not Sunday or Saturday
      }
      return true;
    },
    {
      message: options?.businessDaysOnly
        ? "Sessions can only be scheduled on business days"
        : "Invalid date",
    },
  );
};

// Session validation schemas
export const sessionBookingSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  participantCount: z
    .number()
    .int()
    .min(BUSINESS_RULES.MIN_PARTICIPANTS, "At least 1 participant required")
    .max(
      BUSINESS_RULES.MAX_PARTICIPANTS,
      `Maximum ${BUSINESS_RULES.MAX_PARTICIPANTS} participants allowed`,
    ),
  participants: z.array(
    z.object({
      firstName: nameSchema,
      lastName: nameSchema,
      email: emailSchema,
      phone: phoneSchema.optional(),
      specialRequirements: z.string().max(500).optional(),
    }),
  ),
});

export const createSessionSchema = z
  .object({
    courseId: z.string().uuid("Invalid course ID"),
    startDate: createDateValidation({
      minDate: new Date(
        Date.now() + BUSINESS_RULES.MIN_BOOKING_ADVANCE_HOURS * 60 * 60 * 1000,
      ),
      maxDate: new Date(
        Date.now() +
          BUSINESS_RULES.MAX_BOOKING_ADVANCE_DAYS * 24 * 60 * 60 * 1000,
      ),
    }),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
    location: z.enum(BUSINESS_RULES.VALID_LOCATIONS),
    maxParticipants: z
      .number()
      .int()
      .min(BUSINESS_RULES.MIN_PARTICIPANTS)
      .max(BUSINESS_RULES.MAX_PARTICIPANTS),
    price: z
      .number()
      .min(BUSINESS_RULES.PRICING.MIN_AMOUNT)
      .max(BUSINESS_RULES.PRICING.MAX_AMOUNT),
    isRecurring: z.boolean().default(false),
    recurrencePattern: z
      .object({
        frequency: z.enum(["daily", "weekly", "monthly"]),
        interval: z.number().int().min(1).max(4),
        endDate: z.date(),
        daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Validate session duration
      const start = new Date(`2000-01-01 ${data.startTime}`);
      const end = new Date(`2000-01-01 ${data.endTime}`);
      const durationHours =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      return (
        durationHours >= BUSINESS_RULES.SESSION_DURATION.MIN_HOURS &&
        durationHours <= BUSINESS_RULES.SESSION_DURATION.MAX_HOURS
      );
    },
    {
      message: `Session duration must be between ${BUSINESS_RULES.SESSION_DURATION.MIN_HOURS} and ${BUSINESS_RULES.SESSION_DURATION.MAX_HOURS} hours`,
    },
  );

// Client validation schemas
export const clientRegistrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    county: z.string().optional(),
    postcode: postcodeSchema,
  }),
  companyName: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    phone: phoneSchema,
    relationship: z.string().min(1, "Relationship is required"),
  }),
  medicalConditions: z.string().max(1000).optional(),
  dietaryRequirements: z.string().max(500).optional(),
  marketingConsent: z.boolean().default(false),
});

// Utility function to check password strength
export function getPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("At least 8 characters");
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("One uppercase letter");
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("One lowercase letter");
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push("One number");
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push("One special character");
  }

  return { score, feedback };
}

// Custom validation functions
export const validateBookingCapacity = async (
  sessionId: string,
  requestedParticipants: number,
  currentCapacity: { current: number; max: number },
): Promise<{ valid: boolean; message?: string }> => {
  const availableSpots = currentCapacity.max - currentCapacity.current;

  if (requestedParticipants > availableSpots) {
    return {
      valid: false,
      message: `Only ${availableSpots} spots available. Requested ${requestedParticipants}.`,
    };
  }

  if (
    currentCapacity.current + requestedParticipants >
    BUSINESS_RULES.MAX_PARTICIPANTS
  ) {
    return {
      valid: false,
      message: `Session capacity cannot exceed ${BUSINESS_RULES.MAX_PARTICIPANTS} participants.`,
    };
  }

  return { valid: true };
};

export const validateSessionTiming = (
  startDate: Date,
  startTime: string,
): { valid: boolean; message?: string } => {
  const sessionDateTime = new Date(startDate);
  const [hours, minutes] = startTime.split(":").map(Number);
  sessionDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const minAdvanceTime = new Date(
    now.getTime() + BUSINESS_RULES.MIN_BOOKING_ADVANCE_HOURS * 60 * 60 * 1000,
  );

  if (sessionDateTime < minAdvanceTime) {
    return {
      valid: false,
      message: `Sessions must be booked at least ${BUSINESS_RULES.MIN_BOOKING_ADVANCE_HOURS} hours in advance.`,
    };
  }

  const maxAdvanceTime = new Date(
    now.getTime() +
      BUSINESS_RULES.MAX_BOOKING_ADVANCE_DAYS * 24 * 60 * 60 * 1000,
  );

  if (sessionDateTime > maxAdvanceTime) {
    return {
      valid: false,
      message: `Sessions cannot be booked more than ${BUSINESS_RULES.MAX_BOOKING_ADVANCE_DAYS} days in advance.`,
    };
  }

  return { valid: true };
};

// Type exports
export type SessionBooking = z.infer<typeof sessionBookingSchema>;
export type CreateSession = z.infer<typeof createSessionSchema>;
export type ClientRegistration = z.infer<typeof clientRegistrationSchema>;

// Validation error formatter
export const formatValidationErrors = (
  error: z.ZodError,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return errors;
};
