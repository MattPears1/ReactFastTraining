# Database Implementation Plan - Certificate & Customer Management

**Last Updated: 28th July 2025 - 00:00**

## 🎯 Implementation Overview

This document outlines the database changes and implementation steps needed for proper certificate management and customer records tracking.

## 📊 Database Schema Updates

### 1. Booking Model Enhancement

```typescript
// Add to participants array in booking.model.ts
participants: Array<{
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  certificateName: string; // NEW: Name as it should appear on certificate
  emergencyContact?: {...};
  medicalConditions?: string;
  dietaryRequirements?: string;
}>;
```

### 2. Customer Records Table (NEW)

```sql
CREATE TABLE customer_records (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  company VARCHAR(255),
  
  -- Training statistics
  total_courses_completed INTEGER DEFAULT 0,
  first_training_date DATE,
  last_training_date DATE,
  next_renewal_due DATE,
  
  -- Certificate tracking
  active_certificates INTEGER DEFAULT 0,
  expired_certificates INTEGER DEFAULT 0,
  total_certificates INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Certificate Templates Table (NEW)

```sql
CREATE TABLE certificate_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  course_type VARCHAR(100) NOT NULL,
  template_html TEXT NOT NULL,
  template_variables JSON DEFAULT '{}',
  certification_body VARCHAR(100),
  validity_years INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Certificate Audit Log Table (NEW)

```sql
CREATE TABLE certificate_audit_log (
  id SERIAL PRIMARY KEY,
  certificate_id UUID REFERENCES certificates(id),
  action VARCHAR(50) NOT NULL, -- generated, emailed, downloaded, reissued
  performed_by_email VARCHAR(255),
  ip_address VARCHAR(45),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Certificate Model Enhancement

```typescript
// Add to certificate.model.ts
@property({
  type: 'string',
  required: true,
})
certificateName: string; // Name as appears on certificate

@property({
  type: 'boolean',
  default: false,
})
emailed: boolean;

@property({
  type: 'date',
})
emailedAt?: Date;

@property({
  type: 'number',
  default: 0,
})
downloadCount: number;

@property({
  type: 'date',
})
lastDownloadedAt?: Date;
```

## 🔄 Implementation Workflow

### Phase 1: Booking Enhancement
1. **Update Booking Form**
   ```typescript
   // Add to booking form after participant details
   <div className="certificate-name-section">
     <h3>Certificate Information</h3>
     <p className="warning">
       ⚠️ Please enter your name EXACTLY as you want it to appear on your certificate.
       This cannot be changed after booking.
     </p>
     <input
       type="text"
       name="certificateName"
       placeholder="Full name for certificate (e.g., Matthew John Smith)"
       required
     />
   </div>
   ```

2. **Update Booking API**
   - Accept certificateName in booking request
   - Validate certificate name is provided
   - Store in participants array

### Phase 2: Attendance & Certificate Generation

1. **Admin Attendance Page**
   ```typescript
   // New admin page: /admin/sessions/:id/attendance
   interface AttendanceManagement {
     sessionId: string;
     participants: Participant[];
     actions: {
       markAttended: (participantId: string) => void;
       markNoShow: (participantId: string) => void;
       generateCertificates: () => void;
     };
   }
   ```

2. **Certificate Generation Service**
   ```typescript
   class CertificateService {
     async generateCertificate(booking: Booking, participant: Participant) {
       // 1. Get template for course type
       const template = await this.getTemplate(booking.courseType);
       
       // 2. Replace variables
       const html = this.replaceVariables(template, {
         certificate_name: participant.certificateName,
         course_name: booking.courseName,
         completion_date: formatDate(booking.sessionDate),
         expiry_date: addYears(booking.sessionDate, 3),
         certificate_number: this.generateCertificateNumber(),
         trainer_name: 'Lex Richardson'
       });
       
       // 3. Generate PDF
       const pdf = await this.generatePDF(html);
       
       // 4. Save certificate record
       const certificate = await this.saveCertificate({
         bookingId: booking.id,
         participantDetails: participant,
         pdfUrl: pdf.url,
         status: 'ISSUED'
       });
       
       // 5. Send email
       await this.emailCertificate(certificate, participant.email);
       
       return certificate;
     }
   }
   ```

3. **Email Template**
   ```html
   Subject: Your React Fast Training Certificate - {{courseName}}
   
   Dear {{certificateName}},
   
   Thank you for attending the {{courseName}} training on {{completionDate}}.
   
   We are pleased to confirm that you have successfully completed the course.
   Your certificate is attached to this email.
   
   Certificate Details:
   - Certificate Number: {{certificateNumber}}
   - Valid Until: {{expiryDate}}
   
   Please keep this certificate safe for your records.
   
   Best regards,
   Lex Richardson
   React Fast Training
   ```

### Phase 3: Customer Records

1. **Automatic Customer Record Creation**
   ```typescript
   // Trigger after booking confirmation
   async function updateCustomerRecord(booking: Booking) {
     const record = await CustomerRecord.findOrCreate({
       where: { email: booking.contactDetails.email },
       defaults: {
         firstName: booking.contactDetails.firstName,
         lastName: booking.contactDetails.lastName,
         phone: booking.contactDetails.phone,
         company: booking.contactDetails.company
       }
     });
     
     // Update statistics
     record.totalCoursesCompleted += 1;
     record.lastTrainingDate = new Date();
     if (!record.firstTrainingDate) {
       record.firstTrainingDate = new Date();
     }
     
     await record.save();
   }
   ```

2. **Certificate Tracking**
   ```typescript
   // Update after certificate generation
   async function updateCertificateTracking(customerId: string) {
     const record = await CustomerRecord.findById(customerId);
     const certificates = await Certificate.find({
       where: { 'participantDetails.email': record.email }
     });
     
     record.activeCertificates = certificates.filter(c => 
       c.expiryDate > new Date() && c.status === 'ISSUED'
     ).length;
     
     record.expiredCertificates = certificates.filter(c => 
       c.expiryDate <= new Date()
     ).length;
     
     record.totalCertificates = certificates.length;
     
     // Find next renewal date
     const nextRenewal = certificates
       .filter(c => c.expiryDate > new Date())
       .sort((a, b) => a.expiryDate - b.expiryDate)[0];
       
     record.nextRenewalDue = nextRenewal?.expiryDate;
     
     await record.save();
   }
   ```

## 🛠️ Technical Requirements

### PDF Generation Options

1. **Puppeteer** (Recommended)
   ```typescript
   import puppeteer from 'puppeteer';
   
   async function generatePDF(html: string): Promise<Buffer> {
     const browser = await puppeteer.launch();
     const page = await browser.newPage();
     await page.setContent(html);
     const pdf = await page.pdf({
       format: 'A4',
       printBackground: true,
       margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
     });
     await browser.close();
     return pdf;
   }
   ```

2. **PDFKit** (Alternative)
   - Programmatic PDF creation
   - More control but more complex

### Storage Considerations

Since cloud storage is not allowed (per CRITICAL_DO_NOT_DO):
- Store PDFs locally in `/certificates` directory
- Implement cleanup for old certificates
- Consider disk space limitations

## 📈 Success Metrics

1. **Certificate Generation Time**: < 5 seconds per certificate
2. **Email Delivery Rate**: > 99%
3. **Customer Satisfaction**: Easy certificate access
4. **Data Accuracy**: 100% correct names on certificates

## 🚧 Implementation Phases

### Phase 1 (Week 1)
- [ ] Add certificate_name to booking form
- [ ] Update booking API
- [ ] Create database migrations
- [ ] Seed certificate templates

### Phase 2 (Week 2)
- [ ] Build attendance management UI
- [ ] Implement PDF generation
- [ ] Create certificate service
- [ ] Set up email templates

### Phase 3 (Week 3)
- [ ] Create customer records system
- [ ] Build certificate tracking
- [ ] Implement audit logging
- [ ] Add download functionality

### Phase 4 (Week 4)
- [ ] Testing and refinement
- [ ] Documentation
- [ ] Admin training
- [ ] Go-live preparation

---

This plan ensures proper certificate management while respecting all business constraints outlined in CRITICAL_DO_NOT_DO.md.