const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class RefundService {
  /**
   * Process a refund for a booking
   */
  async processRefund(db, bookingId, reason, initiatedBy) {
    try {
      // Get booking details
      const booking = await db.query(`
        SELECT 
          b.id, b.user_id, b.payment_amount, b.stripe_payment_intent_id,
          u.email, u.name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = $1
      `, [bookingId]);

      if (!booking.rows[0]) {
        throw new Error('Booking not found');
      }

      const bookingData = booking.rows[0];

      // Create refund log entry
      const refundLog = await db.query(`
        INSERT INTO refund_logs (
          booking_id, user_id, stripe_payment_intent_id,
          amount, reason, initiated_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'processing')
        RETURNING id
      `, [
        bookingId,
        bookingData.user_id,
        bookingData.stripe_payment_intent_id,
        bookingData.payment_amount,
        reason,
        initiatedBy
      ]);

      const refundLogId = refundLog.rows[0].id;

      try {
        // Process refund with Stripe
        let refund;
        
        if (bookingData.stripe_payment_intent_id) {
          refund = await stripe.refunds.create({
            payment_intent: bookingData.stripe_payment_intent_id,
            reason: 'requested_by_customer',
            metadata: {
              booking_id: bookingId,
              refund_reason: reason,
              initiated_by: initiatedBy
            }
          });
        } else {
          // If no payment intent ID, we'll need to handle this differently
          throw new Error('No payment intent ID found for booking');
        }

        // Update refund log with success
        await db.query(`
          UPDATE refund_logs 
          SET 
            stripe_refund_id = $1,
            status = 'completed',
            processed_at = CURRENT_TIMESTAMP,
            metadata = $2
          WHERE id = $3
        `, [refund.id, JSON.stringify(refund), refundLogId]);

        // Update booking status
        await db.query(`
          UPDATE bookings 
          SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [bookingId]);

        // Log activity
        await db.query(`
          INSERT INTO activity_logs (
            entity_type, entity_id, action, details, user_id
          ) VALUES (
            'booking', $1, 'refunded', $2, $3
          )
        `, [
          bookingId,
          JSON.stringify({ 
            amount: bookingData.payment_amount, 
            reason: reason,
            stripe_refund_id: refund.id
          }),
          initiatedBy
        ]);

        return {
          success: true,
          refundId: refund.id,
          amount: bookingData.payment_amount,
          status: 'completed'
        };

      } catch (stripeError) {
        // Update refund log with error
        await db.query(`
          UPDATE refund_logs 
          SET 
            status = 'failed',
            error_message = $1,
            processed_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [stripeError.message, refundLogId]);

        throw stripeError;
      }

    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }

  /**
   * Process refunds for all bookings in a cancelled session
   */
  async processSessionRefunds(db, sessionId, reason, initiatedBy) {
    // Get all confirmed bookings for the session
    const bookings = await db.query(`
      SELECT id, user_id, payment_amount
      FROM bookings
      WHERE course_schedule_id = $1
      AND status = 'confirmed'
      AND payment_status = 'completed'
    `, [sessionId]);

    const results = {
      total: bookings.rows.length,
      successful: 0,
      failed: 0,
      totalRefunded: 0,
      errors: []
    };

    for (const booking of bookings.rows) {
      try {
        const refundResult = await this.processRefund(
          db, 
          booking.id, 
          reason, 
          initiatedBy
        );
        
        results.successful++;
        results.totalRefunded += parseFloat(booking.payment_amount);
      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: booking.id,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get refund status for a booking
   */
  async getRefundStatus(db, bookingId) {
    const refund = await db.query(`
      SELECT 
        id, amount, reason, status, 
        stripe_refund_id, processed_at, 
        error_message, created_at
      FROM refund_logs
      WHERE booking_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [bookingId]);

    if (!refund.rows[0]) {
      return null;
    }

    const refundData = refund.rows[0];

    // If we have a Stripe refund ID, check its status
    if (refundData.stripe_refund_id && refundData.status === 'processing') {
      try {
        const stripeRefund = await stripe.refunds.retrieve(refundData.stripe_refund_id);
        
        // Update our records if status changed
        if (stripeRefund.status !== 'processing') {
          await db.query(`
            UPDATE refund_logs
            SET 
              status = $1,
              processed_at = CURRENT_TIMESTAMP,
              metadata = $2
            WHERE id = $3
          `, [
            stripeRefund.status === 'succeeded' ? 'completed' : stripeRefund.status,
            JSON.stringify(stripeRefund),
            refundData.id
          ]);

          refundData.status = stripeRefund.status === 'succeeded' ? 'completed' : stripeRefund.status;
        }
      } catch (error) {
        console.error('Error checking Stripe refund status:', error);
      }
    }

    return refundData;
  }

  /**
   * Get refund statistics
   */
  async getRefundStatistics(db, startDate, endDate) {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_refunds,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_refunds,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_refunds,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_refunds
      FROM refund_logs
      WHERE created_at BETWEEN $1 AND $2
    `, [startDate, endDate]);

    return stats.rows[0];
  }

  /**
   * Retry a failed refund
   */
  async retryRefund(db, refundLogId, initiatedBy) {
    const refundLog = await db.query(`
      SELECT booking_id, amount, reason
      FROM refund_logs
      WHERE id = $1 AND status = 'failed'
    `, [refundLogId]);

    if (!refundLog.rows[0]) {
      throw new Error('Failed refund not found');
    }

    return await this.processRefund(
      db,
      refundLog.rows[0].booking_id,
      refundLog.rows[0].reason + ' (Retry)',
      initiatedBy
    );
  }
}

module.exports = RefundService;