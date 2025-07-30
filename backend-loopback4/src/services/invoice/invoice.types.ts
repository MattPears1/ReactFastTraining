import { Invoice } from '../../db/schema';

export interface InvoiceWithDetails extends Invoice {
  booking: any;
  user: any;
  payment?: any;
  courseDetails?: any;
  attendees?: any[];
  company?: CompanyDetails;
}

export interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  vatNumber?: string;
  registrationNumber?: string;
}

export interface InvoiceGenerationOptions {
  skipEmail?: boolean;
  skipPDF?: boolean;
  regenerate?: boolean;
  customNotes?: string;
  dueDate?: Date;
}

export interface InvoiceFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  bookingReference?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface InvoiceMetrics {
  total: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  voidCount: number;
  overdueCount: number;
  overdueAmount: number;
  thisMonthCount: number;
  thisMonthAmount: number;
  lastMonthCount: number;
  lastMonthAmount: number;
  averageAmount: number;
  largestInvoice: number;
}

export interface BulkInvoiceResult {
  successful: string[];
  failed: Array<{ bookingId: string; error: string }>;
}

// Company details constant (should come from config/database)
export const COMPANY_DETAILS: CompanyDetails = {
  name: 'React Fast Training',
  address: 'Yorkshire Business Centre',
  city: 'Leeds',
  postcode: 'LS1 1AA',
  country: 'United Kingdom',
  phone: '07447 485644',
  email: 'info@reactfasttraining.co.uk',
  website: 'https://reactfasttraining.co.uk',
  registrationNumber: '12345678', // Replace with actual
};