import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import {
  post,
  put,
  del,
  get,
  patch,
  param,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import { db } from '../config/database.config';
import { courses, Course, NewCourse } from '../db/schema/courses';
import { eq } from 'drizzle-orm';
import { StripeProductSyncService } from '../services/stripe-product-sync.service';
import { MonitoringService } from '../services/monitoring.service';
import { z } from 'zod';

// Validation schemas
const CreateCourseSchema = z.object({
  name: z.string().min(1).max(255),
  courseType: z.string().min(1).max(100),
  description: z.string().optional(),
  duration: z.string().min(1).max(50),
  price: z.string().regex(/^\d+\.?\d{0,2}$/, 'Invalid price format'),
  minimumAge: z.number().int().min(0).optional(),
  certificationBody: z.string().optional(),
  certificateValidityYears: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

const UpdateCourseSchema = CreateCourseSchema.partial();

@authenticate('jwt')
@authorize({ allowedRoles: ['admin'] })
export class CourseAdminController {
  constructor() {}

  @post('/api/admin/courses')
  @response(200, {
    description: 'Create a new course and sync with Stripe',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            course: { type: 'object' },
            stripeSync: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                priceId: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async createCourse(
    @requestBody({
      content: {
        'application/json': {
          schema: { type: 'object' },
        },
      },
    })
    body: any
  ): Promise<any> {
    try {
      // Validate input
      const courseData = CreateCourseSchema.parse(body);

      // Create course in database
      const [newCourse] = await db
        .insert(courses)
        .values(courseData as NewCourse)
        .returning();

      MonitoringService.info('Course created', {}, {
        courseId: newCourse.id,
        name: newCourse.name,
      });

      // Sync with Stripe
      let stripeSync = null;
      try {
        const { productId, priceId } = await StripeProductSyncService.syncCourseToStripe(
          newCourse.id
        );

        // Update course with Stripe IDs
        await db
          .update(courses)
          .set({
            stripeProductId: productId,
            stripePriceId: priceId,
            stripeProductSyncedAt: new Date(),
          })
          .where(eq(courses.id, newCourse.id));

        stripeSync = { productId, priceId };

        MonitoringService.info('Course synced with Stripe', {
          courseId: newCourse.id,
          productId,
          priceId,
        });
      } catch (error) {
        MonitoringService.error('Failed to sync course with Stripe', error, {
          courseId: newCourse.id,
        });
        // Don't fail the entire request if Stripe sync fails
      }

      return {
        course: newCourse,
        stripeSync,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpErrors.BadRequest(`Validation error: ${error.message}`);
      }
      throw error;
    }
  }

  @put('/api/admin/courses/{id}')
  @response(200, {
    description: 'Update course and sync with Stripe',
  })
  async updateCourse(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: { type: 'object' },
        },
      },
    })
    body: any
  ): Promise<any> {
    try {
      // Validate input
      const updateData = UpdateCourseSchema.parse(body);

      // Update course
      const [updatedCourse] = await db
        .update(courses)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, id))
        .returning();

      if (!updatedCourse) {
        throw new HttpErrors.NotFound('Course not found');
      }

      // Sync with Stripe if price or details changed
      let stripeSync = null;
      if (
        updateData.name ||
        updateData.description ||
        updateData.price ||
        updateData.isActive !== undefined
      ) {
        try {
          const { productId, priceId } = await StripeProductSyncService.syncCourseToStripe(id);

          // Update Stripe IDs if they changed
          if (productId !== updatedCourse.stripeProductId || priceId !== updatedCourse.stripePriceId) {
            await db
              .update(courses)
              .set({
                stripeProductId: productId,
                stripePriceId: priceId,
                stripeProductSyncedAt: new Date(),
              })
              .where(eq(courses.id, id));
          }

          stripeSync = { productId, priceId };
        } catch (error) {
          MonitoringService.error('Failed to sync course update with Stripe', error, {
            courseId: id,
          });
        }
      }

      return {
        course: updatedCourse,
        stripeSync,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpErrors.BadRequest(`Validation error: ${error.message}`);
      }
      throw error;
    }
  }

  @del('/api/admin/courses/{id}')
  @response(204, {
    description: 'Deactivate course',
  })
  async deactivateCourse(@param.path.string('id') id: string): Promise<void> {
    try {
      // Deactivate course (soft delete)
      const [deactivatedCourse] = await db
        .update(courses)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, id))
        .returning();

      if (!deactivatedCourse) {
        throw new HttpErrors.NotFound('Course not found');
      }

      // Deactivate in Stripe
      try {
        await StripeProductSyncService.deactivateCourseProduct(id);
      } catch (error) {
        MonitoringService.error('Failed to deactivate course in Stripe', error, {
          courseId: id,
        });
      }

      MonitoringService.info('Course deactivated', {
        courseId: id,
        name: deactivatedCourse.name,
      });
    } catch (error) {
      throw error;
    }
  }

  @post('/api/admin/courses/sync-all')
  @response(200, {
    description: 'Sync all courses with Stripe',
  })
  async syncAllCourses(): Promise<{
    message: string;
    syncedAt: Date;
  }> {
    try {
      await StripeProductSyncService.syncAllCourses();

      // Update sync timestamps
      await db
        .update(courses)
        .set({
          stripeProductSyncedAt: new Date(),
        })
        .where(eq(courses.isActive, true));

      return {
        message: 'All courses synced with Stripe',
        syncedAt: new Date(),
      };
    } catch (error) {
      MonitoringService.error('Failed to sync all courses', error);
      throw new HttpErrors.InternalServerError('Failed to sync courses with Stripe');
    }
  }

  @get('/api/admin/courses/{id}/stripe-info')
  @response(200, {
    description: 'Get Stripe information for a course',
  })
  async getCourseStripeInfo(
    @param.path.string('id') id: string
  ): Promise<{
    course: Course;
    stripeProduct?: any;
    stripePrice?: any;
  }> {
    try {
      // Get course
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, id));

      if (!course) {
        throw new HttpErrors.NotFound('Course not found');
      }

      const result: any = { course };

      // Get Stripe info if available
      if (course.stripeProductId) {
        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          
          const product = await stripe.products.retrieve(course.stripeProductId);
          result.stripeProduct = product;

          if (course.stripePriceId) {
            const price = await stripe.prices.retrieve(course.stripePriceId);
            result.stripePrice = price;
          }
        } catch (error) {
          MonitoringService.error('Failed to retrieve Stripe data', error, {
            courseId: id,
            productId: course.stripeProductId,
          });
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  @patch('/api/admin/courses/{id}/price')
  @response(200, {
    description: 'Update course price and create new Stripe price',
  })
  async updateCoursePrice(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              price: { type: 'string' },
            },
            required: ['price'],
          },
        },
      },
    })
    body: { price: string }
  ): Promise<{
    course: Course;
    newPriceId: string;
  }> {
    try {
      // Validate price format
      if (!/^\d+\.?\d{0,2}$/.test(body.price)) {
        throw new HttpErrors.BadRequest('Invalid price format');
      }

      // Update course price
      const [updatedCourse] = await db
        .update(courses)
        .set({
          price: body.price,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, id))
        .returning();

      if (!updatedCourse) {
        throw new HttpErrors.NotFound('Course not found');
      }

      // Sync with Stripe to create new price
      const { priceId } = await StripeProductSyncService.syncCourseToStripe(id);

      // Update price ID
      await db
        .update(courses)
        .set({
          stripePriceId: priceId,
          stripeProductSyncedAt: new Date(),
        })
        .where(eq(courses.id, id));

      MonitoringService.info('Course price updated', {
        courseId: id,
        oldPrice: updatedCourse.price,
        newPrice: body.price,
        stripePriceId: priceId,
      });

      return {
        course: { ...updatedCourse, price: body.price },
        newPriceId: priceId,
      };
    } catch (error) {
      throw error;
    }
  }
}