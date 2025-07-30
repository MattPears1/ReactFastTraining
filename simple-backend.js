const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple analytics storage
let analytics = {
  totalViews: 0,
  weeklyViews: 0,
  lastWeekViews: 0,
  lastReset: new Date().toISOString()
};

// Load analytics from file if exists
try {
  if (fs.existsSync('analytics.json')) {
    analytics = JSON.parse(fs.readFileSync('analytics.json', 'utf8'));
  }
} catch (e) {
  console.log('Starting fresh analytics');
}

// Save analytics every 5 minutes
setInterval(() => {
  fs.writeFileSync('analytics.json', JSON.stringify(analytics));
}, 5 * 60 * 1000);

// Enable gzip compression
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://reactfasttraining.co.uk',
      'https://www.reactfasttraining.co.uk',
      'http://localhost:5173',
      'http://localhost:8081',
      'http://localhost:3000'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use('/api', cors(corsOptions));
app.use('/api', express.json());

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/ping', (req, res) => {
  res.json({
    greeting: 'Hello from React Fast Training API',
    date: new Date(),
    status: 'ok'
  });
});

// Contact form endpoints (support both paths)
app.post('/api/contact', handleContactForm);
app.post('/api/contact/submit', handleContactForm);

async function handleContactForm(req, res) {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and message are required' 
      });
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@reactfasttraining.co.uk',
      to: 'info@reactfasttraining.co.uk',
      subject: `Contact Form: ${subject || 'General Enquiry'}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject || 'General Enquiry'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>This email was sent from the React Fast Training website contact form.</em></p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send confirmation email to sender with a copy of their inquiry
    const confirmationOptions = {
      from: process.env.EMAIL_FROM || 'noreply@reactfasttraining.co.uk',
      to: email,
      subject: 'Your inquiry to React Fast Training - Copy for your records',
      html: `
        <h2>Thank you for your enquiry</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>If your enquiry is urgent, please call us on 07447 485644.</p>
        
        <hr>
        <h3>Copy of your inquiry:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject || 'General Enquiry'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        
        <p>Best regards,<br>React Fast Training Team</p>
        <p><em>This is an automated response. Please do not reply to this email.</em></p>
      `
    };

    await transporter.sendMail(confirmationOptions);

    res.json({ 
      success: true, 
      message: 'Thank you for your enquiry. We will get back to you soon!' 
    });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email. Please try again later.' 
    });
  }
}

// Testimonial submission endpoint - same pattern as contact form
app.post('/api/testimonials/submit', upload.single('photo'), async (req, res) => {
  try {
    // Extract testimonial data
    const testimonialData = {
      authorName: req.body.authorName,
      authorEmail: req.body.authorEmail,
      authorLocation: req.body.authorLocation,
      courseTaken: req.body.courseTaken,
      courseDate: req.body.courseDate,
      content: req.body.content,
      rating: parseInt(req.body.rating, 10),
      showFullName: req.body.showFullName === 'true',
      photoConsent: req.body.photoConsent,
      bookingReference: req.body.bookingReference,
      photoFile: req.file
    };

    console.log('📝 Testimonial submission received:', {
      authorName: testimonialData.authorName,
      authorEmail: testimonialData.authorEmail,
      courseTaken: testimonialData.courseTaken,
      rating: testimonialData.rating,
      hasPhoto: !!testimonialData.photoFile,
      timestamp: new Date().toISOString()
    });

    // Basic validation - same as contact form
    if (!testimonialData.authorName || !testimonialData.authorEmail || !testimonialData.content || !testimonialData.courseTaken || !testimonialData.rating) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, course, rating, and testimonial content are required'
      });
    }

    // Send notification email to business - exactly like contact form
    const businessEmailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@reactfasttraining.co.uk',
      to: 'info@reactfasttraining.co.uk',
      subject: `New Testimonial Received - ${testimonialData.courseTaken}`,
      html: `
        <h2>New Testimonial Received</h2>
        <p><strong>From:</strong> ${testimonialData.authorName} (${testimonialData.authorEmail})</p>
        <p><strong>Course:</strong> ${testimonialData.courseTaken}</p>
        ${testimonialData.courseDate ? `<p><strong>Course Date:</strong> ${testimonialData.courseDate}</p>` : ''}
        ${testimonialData.authorLocation ? `<p><strong>Location:</strong> ${testimonialData.authorLocation}</p>` : ''}
        <p><strong>Rating:</strong> ${'⭐'.repeat(testimonialData.rating)} (${testimonialData.rating}/5)</p>
        ${testimonialData.bookingReference ? `<p><strong>Booking Reference:</strong> ${testimonialData.bookingReference}</p>` : ''}
        <p><strong>Show Full Name:</strong> ${testimonialData.showFullName ? 'Yes' : 'No'}</p>
        <p><strong>Photo Consent:</strong> ${testimonialData.photoConsent === 'given' ? 'Yes' : 'No'}</p>
        ${testimonialData.photoFile ? `<p><strong>Photo:</strong> Attached (${testimonialData.photoFile.originalname})</p>` : ''}
        
        <h3>Testimonial:</h3>
        <p>${testimonialData.content}</p>
        <hr>
        <p><em>This email was sent from the React Fast Training website testimonial form.</em></p>
      `,
      attachments: testimonialData.photoFile ? [{
        filename: testimonialData.photoFile.originalname,
        content: testimonialData.photoFile.buffer,
        contentType: testimonialData.photoFile.mimetype
      }] : []
    };

    // Send confirmation email to customer - exactly like contact form
    const customerEmailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@reactfasttraining.co.uk',
      to: testimonialData.authorEmail,
      subject: 'Thank you for your testimonial - React Fast Training',
      html: `
        <h2>Thank you for your testimonial!</h2>
        <p>Dear ${testimonialData.authorName},</p>
        <p>We have received your testimonial and truly appreciate your feedback.</p>
        <p>If you have any questions, please call us on 07447 485644.</p>
        
        <hr>
        <h3>Copy of your testimonial:</h3>
        <p><strong>Name:</strong> ${testimonialData.authorName}</p>
        <p><strong>Email:</strong> ${testimonialData.authorEmail}</p>
        <p><strong>Course:</strong> ${testimonialData.courseTaken}</p>
        <p><strong>Rating:</strong> ${'⭐'.repeat(testimonialData.rating)} (${testimonialData.rating}/5)</p>
        <p><strong>Testimonial:</strong></p>
        <p>${testimonialData.content}</p>
        <hr>
        
        <p>Best regards,<br>React Fast Training Team</p>
        <p><em>This is an automated response. Please do not reply to this email.</em></p>
      `
    };

    // Send both emails - exactly like contact form
    await transporter.sendMail(businessEmailOptions);
    await transporter.sendMail(customerEmailOptions);

    res.json({
      success: true,
      message: 'Thank you for your testimonial! We appreciate your feedback and will review it shortly.'
    });
  } catch (error) {
    console.error('Testimonial email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit testimonial. Please try again later.'
    });
  }
});

// Track page views
app.get('/', (req, res, next) => {
  analytics.totalViews++;
  analytics.weeklyViews++;
  next();
});

// Weekly analytics email
async function sendWeeklyAnalytics() {
  const percentChange = analytics.lastWeekViews > 0 
    ? ((analytics.weeklyViews - analytics.lastWeekViews) / analytics.lastWeekViews * 100).toFixed(1)
    : 100;
  
  const emailHtml = `
    <h2>React Fast Training - Weekly Analytics Report</h2>
    <p>Here's your website performance for the week:</p>
    
    <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #0EA5E9;">📊 Total Views Since Launch: <strong>${analytics.totalViews}</strong></h3>
      <h3 style="color: #10B981;">📈 This Week's Views: <strong>${analytics.weeklyViews}</strong></h3>
      <h3 style="color: ${percentChange >= 0 ? '#10B981' : '#EF4444'};">
        ${percentChange >= 0 ? '📈' : '📉'} Change from Last Week: <strong>${percentChange >= 0 ? '+' : ''}${percentChange}%</strong>
      </h3>
    </div>
    
    <p>Keep up the great work!</p>
    <p><em>This is an automated weekly report from React Fast Training</em></p>
  `;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@reactfasttraining.co.uk',
      to: 'info@reactfasttraining.co.uk',
      subject: `Weekly Analytics Report - ${new Date().toLocaleDateString()}`,
      html: emailHtml
    });
    
    // Reset weekly counters
    analytics.lastWeekViews = analytics.weeklyViews;
    analytics.weeklyViews = 0;
    analytics.lastReset = new Date().toISOString();
    fs.writeFileSync('analytics.json', JSON.stringify(analytics));
  } catch (error) {
    console.error('Failed to send weekly analytics:', error);
  }
}

// Schedule weekly email - every Friday at 9 AM
setInterval(() => {
  const now = new Date();
  if (now.getDay() === 5 && now.getHours() === 9 && now.getMinutes() === 0) {
    sendWeeklyAnalytics();
  }
}, 60 * 1000); // Check every minute

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React routing
  app.get('*', (req, res) => {
    analytics.totalViews++;
    analytics.weeklyViews++;
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`
  🚀 React Fast Training Server
  📍 Running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});