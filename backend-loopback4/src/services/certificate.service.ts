import {injectable, BindingScope, inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CertificateRepository, BookingRepository, UserRepository} from '../repositories';
import {Certificate} from '../models';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import {EmailService} from './email.service';

export interface CertificateData {
  certificateName: string;
  courseName: string;
  courseDate: Date;
  location: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  trainerId: number;
  trainerName: string;
}

@injectable({scope: BindingScope.SINGLETON})
export class CertificateService {
  constructor(
    @repository(CertificateRepository)
    private certificateRepository: CertificateRepository,
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
    @repository(UserRepository)
    private userRepository: UserRepository,
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  /**
   * Generate a unique certificate number
   */
  private generateCertificateNumber(): string {
    const prefix = 'RFT';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}-${random}`;
  }

  /**
   * Generate certificate for a booking after attendance confirmation
   */
  async generateCertificateForBooking(bookingId: number, markedBy: string): Promise<Certificate> {
    // Get booking details
    const booking = await this.bookingRepository.findById(bookingId, {
      include: ['courseSchedule', 'user']
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if certificate already exists
    const existingCertificate = await this.certificateRepository.findOne({
      where: {bookingId: bookingId}
    });

    if (existingCertificate) {
      throw new Error('Certificate already exists for this booking');
    }

    // Get participant's certificate name
    const certificateName = booking.participants?.[0]?.certificateName || 
                          `${booking.participants?.[0]?.firstName} ${booking.participants?.[0]?.lastName}`;

    // Generate certificate data
    const certificateData: CertificateData = {
      certificateName: certificateName,
      courseName: booking.courseSchedule.courseName,
      courseDate: booking.courseSchedule.startDate,
      location: booking.courseSchedule.venueName,
      certificateNumber: this.generateCertificateNumber(),
      issueDate: new Date(),
      expiryDate: this.calculateExpiryDate(booking.courseSchedule.courseName),
      trainerId: booking.courseSchedule.instructorId || 1,
      trainerName: booking.courseSchedule.instructorName || 'Lex',
    };

    // Generate PDF
    const pdfPath = await this.generatePDF(certificateData);

    // Create certificate record
    const certificate = await this.certificateRepository.create({
      bookingId: bookingId,
      userId: booking.userId,
      courseScheduleId: booking.courseScheduleId,
      certificateNumber: certificateData.certificateNumber,
      issuedDate: certificateData.issueDate,
      expiryDate: certificateData.expiryDate,
      certificateUrl: pdfPath,
      issuedBy: markedBy,
      status: 'ACTIVE',
      metadata: {
        certificateName: certificateData.certificateName,
        courseName: certificateData.courseName,
        location: certificateData.location,
      }
    });

    // Send certificate email
    await this.sendCertificateEmail(booking, certificate, certificateData);

    return certificate;
  }

  /**
   * Calculate certificate expiry date based on course type
   */
  private calculateExpiryDate(courseName: string): Date {
    const expiryDate = new Date();
    
    // Most first aid certificates are valid for 3 years
    if (courseName.toLowerCase().includes('first aid')) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    } else if (courseName.toLowerCase().includes('fire')) {
      // Fire safety certificates typically last 1 year
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      // Default to 3 years
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    }

    return expiryDate;
  }

  /**
   * Generate PDF certificate using Puppeteer
   */
  private async generatePDF(data: CertificateData): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Get HTML template
      const html = this.generateCertificateHTML(data);
      
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Set PDF options
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0'
        }
      });

      // Save PDF to file system
      const fileName = `certificate_${data.certificateNumber}.pdf`;
      const filePath = path.join(__dirname, '..', '..', 'certificates', fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, pdfBuffer);

      return `/certificates/${fileName}`;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML template for certificate
   */
  private generateCertificateHTML(data: CertificateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      width: 297mm;
      height: 210mm;
      position: relative;
      background: white;
    }
    
    .certificate {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 40mm;
      box-sizing: border-box;
      background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .border {
      position: absolute;
      top: 20mm;
      left: 20mm;
      right: 20mm;
      bottom: 20mm;
      border: 3px solid #0EA5E9;
      border-radius: 10px;
    }
    
    .inner-border {
      position: absolute;
      top: 25mm;
      left: 25mm;
      right: 25mm;
      bottom: 25mm;
      border: 1px solid #0EA5E9;
      border-radius: 8px;
    }
    
    .logo {
      position: absolute;
      top: 30mm;
      left: 50%;
      transform: translateX(-50%);
      width: 60mm;
      text-align: center;
    }
    
    .logo h1 {
      margin: 0;
      font-size: 24pt;
      color: #0EA5E9;
      font-weight: bold;
    }
    
    .logo p {
      margin: 5px 0 0 0;
      font-size: 10pt;
      color: #666;
    }
    
    .content {
      text-align: center;
      z-index: 1;
      margin-top: 20mm;
    }
    
    .title {
      font-size: 36pt;
      color: #0369A1;
      margin-bottom: 10mm;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .subtitle {
      font-size: 14pt;
      color: #666;
      margin-bottom: 15mm;
    }
    
    .recipient {
      font-size: 28pt;
      color: #0EA5E9;
      margin: 15mm 0;
      font-weight: bold;
      text-decoration: underline;
      text-underline-offset: 5px;
    }
    
    .course-info {
      font-size: 16pt;
      color: #333;
      line-height: 1.8;
      margin-bottom: 15mm;
    }
    
    .details {
      display: flex;
      justify-content: space-around;
      width: 100%;
      margin-top: 20mm;
    }
    
    .detail-item {
      text-align: center;
    }
    
    .detail-label {
      font-size: 10pt;
      color: #666;
      margin-bottom: 5px;
    }
    
    .detail-value {
      font-size: 12pt;
      color: #333;
      font-weight: bold;
    }
    
    .footer {
      position: absolute;
      bottom: 30mm;
      left: 30mm;
      right: 30mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature {
      text-align: center;
    }
    
    .signature-line {
      width: 60mm;
      border-bottom: 1px solid #333;
      margin-bottom: 5px;
    }
    
    .signature-name {
      font-size: 10pt;
      color: #333;
    }
    
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120pt;
      color: rgba(14, 165, 233, 0.05);
      font-weight: bold;
      z-index: 0;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border"></div>
    <div class="inner-border"></div>
    <div class="watermark">CERTIFIED</div>
    
    <div class="logo">
      <h1>React Fast Training</h1>
      <p>Yorkshire's Premier First Aid Training Provider</p>
    </div>
    
    <div class="content">
      <h2 class="title">Certificate of Completion</h2>
      <p class="subtitle">This is to certify that</p>
      
      <div class="recipient">${data.certificateName}</div>
      
      <div class="course-info">
        has successfully completed the<br>
        <strong>${data.courseName}</strong><br>
        course on ${new Date(data.courseDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}<br>
        at ${data.location}
      </div>
      
      <div class="details">
        <div class="detail-item">
          <div class="detail-label">Certificate Number</div>
          <div class="detail-value">${data.certificateNumber}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Issue Date</div>
          <div class="detail-value">${new Date(data.issueDate).toLocaleDateString('en-GB')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Expiry Date</div>
          <div class="detail-value">${new Date(data.expiryDate).toLocaleDateString('en-GB')}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-name">${data.trainerName}<br>Senior First Aid Trainer</div>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-name">Lex<br>Training Director</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send certificate email to participant
   */
  private async sendCertificateEmail(booking: any, certificate: Certificate, data: CertificateData): Promise<void> {
    const emailData = {
      to: booking.contactDetails.email,
      subject: `Your ${data.courseName} Certificate - React Fast Training`,
      template: 'certificate',
      data: {
        name: data.certificateName,
        courseName: data.courseName,
        courseDate: new Date(data.courseDate).toLocaleDateString('en-GB'),
        certificateNumber: data.certificateNumber,
        expiryDate: new Date(data.expiryDate).toLocaleDateString('en-GB'),
        downloadUrl: `https://reactfasttraining.co.uk/certificates/${certificate.id}/download`,
      },
      attachments: [{
        filename: `Certificate_${data.certificateNumber}.pdf`,
        path: path.join(__dirname, '..', '..', certificate.certificateUrl),
      }]
    };

    await this.emailService.sendEmail(emailData);
  }

  /**
   * Generate certificates for all attendees marked as present
   */
  async generateCertificatesForSession(sessionId: number, markedBy: string): Promise<Certificate[]> {
    // Get all bookings for the session marked as present
    const bookings = await this.bookingRepository.find({
      where: {
        courseScheduleId: sessionId,
        status: 'ATTENDED', // Assuming attendance marking updates booking status
      }
    });

    const certificates: Certificate[] = [];

    for (const booking of bookings) {
      try {
        const certificate = await this.generateCertificateForBooking(booking.id, markedBy);
        certificates.push(certificate);
      } catch (error) {
        console.error(`Failed to generate certificate for booking ${booking.id}:`, error);
      }
    }

    return certificates;
  }

  /**
   * Download certificate PDF
   */
  async downloadCertificate(certificateId: string): Promise<Buffer> {
    const certificate = await this.certificateRepository.findById(certificateId);
    
    if (!certificate) {
      throw new Error('Certificate not found');
    }

    const filePath = path.join(__dirname, '..', '..', certificate.certificateUrl);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Certificate file not found');
    }

    return fs.readFileSync(filePath);
  }
}