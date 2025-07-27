import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs';

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  booking: {
    bookingReference: string;
    numberOfAttendees: number;
    specialRequirements?: string;
  };
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  courseDetails?: {
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
    price: number;
  };
  attendees?: Array<{
    name: string;
    email: string;
    isPrimary?: boolean;
  }>;
}

export class InvoicePDFGenerator {
  static async generate(invoice: InvoiceData): Promise<Buffer> {
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

      // Company Header
      this.drawHeader(doc);

      // Invoice Details
      this.drawInvoiceDetails(doc, invoice);

      // Bill To Section
      this.drawBillTo(doc, invoice.user, 200);

      // Line Items
      const itemsY = this.drawLineItems(doc, invoice, 300);

      // Total Section
      const totalY = this.drawTotalSection(doc, invoice, itemsY + 40);

      // Payment Status
      this.drawPaymentStatus(doc, invoice, totalY + 80);

      // Footer
      this.drawFooter(doc);

      doc.end();
    });
  }

  private static drawHeader(doc: PDFKit.PDFDocument): void {
    // Company Logo area (if logo exists)
    const logoPath = process.env.LOGO_PATH;
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 45, { width: 150 });
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    }

    // Company Details (Right aligned)
    doc.fontSize(16)
       .fillColor('#0EA5E9')
       .text('React Fast Training', 350, 50, { width: 200, align: 'right' })
       .fontSize(10)
       .fillColor('#333333')
       .text('Yorkshire\'s Premier First Aid Training', { width: 200, align: 'right' })
       .text('info@reactfasttraining.co.uk', { width: 200, align: 'right' })
       .text('07447 485644', { width: 200, align: 'right' })
       .text('www.reactfasttraining.co.uk', { width: 200, align: 'right' })
       .moveDown(2);
  }

  private static drawInvoiceDetails(doc: PDFKit.PDFDocument, invoice: InvoiceData): void {
    // Invoice Title
    doc.fontSize(24)
       .fillColor('#0EA5E9')
       .text('INVOICE', 50, 130)
       .fontSize(10)
       .fillColor('#333333');

    // Invoice Details Box
    const detailsY = 160;
    const detailsX = 350;
    
    doc.fontSize(10);
    
    // Invoice Number
    doc.fillColor('#666666')
       .text('Invoice Number:', detailsX, detailsY)
       .fillColor('#333333')
       .font('Helvetica-Bold')
       .text(invoice.invoiceNumber, detailsX + 100, detailsY, { width: 100, align: 'right' })
       .font('Helvetica');

    // Invoice Date
    doc.fillColor('#666666')
       .text('Invoice Date:', detailsX, detailsY + 20)
       .fillColor('#333333')
       .font('Helvetica-Bold')
       .text(format(new Date(invoice.issueDate), 'dd/MM/yyyy'), detailsX + 100, detailsY + 20, { width: 100, align: 'right' })
       .font('Helvetica');

    // Payment Status
    doc.fillColor('#666666')
       .text('Payment Status:', detailsX, detailsY + 40)
       .fillColor('#10B981')
       .font('Helvetica-Bold')
       .text('PAID', detailsX + 100, detailsY + 40, { width: 100, align: 'right' })
       .font('Helvetica')
       .fillColor('#333333');
  }

  private static drawBillTo(doc: PDFKit.PDFDocument, user: any, y: number): void {
    doc.fontSize(12)
       .fillColor('#333333')
       .text('Bill To:', 50, y)
       .fontSize(10)
       .text(user.name, 50, y + 20)
       .text(user.email, 50, y + 35);
    
    if (user.phone) {
      doc.text(user.phone, 50, y + 50);
    }
  }

  private static drawLineItems(doc: PDFKit.PDFDocument, invoice: InvoiceData, startY: number): number {
    // Table Header
    doc.fontSize(12)
       .fillColor('#333333')
       .text('Course Details', 50, startY)
       .moveDown(0.5);

    const tableY = startY + 25;
    
    // Table Headers
    doc.fontSize(9)
       .fillColor('#666666')
       .text('Description', 50, tableY)
       .text('Date', 250, tableY)
       .text('Attendees', 350, tableY, { width: 60, align: 'center' })
       .text('Unit Price', 420, tableY, { width: 60, align: 'right' })
       .text('Total', 490, tableY, { width: 60, align: 'right' });

    // Draw line under headers
    doc.moveTo(50, tableY + 15)
       .lineTo(550, tableY + 15)
       .stroke('#E5E7EB');

    // Course Line Item
    const itemY = tableY + 25;
    const courseType = invoice.courseDetails?.courseType || 'First Aid Training Course';
    const sessionDate = invoice.courseDetails?.sessionDate 
      ? format(new Date(invoice.courseDetails.sessionDate), 'dd/MM/yyyy')
      : 'TBD';
    const price = invoice.courseDetails?.price || 75;
    
    doc.fontSize(10)
       .fillColor('#333333')
       .text(courseType, 50, itemY, { width: 190 })
       .text(sessionDate, 250, itemY, { width: 90 })
       .text(invoice.booking.numberOfAttendees.toString(), 350, itemY, { width: 60, align: 'center' })
       .text(`£${price.toFixed(2)}`, 420, itemY, { width: 60, align: 'right' })
       .text(`£${invoice.totalAmount}`, 490, itemY, { width: 60, align: 'right' });

    // Course Details
    if (invoice.courseDetails) {
      doc.fontSize(8)
         .fillColor('#666666')
         .text(`Time: ${invoice.courseDetails.startTime} - ${invoice.courseDetails.endTime}`, 70, itemY + 15)
         .text(`Location: ${invoice.courseDetails.location}`, 70, itemY + 28);
    }

    // Attendees List
    if (invoice.attendees && invoice.attendees.length > 0) {
      const attendeesY = itemY + 45;
      doc.fontSize(8)
         .fillColor('#666666')
         .text('Attendees: ', 70, attendeesY);
      
      const attendeeNames = invoice.attendees.map(a => a.name).join(', ');
      doc.text(attendeeNames, 120, attendeesY, { width: 400 });
      
      return attendeesY + 20;
    }

    return itemY + 45;
  }

  private static drawTotalSection(doc: PDFKit.PDFDocument, invoice: InvoiceData, y: number): number {
    // Draw separator line
    doc.moveTo(350, y)
       .lineTo(550, y)
       .stroke('#E5E7EB');

    const totalY = y + 15;

    // Subtotal
    doc.fontSize(10)
       .fillColor('#666666')
       .text('Subtotal:', 350, totalY)
       .fillColor('#333333')
       .text(`£${invoice.subtotal}`, 490, totalY, { width: 60, align: 'right' });

    // VAT
    doc.fillColor('#666666')
       .text('VAT (0%):', 350, totalY + 20)
       .fillColor('#333333')
       .text('£0.00', 490, totalY + 20, { width: 60, align: 'right' });

    // Draw line above total
    doc.moveTo(350, totalY + 35)
       .lineTo(550, totalY + 35)
       .stroke('#333333');

    // Total
    doc.fontSize(12)
       .fillColor('#333333')
       .font('Helvetica-Bold')
       .text('Total:', 350, totalY + 45)
       .text(`£${invoice.totalAmount}`, 490, totalY + 45, { width: 60, align: 'right' })
       .font('Helvetica');

    return totalY + 45;
  }

  private static drawPaymentStatus(doc: PDFKit.PDFDocument, invoice: InvoiceData, y: number): void {
    if (invoice.status === 'paid') {
      // Payment confirmation box
      doc.rect(50, y, 500, 40)
         .fill('#F0FDF4')
         .stroke('#86EFAC');

      doc.fontSize(11)
         .fillColor('#10B981')
         .text('✓ Payment Received - Thank You', 60, y + 13, { width: 480, align: 'center' });
    }
  }

  private static drawFooter(doc: PDFKit.PDFDocument): void {
    const footerY = 720;

    doc.fontSize(8)
       .fillColor('#666666')
       .text('Terms & Conditions', 50, footerY)
       .text('• Cancellations are subject to our refund policy', 50, footerY + 12)
       .text('• This invoice is generated electronically and is valid without signature', 50, footerY + 24)
       .text('• For queries, please contact info@reactfasttraining.co.uk', 50, footerY + 36)
       .moveDown()
       .fontSize(7)
       .text('React Fast Training is registered in England and Wales', 50, footerY + 60, { width: 500, align: 'center' })
       .text('Company Registration No: [To be provided]', 50, footerY + 72, { width: 500, align: 'center' });
  }
}