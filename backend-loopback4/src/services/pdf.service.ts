import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

interface BookingDetails {
  bookingReference: string;
  courseDetails: {
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
    duration?: string;
    price: number;
  };
  attendees: Array<{ name: string; email: string }>;
  numberOfAttendees?: number;
  totalAmount: string;
  specialRequirements?: string;
}

export class PDFService {
  static async generateBookingConfirmation(booking: BookingDetails): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Booking Confirmation - ${booking.bookingReference}`,
          Author: 'React Fast Training',
          Subject: 'Course Booking Confirmation',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with gradient effect (simulated)
      doc.rect(0, 0, doc.page.width, 120)
         .fill('#0EA5E9');
      
      // Logo/Title
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .text('REACT FAST TRAINING', 50, 40, { align: 'center' });
      
      doc.fontSize(14)
         .text('Yorkshire\'s Premier First Aid Training Provider', 50, 75, { align: 'center' });

      // Reset to default color
      doc.fillColor('#000000');

      // Booking Confirmation Title
      doc.fontSize(24)
         .fillColor('#0EA5E9')
         .text('BOOKING CONFIRMATION', 50, 150, { align: 'center' });
      
      // Booking Reference Box
      doc.rect(150, 190, 300, 50)
         .fillAndStroke('#E0F2FE', '#0EA5E9');
      
      doc.fillColor('#0EA5E9')
         .fontSize(12)
         .text('Booking Reference', 0, 200, { align: 'center' });
      
      doc.fontSize(20)
         .text(booking.bookingReference, 0, 215, { align: 'center' });

      // Reset position and color
      doc.fillColor('#333333')
         .fontSize(11);

      let yPosition = 270;

      // Course Details Section
      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('Course Details', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#333333');

      this.addRow(doc, 'Course:', booking.courseDetails.courseType, 50, yPosition);
      yPosition += 20;
      
      this.addRow(doc, 'Date:', format(new Date(booking.courseDetails.sessionDate), 'EEEE, d MMMM yyyy'), 50, yPosition);
      yPosition += 20;
      
      this.addRow(doc, 'Time:', `${booking.courseDetails.startTime} - ${booking.courseDetails.endTime}`, 50, yPosition);
      yPosition += 20;
      
      this.addRow(doc, 'Location:', booking.courseDetails.location, 50, yPosition);
      yPosition += 20;
      
      if (booking.courseDetails.duration) {
        this.addRow(doc, 'Duration:', booking.courseDetails.duration, 50, yPosition);
        yPosition += 20;
      }

      // Attendees Section
      yPosition += 15;
      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('Attendees', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#333333');

      booking.attendees.forEach((attendee, index) => {
        doc.text(`${index + 1}. ${attendee.name} (${attendee.email})`, 50, yPosition);
        yPosition += 18;
      });

      // Special Requirements (if any)
      if (booking.specialRequirements) {
        yPosition += 15;
        doc.fontSize(14)
           .fillColor('#1F2937')
           .text('Special Requirements', 50, yPosition);
        
        yPosition += 25;
        doc.fontSize(11)
           .fillColor('#333333')
           .text(booking.specialRequirements, 50, yPosition, { width: 500 });
        yPosition += 40;
      }

      // Payment Summary
      yPosition += 15;
      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('Payment Summary', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#333333');

      const attendeeCount = booking.numberOfAttendees || booking.attendees.length;
      this.addRow(doc, 'Number of Attendees:', attendeeCount.toString(), 50, yPosition);
      yPosition += 20;
      
      this.addRow(doc, 'Price per Person:', `£${booking.courseDetails.price}`, 50, yPosition);
      yPosition += 20;
      
      // Total amount in bold
      doc.fontSize(12)
         .font('Helvetica-Bold');
      this.addRow(doc, 'Total Amount:', `£${booking.totalAmount}`, 50, yPosition);
      doc.font('Helvetica');

      // Important Information Box
      yPosition += 40;
      doc.rect(50, yPosition, 500, 120)
         .fillAndStroke('#FEF3C7', '#F59E0B');
      
      doc.fillColor('#92400E')
         .fontSize(12)
         .text('Important Information', 60, yPosition + 10);
      
      doc.fontSize(10)
         .text('• Please arrive 15 minutes before the start time', 60, yPosition + 30)
         .text('• Wear comfortable clothing suitable for practical exercises', 60, yPosition + 45)
         .text('• Bring a form of photo ID for registration', 60, yPosition + 60)
         .text('• Lunch and refreshments will be provided', 60, yPosition + 75)
         .text('• Free parking available at the venue', 60, yPosition + 90);

      // Footer
      const footerY = doc.page.height - 80;
      doc.fontSize(10)
         .fillColor('#666666')
         .text('React Fast Training', 50, footerY, { align: 'center' })
         .text('Yorkshire\'s Premier First Aid Training Provider', 50, footerY + 15, { align: 'center' })
         .text('info@reactfasttraining.co.uk | 07447 485644', 50, footerY + 30, { align: 'center' })
         .text('www.reactfasttraining.co.uk', 50, footerY + 45, { align: 'center' });

      doc.end();
    });
  }

  static async generateCertificate(certificateData: any): Promise<Buffer> {
    // TODO: Implement certificate generation
    return Buffer.from('Certificate generation not yet implemented');
  }

  private static addRow(doc: any, label: string, value: string, x: number, y: number) {
    doc.fillColor('#666666')
       .text(label, x, y, { continued: true })
       .fillColor('#333333')
       .text(' ' + value, { width: 400 });
  }
}