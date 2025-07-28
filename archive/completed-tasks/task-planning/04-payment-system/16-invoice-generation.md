# Automated Invoice Generation

## Overview
Implement automated invoice generation for all bookings with PDF generation, unique invoice numbers, and email delivery.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Invoice Requirements

### Invoice Contents
1. **Header**
   - React Fast Training logo
   - Company details
   - Contact information
   - Invoice number and date

2. **Customer Details**
   - Name and email
   - Billing address (if collected)
   - Booking reference

3. **Line Items**
   - Course name and date
   - Number of attendees
   - Unit price and total

4. **Footer**
   - Payment status
   - Terms and conditions
   - Company registration details

## Database Schema

### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'paid',
  pdf_url TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);

-- Invoice number sequence
CREATE SEQUENCE invoice_number_seq START 1000;
```

## Backend Implementation

### Invoice Service
```typescript
// backend-loopback4/src/services/invoice.service.ts
import { db } from '../config/database.config';
import { invoices, bookings, users } from '../db/schema';
import { PDFService } from './pdf.service';
import { StorageService } from './storage.service';

export class InvoiceService {
  static generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const sequence = this.getNextSequence();
    return `INV-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  static async createInvoice(bookingId: string) {
    const booking = await BookingService.getBookingWithDetails(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if invoice already exists
    const existing = await this.getInvoiceByBooking(bookingId);
    if (existing) {
      return existing;
    }

    // Create invoice record
    const [invoice] = await db.insert(invoices).values({
      invoiceNumber: this.generateInvoiceNumber(),
      bookingId,
      userId: booking.userId,
      subtotal: booking.totalAmount,
      taxAmount: 0, // No VAT initially
      totalAmount: booking.totalAmount,
      status: 'paid',
    }).returning();

    // Generate PDF
    const pdfBuffer = await this.generateInvoicePDF(invoice.id);
    
    // Store PDF (local storage for now)
    const pdfPath = await StorageService.saveInvoicePDF(
      invoice.invoiceNumber,
      pdfBuffer
    );

    // Update invoice with PDF URL
    await db
      .update(invoices)
      .set({ pdfUrl: pdfPath })
      .where(eq(invoices.id, invoice.id));

    return invoice;
  }

  static async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    const invoiceData = await this.getInvoiceWithDetails(invoiceId);
    if (!invoiceData) {
      throw new Error('Invoice not found');
    }

    return PDFService.generateInvoice(invoiceData);
  }

  static async sendInvoice(invoiceId: string) {
    const invoice = await this.getInvoiceWithDetails(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get or generate PDF
    let pdfBuffer: Buffer;
    if (invoice.pdfUrl) {
      pdfBuffer = await StorageService.getInvoicePDF(invoice.invoiceNumber);
    } else {
      pdfBuffer = await this.generateInvoicePDF(invoiceId);
    }

    // Send email with attachment
    await EmailService.sendInvoiceEmail(invoice, pdfBuffer);

    // Update sent timestamp
    await db
      .update(invoices)
      .set({ sentAt: new Date() })
      .where(eq(invoices.id, invoiceId));
  }

  static async getInvoiceWithDetails(invoiceId: string) {
    const [result] = await db
      .select({
        invoice: invoices,
        booking: bookings,
        user: users,
        courseDetails: courseSessions,
        attendees: bookingAttendees,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(eq(invoices.id, invoiceId));

    return result;
  }
}
```

### PDF Invoice Template
```typescript
// backend-loopback4/src/services/pdf/invoice-template.ts
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export class InvoicePDFGenerator {
  static async generate(invoice: InvoiceWithDetails): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${invoice.invoiceNumber}`,
          Author: 'React Fast Training',
          Subject: 'Course Booking Invoice',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Company Logo and Header
      if (process.env.LOGO_PATH) {
        doc.image(process.env.LOGO_PATH, 50, 45, { width: 150 });
      }

      // Company Details (Right aligned)
      doc.fontSize(10)
         .text('React Fast Training', 400, 50, { align: 'right' })
         .text('Yorkshire\'s Premier First Aid Training', { align: 'right' })
         .text('info@reactfasttraining.co.uk', { align: 'right' })
         .text('07447 485644', { align: 'right' })
         .moveDown();

      // Invoice Title
      doc.fontSize(20)
         .fillColor('#0EA5E9')
         .text('INVOICE', 50, 150)
         .fontSize(10)
         .fillColor('#333');

      // Invoice Details Box
      const invoiceTop = 200;
      this.generateInvoiceTable(doc, invoiceTop, [
        ['Invoice Number:', invoice.invoiceNumber],
        ['Invoice Date:', format(invoice.issueDate, 'dd/MM/yyyy')],
        ['Payment Status:', 'PAID'],
      ]);

      // Customer Details
      const customerTop = invoiceTop + 80;
      doc.fontSize(12)
         .text('Bill To:', 50, customerTop)
         .fontSize(10)
         .text(invoice.user.name, 50, customerTop + 15)
         .text(invoice.user.email, 50, customerTop + 30);

      // Line Items Table
      const invoiceTableTop = customerTop + 70;
      doc.fontSize(12)
         .text('Course Details', 50, invoiceTableTop);

      // Table Headers
      const tableTop = invoiceTableTop + 20;
      doc.fontSize(10)
         .text('Description', 50, tableTop, { width: 250 })
         .text('Date', 300, tableTop, { width: 100 })
         .text('Attendees', 400, tableTop, { width: 60 })
         .text('Unit Price', 460, tableTop, { width: 60 })
         .text('Total', 520, tableTop, { width: 60 });

      // Draw line under headers
      doc.moveTo(50, tableTop + 15)
         .lineTo(580, tableTop + 15)
         .stroke();

      // Course Line Item
      const itemY = tableTop + 25;
      doc.text(invoice.booking.courseDetails.courseType, 50, itemY, { width: 250 })
         .text(format(invoice.booking.courseDetails.sessionDate, 'dd/MM/yyyy'), 300, itemY, { width: 100 })
         .text(invoice.booking.numberOfAttendees.toString(), 400, itemY, { width: 60, align: 'center' })
         .text(`£${invoice.booking.courseDetails.price}`, 460, itemY, { width: 60 })
         .text(`£${invoice.totalAmount}`, 520, itemY, { width: 60 });

      // Attendees List
      if (invoice.attendees.length > 0) {
        const attendeesY = itemY + 20;
        doc.fontSize(8)
           .fillColor('#666')
           .text('Attendees: ' + invoice.attendees.map(a => a.name).join(', '), 
                 50, attendeesY, { width: 530 })
           .fillColor('#333')
           .fontSize(10);
      }

      // Total Section
      const totalY = itemY + 60;
      doc.moveTo(400, totalY)
         .lineTo(580, totalY)
         .stroke();

      doc.fontSize(12)
         .text('Subtotal:', 400, totalY + 10)
         .text(`£${invoice.subtotal}`, 520, totalY + 10)
         .text('VAT (0%):', 400, totalY + 30)
         .text('£0.00', 520, totalY + 30)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Total:', 400, totalY + 50)
         .text(`£${invoice.totalAmount}`, 520, totalY + 50)
         .font('Helvetica');

      // Payment Confirmation
      const confirmationY = totalY + 100;
      doc.fontSize(10)
         .fillColor('#10B981')
         .text('✓ Payment Received - Thank You', 50, confirmationY, { align: 'center' })
         .fillColor('#333');

      // Footer
      const footerY = 700;
      doc.fontSize(8)
         .fillColor('#666')
         .text('Terms & Conditions', 50, footerY)
         .text('Cancellations are subject to our refund policy.', 50, footerY + 12)
         .text('This invoice is generated electronically and is valid without signature.', 50, footerY + 24)
         .moveDown()
         .text('React Fast Training is registered in England and Wales.', 50, footerY + 48, { align: 'center' });

      doc.end();
    });
  }

  private static generateInvoiceTable(
    doc: any,
    y: number,
    items: Array<[string, string]>
  ) {
    items.forEach((item, index) => {
      const rowY = y + (index * 20);
      doc.fontSize(10)
         .text(item[0], 350, rowY, { width: 100 })
         .font('Helvetica-Bold')
         .text(item[1], 450, rowY, { width: 130, align: 'right' })
         .font('Helvetica');
    });
  }
}
```

### Invoice API Controller
```typescript
// backend-loopback4/src/controllers/invoice.controller.ts
export class InvoiceController {
  @post('/api/invoices/generate/{bookingId}')
  @authenticate
  async generateInvoice(
    @param.path.string('bookingId') bookingId: string,
    @inject('authentication.user') user: User
  ) {
    // Verify user owns booking
    const booking = await BookingService.getBooking(bookingId);
    if (booking.userId !== user.id) {
      throw new HttpErrors.Forbidden();
    }

    const invoice = await InvoiceService.createInvoice(bookingId);
    return invoice;
  }

  @get('/api/invoices/{invoiceId}/download')
  @authenticate
  async downloadInvoice(
    @param.path.string('invoiceId') invoiceId: string,
    @inject('authentication.user') user: User,
    @inject(RestBindings.Http.RESPONSE) response: Response
  ) {
    const invoice = await InvoiceService.getInvoice(invoiceId);
    if (!invoice || invoice.userId !== user.id) {
      throw new HttpErrors.NotFound();
    }

    const pdfBuffer = await InvoiceService.generateInvoicePDF(invoiceId);
    
    response.contentType('application/pdf');
    response.header('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    response.send(pdfBuffer);
  }

  @post('/api/invoices/{invoiceId}/send')
  @authenticate
  async sendInvoice(
    @param.path.string('invoiceId') invoiceId: string,
    @inject('authentication.user') user: User
  ) {
    const invoice = await InvoiceService.getInvoice(invoiceId);
    if (!invoice || invoice.userId !== user.id) {
      throw new HttpErrors.NotFound();
    }

    await InvoiceService.sendInvoice(invoiceId);
    return { success: true };
  }

  @get('/api/invoices')
  @authenticate
  async getUserInvoices(
    @inject('authentication.user') user: User,
    @param.query.number('limit') limit = 10,
    @param.query.number('offset') offset = 0
  ) {
    return await InvoiceService.getUserInvoices(user.id, limit, offset);
  }
}
```

## Frontend Implementation

### Invoice List Component
```typescript
// src/components/account/InvoiceList.tsx
import React, { useState, useEffect } from 'react';
import { FileText, Download, Mail } from 'lucide-react';
import { format } from 'date-fns';

export const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await accountApi.getInvoices();
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    const response = await accountApi.downloadInvoice(invoiceId);
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceNumber}.pdf`;
    a.click();
  };

  const resendInvoice = async (invoiceId: string) => {
    await accountApi.resendInvoice(invoiceId);
    // Show success notification
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Invoices</h3>
      </div>
      
      <div className="p-6">
        {invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No invoices found</p>
        ) : (
          <div className="space-y-4">
            {invoices.map(invoice => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(invoice.issueDate), 'dd MMM yyyy')} • £{invoice.totalAmount}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => resendInvoice(invoice.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Resend Email"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

### Invoice Preview Modal
```typescript
// src/components/account/InvoicePreview.tsx
import React, { useState, useEffect } from 'react';
import { X, Download, Mail } from 'lucide-react';

interface InvoicePreviewProps {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceId,
  isOpen,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoice();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [invoiceId, isOpen]);

  const loadInvoice = async () => {
    const response = await accountApi.downloadInvoice(invoiceId);
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {/* Download logic */}}
              className="p-2 hover:bg-gray-100 rounded"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => {/* Email logic */}}
              className="p-2 hover:bg-gray-100 rounded"
              title="Email"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border rounded"
              title="Invoice PDF"
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

### Auto-Generation on Booking
```typescript
// backend-loopback4/src/services/booking.service.ts (addition)
export class BookingService {
  static async confirmBooking(bookingId: string, paymentIntentId: string) {
    // ... existing confirmation logic ...

    // Auto-generate invoice
    try {
      const invoice = await InvoiceService.createInvoice(bookingId);
      
      // Send invoice with booking confirmation
      await InvoiceService.sendInvoice(invoice.id);
    } catch (error) {
      console.error('Invoice generation failed:', error);
      // Don't fail the booking confirmation if invoice fails
    }
  }
}
```

## Email Template

### Invoice Email
```html
Subject: Invoice #{invoiceNumber} - React Fast Training

<body>
  <div class="header">
    <h1>Invoice</h1>
  </div>
  
  <div class="content">
    <p>Hi {customerName},</p>
    
    <p>Thank you for your booking with React Fast Training. Please find your invoice attached.</p>
    
    <div class="invoice-summary">
      <h3>Invoice Summary</h3>
      <table>
        <tr>
          <td>Invoice Number:</td>
          <td>{invoiceNumber}</td>
        </tr>
        <tr>
          <td>Date:</td>
          <td>{invoiceDate}</td>
        </tr>
        <tr>
          <td>Amount:</td>
          <td>£{totalAmount}</td>
        </tr>
        <tr>
          <td>Status:</td>
          <td><span class="paid-badge">PAID</span></td>
        </tr>
      </table>
    </div>
    
    <p>You can also download your invoice from your account dashboard at any time.</p>
  </div>
</body>
```

## Testing

1. Test invoice generation on booking confirmation
2. Test unique invoice numbering
3. Test PDF generation with various data
4. Test invoice download functionality
5. Test email delivery with attachments
6. Test invoice list pagination
7. Test access control (users can only see their invoices)
8. Test bulk invoice generation for admin