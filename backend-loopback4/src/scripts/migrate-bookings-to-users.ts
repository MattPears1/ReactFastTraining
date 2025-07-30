import { db } from '../config/database.config';
import { bookings, users } from '../db/schema';
import { isNull, eq, sql, and } from 'drizzle-orm';
import { userManagementService } from '../services/user-management.service';

interface BookingContactDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
}

/**
 * Migrate existing bookings to link with user profiles
 */
async function migrateBookingsToUsers() {
  console.log('=================================================');
  console.log('Starting booking to user migration...');
  console.log('=================================================');
  
  try {
    // Get count of bookings without userId
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(bookings)
      .where(isNull(bookings.userId));
    
    console.log(`\nFound ${count} bookings without linked users`);
    
    if (count === 0) {
      console.log('All bookings are already linked to users. Migration complete!');
      return;
    }

    // Process in batches to avoid memory issues
    const batchSize = 50;
    let processed = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ booking: string; error: string }> = [];
    
    while (processed < count) {
      console.log(`\nProcessing batch: ${processed + 1} to ${Math.min(processed + batchSize, count)}`);
      
      // Get batch of unmapped bookings from LoopBack's data
      const unmappedBookings = await db.execute(sql`
        SELECT id, booking_reference, contact_details, created_at, total_amount
        FROM bookings 
        WHERE user_id IS NULL 
        LIMIT ${batchSize}
      `);
      
      if (unmappedBookings.rows.length === 0) {
        break;
      }

      for (const booking of unmappedBookings.rows) {
        try {
          // Parse contact details JSON
          const contactDetails = booking.contact_details as BookingContactDetails;
          
          if (!contactDetails?.email) {
            console.warn(`⚠️  Booking ${booking.booking_reference} has no email, skipping`);
            errors.push({
              booking: booking.booking_reference as string,
              error: 'No email in contact details',
            });
            errorCount++;
            continue;
          }
          
          // Extract name
          const firstName = contactDetails.firstName || '';
          const lastName = contactDetails.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Customer';
          
          // Find or create user
          console.log(`Processing ${booking.booking_reference}: ${contactDetails.email}`);
          
          const user = await userManagementService.findOrCreateCustomer({
            email: contactDetails.email,
            name: fullName,
            phone: contactDetails.phone,
            company: contactDetails.company,
          });
          
          // Link booking to user
          await db
            .update(bookings)
            .set({ 
              userId: user.id,
              updatedAt: new Date()
            })
            .where(eq(bookings.id, booking.id as string));
          
          console.log(`✓ Linked booking ${booking.booking_reference} to user ${user.email}`);
          successCount++;
          
        } catch (error) {
          console.error(`✗ Error processing booking ${booking.booking_reference}:`, error);
          errors.push({
            booking: booking.booking_reference as string,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          errorCount++;
        }
      }
      
      processed += unmappedBookings.rows.length;
      console.log(`Progress: ${processed}/${count} bookings processed`);
    }
    
    console.log('\n=================================================');
    console.log('Migration Summary:');
    console.log(`✓ Successfully linked: ${successCount} bookings`);
    console.log(`✗ Errors: ${errorCount} bookings`);
    console.log('=================================================\n');
    
    if (errors.length > 0) {
      console.log('Error details:');
      errors.forEach(({ booking, error }) => {
        console.log(`- ${booking}: ${error}`);
      });
    }

    console.log('\nRecalculating user statistics...');
    await recalculateAllUserStatistics();
    
    console.log('\n✅ Migration completed!');
    
  } catch (error) {
    console.error('\n❌ Migration failed with error:', error);
    throw error;
  }
}

/**
 * Recalculate statistics for all users based on their bookings
 */
async function recalculateAllUserStatistics() {
  console.log('Recalculating statistics for all users...');
  
  try {
    // Get all users with bookings
    const usersWithBookings = await db.execute(sql`
      SELECT 
        b.user_id,
        COUNT(*)::int as total_bookings,
        SUM(b.total_amount) as total_spent,
        MIN(b.created_at) as first_booking,
        MAX(b.created_at) as last_booking
      FROM bookings b
      WHERE b.user_id IS NOT NULL
        AND b.status IN ('confirmed', 'completed', 'attended', 'paid')
      GROUP BY b.user_id
    `);
    
    console.log(`Found ${usersWithBookings.rows.length} users with bookings`);
    
    // Update each user's statistics
    let updated = 0;
    for (const stats of usersWithBookings.rows) {
      try {
        await db
          .update(users)
          .set({
            totalBookings: stats.total_bookings as number,
            totalSpent: stats.total_spent as string || '0',
            customerSince: stats.first_booking as Date,
            firstBookingDate: stats.first_booking as Date,
            lastBookingDate: stats.last_booking as Date,
            lastActivityDate: stats.last_booking as Date,
            updatedAt: new Date(),
          })
          .where(eq(users.id, stats.user_id as string));
        
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`Updated ${updated}/${usersWithBookings.rows.length} users...`);
        }
      } catch (error) {
        console.error(`Failed to update stats for user ${stats.user_id}:`, error);
      }
    }
    
    console.log(`✓ Updated statistics for ${updated} users`);
    
  } catch (error) {
    console.error('Error recalculating user statistics:', error);
    throw error;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('\nVerifying migration results...');
  
  const [unmappedCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(bookings)
    .where(isNull(bookings.userId));
  
  const [mappedCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(bookings)
    .where(sql`user_id IS NOT NULL`);
  
  const [totalUsers] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(eq(users.role, 'customer'));
  
  console.log('\nMigration Statistics:');
  console.log(`- Total bookings with users: ${mappedCount.count}`);
  console.log(`- Bookings without users: ${unmappedCount.count}`);
  console.log(`- Total customer users: ${totalUsers.count}`);
  
  return unmappedCount.count === 0;
}

// Run migration if called directly
if (require.main === module) {
  console.log('React Fast Training - Booking to User Migration');
  console.log('===============================================\n');
  
  migrateBookingsToUsers()
    .then(async () => {
      const isComplete = await verifyMigration();
      if (isComplete) {
        console.log('\n🎉 All bookings successfully linked to users!');
      } else {
        console.log('\n⚠️  Some bookings still need manual review');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateBookingsToUsers, recalculateAllUserStatistics, verifyMigration };