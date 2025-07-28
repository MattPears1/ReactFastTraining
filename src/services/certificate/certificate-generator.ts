import { jsPDF } from 'jspdf';

export interface CertificateData {
  certificateName: string;
  courseName: string;
  courseDate: string;
  location: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  trainerName: string;
}

export class CertificateGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
  }

  generateCertificate(data: CertificateData): string {
    // Reset document
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();

    // Background color
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Border
    this.doc.setDrawColor(14, 165, 233); // Primary blue
    this.doc.setLineWidth(2);
    this.doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

    // Inner border
    this.doc.setLineWidth(0.5);
    this.doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

    // Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(36);
    this.doc.setTextColor(14, 165, 233);
    this.doc.text('Certificate of Completion', pageWidth / 2, 40, { align: 'center' });

    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('This is to certify that', pageWidth / 2, 55, { align: 'center' });

    // Recipient name
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(28);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.certificateName, pageWidth / 2, 75, { align: 'center' });

    // Course completion text
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(14);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('has successfully completed the', pageWidth / 2, 90, { align: 'center' });

    // Course name
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(20);
    this.doc.setTextColor(14, 165, 233);
    this.doc.text(data.courseName, pageWidth / 2, 105, { align: 'center' });

    // Date and location
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(14);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`on ${data.courseDate} at ${data.location}`, pageWidth / 2, 120, { align: 'center' });

    // Certificate details
    this.doc.setFontSize(12);
    const detailsY = 145;
    const leftX = 40;
    const rightX = pageWidth - 40;

    // Certificate number
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Certificate Number:', leftX, detailsY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.certificateNumber, leftX + 45, detailsY);

    // Issue date
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Issue Date:', leftX, detailsY + 10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.issueDate, leftX + 25, detailsY + 10);

    // Expiry date
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Valid Until:', rightX - 80, detailsY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.expiryDate, rightX - 55, detailsY);

    // Trainer signature area
    this.doc.setLineWidth(0.5);
    this.doc.line(leftX, detailsY + 30, leftX + 80, detailsY + 30);
    this.doc.setFontSize(11);
    this.doc.text('Trainer Signature', leftX + 20, detailsY + 35);
    this.doc.text(data.trainerName, leftX + 20, detailsY + 42);

    // Company stamp area
    this.doc.line(rightX - 80, detailsY + 30, rightX, detailsY + 30);
    this.doc.text('Authorized Signature', rightX - 60, detailsY + 35);

    // Footer
    this.doc.setFontSize(10);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text('React Fast Training - Yorkshire\'s Premier First Aid Training Provider', pageWidth / 2, pageHeight - 20, { align: 'center' });
    this.doc.text('www.reactfasttraining.co.uk', pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Generate base64 string
    return this.doc.output('datauristring');
  }

  downloadCertificate(data: CertificateData, filename?: string): void {
    this.generateCertificate(data);
    this.doc.save(filename || `certificate-${data.certificateNumber}.pdf`);
  }

  getCertificateBlob(data: CertificateData): Blob {
    this.generateCertificate(data);
    return this.doc.output('blob');
  }
}