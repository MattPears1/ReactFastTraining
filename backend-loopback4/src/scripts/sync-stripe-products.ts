#!/usr/bin/env node

/**
 * Script to sync existing courses with Stripe products
 * Usage: npm run sync-stripe-products
 */

import { StripeProductSyncService } from '../services/stripe-product-sync.service';
import { db } from '../config/database.config';
import { courses } from '../db/schema/courses';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function syncExistingCourses() {
  console.log('🚀 Starting Stripe product synchronization...\n');

  try {
    // Initialize Stripe service
    StripeProductSyncService.initialize();

    // Get all active courses
    const activeCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true));

    console.log(`Found ${activeCourses.length} active courses to sync\n`);

    // Sync each course
    for (const course of activeCourses) {
      console.log(`📦 Syncing course: ${course.name}`);
      console.log(`   ID: ${course.id}`);
      console.log(`   Type: ${course.courseType}`);
      console.log(`   Price: £${course.price}`);

      try {
        const { productId, priceId } = await StripeProductSyncService.syncCourseToStripe(
          course.id
        );

        console.log(`   ✅ Synced successfully!`);
        console.log(`   Product ID: ${productId}`);
        console.log(`   Price ID: ${priceId}\n`);
      } catch (error) {
        console.error(`   ❌ Failed to sync: ${error.message}\n`);
      }
    }

    // Create sample courses if none exist
    if (activeCourses.length === 0) {
      console.log('No active courses found. Creating sample courses...\n');

      const sampleCourses = [
        {
          name: 'Emergency First Aid at Work',
          courseType: 'EFAW',
          description: 'This one-day course covers essential emergency first aid skills required in the workplace. Ideal for appointed workplace first aiders.',
          duration: '1 day',
          price: '75.00',
          minimumAge: 16,
          certificationBody: 'HSE',
          certificateValidityYears: 3,
          isActive: true,
        },
        {
          name: 'First Aid at Work',
          courseType: 'FAW',
          description: 'Comprehensive 3-day course providing extensive first aid training for workplace first aiders. Covers a wide range of injuries and conditions.',
          duration: '3 days',
          price: '195.00',
          minimumAge: 16,
          certificationBody: 'HSE',
          certificateValidityYears: 3,
          isActive: true,
        },
        {
          name: 'Paediatric First Aid',
          courseType: 'PAEDIATRIC',
          description: '2-day course focusing on first aid for infants and children. Essential for childcare providers and parents.',
          duration: '2 days',
          price: '125.00',
          minimumAge: 16,
          certificationBody: 'Ofqual',
          certificateValidityYears: 3,
          isActive: true,
        },
      ];

      for (const courseData of sampleCourses) {
        console.log(`📝 Creating course: ${courseData.name}`);

        const [newCourse] = await db
          .insert(courses)
          .values(courseData)
          .returning();

        console.log(`   ✅ Course created with ID: ${newCourse.id}`);

        try {
          const { productId, priceId } = await StripeProductSyncService.syncCourseToStripe(
            newCourse.id
          );

          console.log(`   ✅ Synced with Stripe!`);
          console.log(`   Product ID: ${productId}`);
          console.log(`   Price ID: ${priceId}\n`);
        } catch (error) {
          console.error(`   ❌ Failed to sync with Stripe: ${error.message}\n`);
        }
      }
    }

    console.log('✨ Stripe product synchronization completed!\n');

    // Display summary
    const syncedCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true));

    const syncedCount = syncedCourses.filter(c => c.stripeProductId).length;
    const notSyncedCount = syncedCourses.filter(c => !c.stripeProductId).length;

    console.log('📊 Summary:');
    console.log(`   Total courses: ${syncedCourses.length}`);
    console.log(`   Synced with Stripe: ${syncedCount}`);
    console.log(`   Not synced: ${notSyncedCount}`);

    if (notSyncedCount > 0) {
      console.log('\n⚠️  Some courses failed to sync. Please check the logs above.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the sync
syncExistingCourses();