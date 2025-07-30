const path = require('path');

function setupApiRoutes(app, db, emailService) {
  console.log('🔧 [API] Setting up public API routes...');

  // Health check endpoint
  app.get('/ping', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'React Fast Training API'
    });
  });

  // Get approved testimonials
  app.get('/api/testimonials/approved', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          id,
          name,
          course_name,
          testimonial_text,
          rating,
          created_at,
          is_homepage_featured
        FROM testimonials 
        WHERE status = 'approved' 
        ORDER BY 
          is_homepage_featured DESC,
          created_at DESC
        LIMIT 20
      `);

      const testimonials = result.rows.map(testimonial => ({
        id: testimonial.id,
        name: testimonial.name,
        courseName: testimonial.course_name,
        text: testimonial.testimonial_text,
        rating: testimonial.rating,
        date: testimonial.created_at,
        isFeatured: testimonial.is_homepage_featured
      }));

      res.json({ testimonials });
    } catch (error) {
      console.error('❌ [API] Error fetching testimonials:', error);
      res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
  });

  // Create payment intent for booking
  app.post('/api/bookings/create-payment-intent', async (req, res) => {
    try {
      const { amount, courseId, customerInfo } = req.body;

      if (!amount || !courseId || !customerInfo) {
        return res.status(400).json({ 
          error: 'Missing required fields: amount, courseId, customerInfo' 
        });
      }

      // Here you would integrate with Stripe or your payment processor
      // For now, returning a mock response
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        client_secret: `pi_${Date.now()}_secret_mock`,
        amount: amount,
        currency: 'gbp',
        status: 'requires_payment_method'
      };

      res.json({ paymentIntent });
    } catch (error) {
      console.error('❌ [API] Payment intent creation error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Confirm booking with payment
  app.post('/api/bookings/confirm-with-payment', async (req, res) => {
    try {
      const {
        paymentIntentId,
        courseId,
        sessionId,
        customerInfo,
        specialRequirements
      } = req.body;

      if (!paymentIntentId || !courseId || !customerInfo) {
        return res.status(400).json({ 
          error: 'Missing required booking information' 
        });
      }

      // Start transaction
      await db.query('BEGIN');

      try {
        // Insert booking
        const bookingResult = await db.query(`
          INSERT INTO bookings (
            first_name,
            last_name,
            email,
            phone,
            company,
            course_id,
            session_id,
            amount,
            payment_intent_id,
            special_requirements,
            status,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', NOW())
          RETURNING id, created_at
        `, [
          customerInfo.firstName,
          customerInfo.lastName,
          customerInfo.email,
          customerInfo.phone,
          customerInfo.company || null,
          courseId,
          sessionId || null,
          customerInfo.amount,
          paymentIntentId,
          specialRequirements || null
        ]);

        const booking = bookingResult.rows[0];

        // Send confirmation email
        if (emailService) {
          try {
            await emailService.sendBookingConfirmation({
              to: customerInfo.email,
              bookingId: booking.id,
              customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
              courseName: customerInfo.courseName,
              amount: customerInfo.amount
            });
          } catch (emailError) {
            console.error('❌ [API] Email sending failed:', emailError);
            // Don't fail the booking for email issues
          }
        }

        await db.query('COMMIT');

        res.json({
          success: true,
          bookingId: booking.id,
          message: 'Booking confirmed successfully'
        });

      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ [API] Booking confirmation error:', error);
      res.status(500).json({ error: 'Failed to confirm booking' });
    }
  });

  // Contact form submission
  app.post('/api/contact/submit', async (req, res) => {
    try {
      const { name, email, phone, subject, message, type } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, email, message' 
        });
      }

      // Store contact submission
      const result = await db.query(`
        INSERT INTO contact_submissions (
          name,
          email,
          phone,
          subject,
          message,
          type,
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'new', NOW())
        RETURNING id
      `, [name, email, phone || null, subject || 'General Enquiry', message, type || 'contact']);

      const submissionId = result.rows[0].id;

      // Send notification email
      if (emailService) {
        try {
          await emailService.sendContactNotification({
            submissionId,
            name,
            email,
            phone,
            subject: subject || 'General Enquiry',
            message,
            type: type || 'contact'
          });
        } catch (emailError) {
          console.error('❌ [API] Contact email notification failed:', emailError);
        }
      }

      res.json({
        success: true,
        message: 'Thank you for your enquiry. We will get back to you soon.',
        submissionId
      });

    } catch (error) {
      console.error('❌ [API] Contact form submission error:', error);
      res.status(500).json({ error: 'Failed to submit contact form' });
    }
  });

  // Course sessions endpoints
  app.get('/course-sessions/available', async (req, res) => {
    try {
      const { courseId, startDate, endDate } = req.query;

      let query = `
        SELECT 
          cs.id,
          cs.course_id,
          cs.start_datetime,
          cs.end_datetime,
          cs.max_participants,
          cs.current_participants,
          cs.venue,
          cs.instructor,
          cs.status,
          c.name as course_name,
          c.duration_hours,
          c.price
        FROM course_sessions cs
        JOIN courses c ON cs.course_id = c.id
        WHERE cs.status = 'active' 
        AND cs.start_datetime > NOW()
        AND (cs.max_participants - cs.current_participants) > 0
      `;

      const params = [];
      let paramIndex = 1;

      if (courseId) {
        query += ` AND cs.course_id = $${paramIndex}`;
        params.push(parseInt(courseId));
        paramIndex++;
      }

      if (startDate) {
        query += ` AND DATE(cs.start_datetime) >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND DATE(cs.start_datetime) <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      query += ' ORDER BY cs.start_datetime ASC';

      const result = await db.query(query, params);

      const sessions = result.rows.map(session => ({
        id: session.id,
        courseId: session.course_id,
        courseName: session.course_name,
        startDateTime: session.start_datetime,
        endDateTime: session.end_datetime,
        duration: session.duration_hours,
        price: session.price,
        maxParticipants: session.max_participants,
        currentParticipants: session.current_participants,
        availableSpaces: session.max_participants - session.current_participants,
        venue: session.venue,
        instructor: session.instructor,
        status: session.status
      }));

      res.json({ sessions });
    } catch (error) {
      console.error('❌ [API] Error fetching available sessions:', error);
      res.status(500).json({ error: 'Failed to fetch available sessions' });
    }
  });

  console.log('✅ [API] Public API routes configured');
}

module.exports = { setupApiRoutes };