import { CertificateGenerator, CertificateData } from "./certificate-generator";

export interface GenerateCertificateParams {
  bookingId: string;
  certificateName: string;
  courseName: string;
  courseDate: string;
  location: string;
}

class CertificateService {
  private generator: CertificateGenerator;

  constructor() {
    this.generator = new CertificateGenerator();
  }

  /**
   * Generate a unique certificate number
   */
  generateCertificateNumber(): string {
    const prefix = "RFT";
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${prefix}-${year}-${random}`;
  }

  /**
   * Calculate certificate expiry date (3 years from issue)
   */
  calculateExpiryDate(issueDate: Date = new Date()): Date {
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    return expiryDate;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /**
   * Generate certificate for download
   */
  async generateCertificate(params: GenerateCertificateParams): Promise<Blob> {
    const certificateData: CertificateData = {
      certificateName: params.certificateName,
      courseName: params.courseName,
      courseDate: this.formatDate(params.courseDate),
      location: params.location,
      certificateNumber: this.generateCertificateNumber(),
      issueDate: this.formatDate(new Date()),
      expiryDate: this.formatDate(this.calculateExpiryDate()),
      trainerName: "Lex", // Default trainer
    };

    return this.generator.getCertificateBlob(certificateData);
  }

  /**
   * Download certificate directly
   */
  async downloadCertificate(params: GenerateCertificateParams): Promise<void> {
    const certificateData: CertificateData = {
      certificateName: params.certificateName,
      courseName: params.courseName,
      courseDate: this.formatDate(params.courseDate),
      location: params.location,
      certificateNumber: this.generateCertificateNumber(),
      issueDate: this.formatDate(new Date()),
      expiryDate: this.formatDate(this.calculateExpiryDate()),
      trainerName: "Lex",
    };

    this.generator.downloadCertificate(certificateData);
  }

  /**
   * Generate certificate and get base64 data URL
   */
  async generateCertificateDataUrl(
    params: GenerateCertificateParams,
  ): Promise<string> {
    const certificateData: CertificateData = {
      certificateName: params.certificateName,
      courseName: params.courseName,
      courseDate: this.formatDate(params.courseDate),
      location: params.location,
      certificateNumber: this.generateCertificateNumber(),
      issueDate: this.formatDate(new Date()),
      expiryDate: this.formatDate(this.calculateExpiryDate()),
      trainerName: "Lex",
    };

    return this.generator.generateCertificate(certificateData);
  }

  /**
   * Send certificate via email (calls backend API)
   */
  async emailCertificate(
    params: GenerateCertificateParams & { email: string },
  ): Promise<void> {
    const certificateBlob = await this.generateCertificate(params);

    // Create form data for upload
    const formData = new FormData();
    formData.append(
      "certificate",
      certificateBlob,
      `certificate-${params.bookingId}.pdf`,
    );
    formData.append("email", params.email);
    formData.append("certificateName", params.certificateName);
    formData.append("courseName", params.courseName);
    formData.append("bookingId", params.bookingId);

    // Send to backend
    const response = await fetch("/api/certificates/email", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to send certificate email");
    }
  }
}

export const certificateService = new CertificateService();
