import { z } from "zod";

// UK phone number regex - accepts various formats
const ukPhoneRegex =
  /^(?:(?:\+44\s?|0)(?:7\d{3}|\d{4}|\d{3})\s?\d{3}\s?\d{3,4})$/;

export const participantDetailSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
  email: z.string().email("Invalid email address").optional(),
  dietaryRequirements: z
    .string()
    .max(200, "Dietary requirements must be less than 200 characters")
    .optional(),
  medicalConditions: z
    .string()
    .max(500, "Medical conditions must be less than 500 characters")
    .optional(),
});

export const bookingFormSchema = z.object({
  courseSessionId: z.number().positive("Please select a course"),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z
    .string()
    .regex(ukPhoneRegex, "Please enter a valid UK phone number")
    .min(1, "Phone number is required"),
  companyName: z
    .string()
    .max(100, "Company name must be less than 100 characters")
    .optional(),
  numberOfParticipants: z
    .number()
    .min(1, "At least 1 participant is required")
    .max(12, "Maximum 12 participants per booking"),
  participantDetails: z.array(participantDetailSchema).optional(),
  specialRequirements: z
    .string()
    .max(500, "Special requirements must be less than 500 characters")
    .optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type ParticipantDetail = z.infer<typeof participantDetailSchema>;

export const validateBookingForm = (data: unknown) => {
  return bookingFormSchema.safeParse(data);
};

export const validatePartialBookingForm = (data: unknown) => {
  return bookingFormSchema.partial().safeParse(data);
};

// Helper to format validation errors
export const formatValidationErrors = (
  errors: z.ZodError,
): Record<string, string> => {
  const formatted: Record<string, string> = {};

  errors.issues.forEach((issue) => {
    const path = issue.path.join(".");
    formatted[path] = issue.message;
  });

  return formatted;
};
