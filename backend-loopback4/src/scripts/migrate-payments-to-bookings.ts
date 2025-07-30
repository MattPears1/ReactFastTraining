#!/usr/bin/env node

/**
 * Migration script to link existing payment transactions to bookings
 * and populate the new payments table
 */

import dotenv from 'dotenv';
import { db } from '../db';
import { 
  payments, 
  paymentTransactions, 
  bookings,
  paymentEvents 
} from '../db/schema';
import { eq, sql, isNull } from 'drizzle-orm';

dotenv.config();

async function migratePaymentsToBookings() {
  console.log('Starting payment migration...');
  
  let migratedCount = 0;
  let failedCount = 0;
  let existingCount = 0;

  try {
    // Get all payment transactions
    const allTransactions = await db
      .select({
        transaction: paymentTransactions,
        booking: bookings,
      })
      .from(paymentTransactions)
      .leftJoin(bookings, eq(paymentTransactions.bookingId, bookings.id));

    console.log(`Found ${allTransactions.length} payment transactions to process`);

    for (const { transaction, booking } of allTransactions) {
      try {
        // Check if payment already exists for this transaction
        const existingPayment = await db
          .select()
          .from(payments)
          .where(eq(payments.paymentTransactionId, transaction.id))
          .limit(1);

        if (existingPayment.length > 0) {
          existingCount++;
          continue;
        }

        // Generate payment reference
        const paymentReference = await generatePaymentReference();

        // Create payment record
        const [payment] = await db.insert(payments).values({
          paymentTransactionId: transaction.id,
          bookingId: transaction.bookingId,
          userId: booking?.userId,
          paymentReference,
          stripePaymentIntentId: transaction.stripePaymentIntentId,
          stripeChargeId: transaction.stripeChargeId,
          amount: transaction.amount,
          currency: transaction.currency || 'GBP',
          paymentMethod: transaction.paymentMethod,
          status: transaction.status,
          failureReason: transaction.failureReason,
          paymentDate: transaction.createdAt,
          description: `Migrated from payment transaction ${transaction.id}`,
          createdAt: transaction.createdAt,
        }).returning();

        // Update booking with payment information if not already set
        if (booking && !booking.stripePaymentIntentId && transaction.stripePaymentIntentId) {
          await db
            .update(bookings)
            .set({
              stripePaymentIntentId: transaction.stripePaymentIntentId,
              paymentStatus: mapPaymentStatus(transaction.status),
              paymentAmount: parseFloat(transaction.amount),
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, booking.id));
        }

        // Log migration event
        await db.insert(paymentEvents).values({
          paymentId: payment.id,
          paymentTransactionId: transaction.id,
          eventType: 'payment.migrated',
          eventSource: 'migration_script',
          eventData: {
            transactionId: transaction.id,
            bookingId: transaction.bookingId,
            amount: transaction.amount,
            status: transaction.status,
          },
        });

        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`Progress: ${migratedCount} migrated, ${failedCount} failed`);
        }
      } catch (error) {
        console.error(`Failed to migrate transaction ${transaction.id}:`, error);
        failedCount++;
      }
    }

    // Migrate bookings that have Stripe payment intent but no payment record
    console.log('\nMigrating bookings with Stripe payment intents...');
    
    const bookingsWithStripeIntent = await db
      .select()
      .from(bookings)
      .where(sql`stripe_payment_intent_id IS NOT NULL 
        AND NOT EXISTS (
          SELECT 1 FROM payments p 
          WHERE p.booking_id = bookings.id
        )`);

    console.log(`Found ${bookingsWithStripeIntent.length} bookings with Stripe intents to migrate`);

    for (const booking of bookingsWithStripeIntent) {
      try {
        const paymentReference = await generatePaymentReference();

        await db.insert(payments).values({
          bookingId: booking.id,
          userId: booking.userId,
          paymentReference,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          amount: booking.paymentAmount?.toString() || booking.totalAmount.toString(),
          currency: 'GBP',
          paymentMethod: 'card',
          status: mapBookingStatusToPaymentStatus(booking.status),
          paymentDate: booking.createdAt,
          description: `Migrated from booking ${booking.bookingReference}`,
          createdAt: booking.createdAt,
        });

        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate booking ${booking.id}:`, error);
        failedCount++;
      }
    }

    console.log('\nMigration completed!');
    console.log(`Total transactions processed: ${allTransactions.length}`);
    console.log(`Already migrated: ${existingCount}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Failed: ${failedCount}`);

    // Generate summary report
    const paymentStats = await db
      .select({
        totalPayments: sql`COUNT(*)`,
        totalTransactions: sql`COUNT(DISTINCT payment_transaction_id)`,
        totalBookings: sql`COUNT(DISTINCT booking_id)`,
        successfulPayments: sql`COUNT(CASE WHEN status = 'succeeded' THEN 1 END)`,
        failedPayments: sql`COUNT(CASE WHEN status = 'failed' THEN 1 END)`,
        pendingPayments: sql`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
      })
      .from(payments);

    console.log('\nPayment table statistics:');
    console.log(paymentStats[0]);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function generatePaymentReference(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${dateStr}-${random}`;
}

function mapPaymentStatus(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'pending':
      return 'pending';
    case 'refunded':
      return 'refunded';
    default:
      return 'pending';
  }
}

function mapBookingStatusToPaymentStatus(bookingStatus: string): string {
  switch (bookingStatus) {
    case 'confirmed':
    case 'completed':
      return 'succeeded';
    case 'cancelled':
    case 'refunded':
      return 'refunded';
    case 'payment_failed':
      return 'failed';
    default:
      return 'pending';
  }
}

// Run the migration
migratePaymentsToBookings()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });