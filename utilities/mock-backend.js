const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock create payment intent endpoint
app.post('/api/bookings/create-payment-intent', async (req, res) => {
  console.log('=== MOCK PAYMENT INTENT ===');
  console.log('Request body:', req.body);
  
  // Simulate payment intent creation
  const mockPaymentIntent = {
    id: 'pi_mock_' + Math.random().toString(36).substr(2, 9),
    client_secret: 'pi_mock_' + Math.random().toString(36).substr(2, 9) + '_secret_test',
    status: 'requires_payment_method',
    amount: req.body.totalAmount * 100, // Convert to cents
    currency: 'gbp'
  };
  
  console.log('Mock payment intent created:', mockPaymentIntent);
  
  res.json({
    success: true,
    paymentIntent: mockPaymentIntent
  });
});

// Mock confirm booking with payment endpoint
app.post('/api/bookings/confirm-with-payment', async (req, res) => {
  console.log('=== MOCK CONFIRM BOOKING WITH PAYMENT ===');
  console.log('Request body:', req.body);
  
  // Simulate successful booking confirmation
  const mockBooking = {
    id: 'booking_' + Math.random().toString(36).substr(2, 9),
    bookingReference: 'RFT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
    status: 'confirmed',
    paymentStatus: 'paid',
    totalAmount: req.body.totalAmount,
    courseSchedule: req.body.courseSchedule,
    participants: req.body.participants || [{
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    }],
    primaryContact: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      companyName: req.body.companyName
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log('Mock booking confirmed:', mockBooking);
  
  res.json({
    success: true,
    booking: mockBooking,
    confirmationCode: mockBooking.bookingReference
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Mock backend server running on http://localhost:${port}`);
  console.log('📋 Available endpoints:');
  console.log('  POST /api/bookings/create-payment-intent');
  console.log('  POST /api/bookings/confirm-with-payment');
  console.log('  GET /api/health');
});