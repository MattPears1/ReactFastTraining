const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
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

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
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

    // Send confirmation email to sender
    const confirmationOptions = {
      from: process.env.EMAIL_FROM || 'noreply@reactfasttraining.co.uk',
      to: email,
      subject: 'Thank you for contacting React Fast Training',
      html: `
        <h2>Thank you for your enquiry</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>If your enquiry is urgent, please call us on 07123 456789.</p>
        <p>Best regards,<br>React Fast Training Team</p>
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
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React routing
  app.get('*', (req, res) => {
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