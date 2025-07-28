export const certificateEmailTemplate = (data: {
  name: string;
  courseName: string;
  courseDate: string;
  certificateNumber: string;
  expiryDate: string;
  downloadUrl: string;
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Certificate - React Fast Training</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #0EA5E9;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 20px;
      color: #333333;
    }
    .congratulations {
      background-color: #10B981;
      color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
    }
    .congratulations h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .certificate-info {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .info-label {
      font-weight: bold;
      color: #4b5563;
    }
    .info-value {
      color: #1f2937;
    }
    .download-button {
      display: inline-block;
      background-color: #0EA5E9;
      color: #ffffff;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f3f4f6;
      padding: 30px 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #0EA5E9;
      text-decoration: none;
    }
    .medical-cross {
      display: inline-block;
      width: 40px;
      height: 40px;
      background-color: #ffffff;
      position: relative;
      margin: 0 auto 10px;
      border-radius: 4px;
    }
    .medical-cross::before,
    .medical-cross::after {
      content: '';
      position: absolute;
      background-color: #EF4444;
    }
    .medical-cross::before {
      width: 20px;
      height: 4px;
      top: 18px;
      left: 10px;
    }
    .medical-cross::after {
      width: 4px;
      height: 20px;
      top: 10px;
      left: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="medical-cross"></div>
      <h1>React Fast Training</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Congratulations Section -->
      <div class="congratulations">
        <h2>🎉 Congratulations ${data.name}!</h2>
        <p style="margin: 0; font-size: 16px;">You have successfully completed your training</p>
      </div>
      
      <!-- Introduction -->
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Dear ${data.name},
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        We are pleased to confirm that you have successfully completed the <strong>${data.courseName}</strong> 
        course on ${data.courseDate}. Your certificate is now ready for download.
      </p>
      
      <!-- Certificate Details -->
      <div class="certificate-info">
        <h3 style="margin-top: 0; color: #1f2937;">Certificate Details</h3>
        <div class="info-row">
          <span class="info-label">Certificate Number:</span>
          <span class="info-value">${data.certificateNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Course Name:</span>
          <span class="info-value">${data.courseName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Completion Date:</span>
          <span class="info-value">${data.courseDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Valid Until:</span>
          <span class="info-value">${data.expiryDate}</span>
        </div>
      </div>
      
      <!-- Download Button -->
      <div style="text-align: center;">
        <a href="${data.downloadUrl}" class="download-button">
          Download Your Certificate
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
          Your certificate is also attached to this email
        </p>
      </div>
      
      <!-- Additional Information -->
      <h3 style="color: #1f2937; margin-top: 40px;">Important Information</h3>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>Please keep your certificate in a safe place for your records</li>
        <li>Your certificate is valid for 3 years from the completion date</li>
        <li>We recommend scheduling a refresher course 3 months before expiry</li>
        <li>If you need a replacement certificate, please contact us</li>
      </ul>
      
      <!-- Thank You Message -->
      <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
        Thank you for choosing React Fast Training for your first aid education. 
        We hope you found the course informative and valuable.
      </p>
      
      <p style="font-size: 16px; line-height: 1.6;">
        If you have any questions or need assistance, please don't hesitate to contact us.
      </p>
      
      <p style="font-size: 16px; line-height: 1.6;">
        Best regards,<br>
        <strong>The React Fast Training Team</strong>
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        <strong>React Fast Training</strong><br>
        Yorkshire's Premier First Aid Training Provider
      </p>
      <p style="margin: 0 0 10px 0;">
        📧 <a href="mailto:info@reactfasttraining.co.uk">info@reactfasttraining.co.uk</a><br>
        🌐 <a href="https://reactfasttraining.co.uk">www.reactfasttraining.co.uk</a>
      </p>
      <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
        This email was sent to you because you completed a course with React Fast Training. 
        Your certificate is attached to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
