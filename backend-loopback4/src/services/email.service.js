const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    // Initialize transporter with environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      }
    });

    // Register Handlebars helpers
    handlebars.registerHelper('formatDate', (date) => {
      return new Date(date).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    handlebars.registerHelper('formatTime', (datetime) => {
      return new Date(datetime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    handlebars.registerHelper('formatCurrency', (amount) => {
      return `£${parseFloat(amount).toFixed(2)}`;
    });
  }

  /**
   * Process email queue
   */
  async processEmailQueue(db) {
    try {
      // Get pending emails
      const pendingEmails = await db.query(`
        SELECT * FROM email_queue 
        WHERE status = 'pending' 
        AND scheduled_for <= CURRENT_TIMESTAMP
        AND attempts < 3
        ORDER BY priority DESC, scheduled_for ASC
        LIMIT 10
      `);

      for (const email of pendingEmails.rows) {
        await this.sendQueuedEmail(db, email);
      }

      return {
        processed: pendingEmails.rows.length,
        success: pendingEmails.rows.filter(e => e.status === 'sent').length
      };
    } catch (error) {
      console.error('Error processing email queue:', error);
      throw error;
    }
  }

  /**
   * Send a queued email
   */
  async sendQueuedEmail(db, email) {
    try {
      // Update status to sending
      await db.query(
        'UPDATE email_queue SET status = $1, attempts = attempts + 1 WHERE id = $2',
        ['sending', email.id]
      );

      let htmlContent = email.body_html;
      let textContent = email.body_text;

      // If template is used, compile it
      if (email.template_id) {
        const template = await db.query(
          'SELECT * FROM email_templates WHERE id = $1',
          [email.template_id]
        );

        if (template.rows[0]) {
          const htmlTemplate = handlebars.compile(template.rows[0].body_html);
          const textTemplate = handlebars.compile(template.rows[0].body_text);
          
          htmlContent = htmlTemplate(email.variables);
          textContent = textTemplate(email.variables);
        }
      }

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${email.from_name}" <${email.from_email}>`,
        to: email.to_email,
        subject: email.subject,
        text: textContent,
        html: htmlContent
      });

      // Update status to sent
      await db.query(
        'UPDATE email_queue SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['sent', email.id]
      );

      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      // Update status to failed
      await db.query(
        'UPDATE email_queue SET status = $1, last_error = $2 WHERE id = $3',
        ['failed', error.message, email.id]
      );
      
      console.error(`Failed to send email ${email.id}:`, error);
      throw error;
    }
  }

  /**
   * Queue a booking confirmation email
   */
  async queueBookingConfirmation(db, booking, session, user) {
    const variables = {
      userName: user.name,
      courseName: session.courseName,
      sessionDate: session.date,
      sessionTime: `${session.startTime} - ${session.endTime}`,
      venueName: session.venueName,
      venueAddress: `${session.venueAddress}, ${session.venueCity} ${session.venuePostcode}`,
      amountPaid: booking.payment_amount
    };

    return await db.query(`
      SELECT queue_email(
        $1::varchar,
        'Booking Confirmation - ' || $2::varchar,
        '',
        '',
        (SELECT id FROM email_templates WHERE name = 'booking_confirmation'),
        $3::jsonb,
        8,
        CURRENT_TIMESTAMP
      )
    `, [user.email, session.courseName, JSON.stringify(variables)]);
  }

  /**
   * Queue session cancellation emails
   */
  async queueCancellationEmails(db, sessionId, reason) {
    // Get all affected bookings
    const bookings = await db.query(`
      SELECT 
        b.id, b.user_id, b.payment_amount,
        u.name, u.email,
        cs.date, cs.start_time, cs.end_time,
        c.name as course_name,
        v.name as venue_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN course_schedules cs ON b.course_schedule_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      JOIN venues v ON cs.venue_id = v.id
      WHERE b.course_schedule_id = $1
      AND b.status = 'confirmed'
    `, [sessionId]);

    const emailIds = [];

    for (const booking of bookings.rows) {
      const variables = {
        userName: booking.name,
        courseName: booking.course_name,
        sessionDate: booking.date,
        cancellationReason: reason,
        refundAmount: booking.payment_amount
      };

      const result = await db.query(`
        SELECT queue_email(
          $1::varchar,
          'Important: Session Cancelled - ' || $2::varchar,
          '',
          '',
          (SELECT id FROM email_templates WHERE name = 'session_cancellation'),
          $3::jsonb,
          10,
          CURRENT_TIMESTAMP
        )
      `, [booking.email, booking.course_name, JSON.stringify(variables)]);

      emailIds.push(result.rows[0].queue_email);
    }

    return emailIds;
  }

  /**
   * Queue session reminder emails
   */
  async queueReminderEmails(db, sessionId, hoursBeforeSession = 24) {
    const session = await db.query(`
      SELECT 
        cs.id, cs.date, cs.start_time, cs.end_time,
        c.name as course_name,
        v.name as venue_name, v.address_line1, v.city, v.postcode
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      JOIN venues v ON cs.venue_id = v.id
      WHERE cs.id = $1
    `, [sessionId]);

    if (!session.rows[0]) {
      throw new Error('Session not found');
    }

    const sessionData = session.rows[0];
    
    // Get all confirmed bookings with users who have reminder preferences enabled
    const bookings = await db.query(`
      SELECT 
        b.id, u.name, u.email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN notification_preferences np ON u.id = np.user_id
      WHERE b.course_schedule_id = $1
      AND b.status = 'confirmed'
      AND (np.email_reminders IS NULL OR np.email_reminders = true)
    `, [sessionId]);

    const emailIds = [];
    
    // Calculate scheduled time
    const sessionDateTime = new Date(`${sessionData.date} ${sessionData.start_time}`);
    const scheduledFor = new Date(sessionDateTime.getTime() - (hoursBeforeSession * 60 * 60 * 1000));

    for (const booking of bookings.rows) {
      const variables = {
        userName: booking.name,
        courseName: sessionData.course_name,
        sessionDate: sessionData.date,
        sessionTime: `${sessionData.start_time} - ${sessionData.end_time}`,
        venueName: sessionData.venue_name,
        venueAddress: `${sessionData.address_line1}, ${sessionData.city} ${sessionData.postcode}`
      };

      const result = await db.query(`
        SELECT queue_email(
          $1::varchar,
          CASE 
            WHEN $2 = 24 THEN 'Reminder: ' || $3::varchar || ' Tomorrow'
            ELSE 'Reminder: ' || $3::varchar || ' Starting Soon'
          END,
          '',
          '',
          (SELECT id FROM email_templates WHERE name = 'session_reminder_24h'),
          $4::jsonb,
          5,
          $5::timestamp with time zone
        )
      `, [
        booking.email, 
        hoursBeforeSession,
        sessionData.course_name, 
        JSON.stringify(variables),
        scheduledFor
      ]);

      emailIds.push(result.rows[0].queue_email);
    }

    return emailIds;
  }

  /**
   * Send custom email to selected attendees
   */
  async sendCustomEmail(db, sessionId, attendeeIds, subject, message) {
    const attendees = await db.query(`
      SELECT 
        u.email, u.name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.course_schedule_id = $1
      AND b.id = ANY($2::int[])
    `, [sessionId, attendeeIds]);

    const emailIds = [];

    for (const attendee of attendees.rows) {
      const htmlBody = `
        <p>Dear ${attendee.name},</p>
        ${message.replace(/\n/g, '<br>')}
        <p>Best regards,<br>React Fast Training Team</p>
      `;

      const textBody = `
Dear ${attendee.name},

${message}

Best regards,
React Fast Training Team
      `;

      const result = await db.query(`
        INSERT INTO email_queue (
          to_email, to_name, subject, body_html, body_text, priority
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [attendee.email, attendee.name, subject, htmlBody, textBody, 7]);

      emailIds.push(result.rows[0].id);
    }

    // Process emails immediately
    await this.processEmailQueue(db);

    return emailIds;
  }

  /**
   * Send contact form notification email
   */
  async sendContactNotification({ submissionId, name, email, phone, subject, message, type }) {
    try {
      console.log('📧 [EMAIL] Sending contact notification:', { submissionId, name, email, subject });
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0EA5E9;">New Contact Form Submission</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact Details</h3>
            <p><strong>Submission ID:</strong> ${submissionId}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Type:</strong> ${type}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message</h3>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              This message was sent from the React Fast Training contact form.
            </p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@reactfasttraining.co.uk',
        to: process.env.EMAIL_INFO || 'info@reactfasttraining.co.uk',
        subject: `Contact Form: ${subject}`,
        html: htmlBody,
        replyTo: email
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ [EMAIL] Contact notification sent successfully:', result.messageId);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ [EMAIL] Failed to send contact notification:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = EmailService;