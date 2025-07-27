import Stripe from 'stripe';
import { db } from '../config/database.config';
import { courses, Course } from '../db/schema/courses';
import { eq, isNull } from 'drizzle-orm';
import { MonitoringService } from './monitoring.service';
import { cache } from './cache-manager.service';

interface StripeProductData {
  name: string;
  description?: string;
  metadata: Record<string, string>;
  active: boolean;
}

interface StripePriceData {
  product: string;
  unit_amount: number;
  currency: string;
  metadata: Record<string, string>;
  active: boolean;
}

export class StripeProductSyncService {
  private static stripe: Stripe;
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    this.initialized = true;
    MonitoringService.info('Stripe Product Sync Service initialized');
  }

  /**
   * Create or update a Stripe product for a course
   */
  static async syncCourseToStripe(courseId: string): Promise<{
    productId: string;
    priceId: string;
  }> {
    this.initialize();

    try {
      // Get course details
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!course) {
        throw new Error(`Course not found: ${courseId}`);
      }

      // Check if product already exists
      let productId = await this.getCourseStripeProductId(courseId);
      let product: Stripe.Product;

      const productData: StripeProductData = {
        name: course.name,
        description: course.description || undefined,
        metadata: {
          courseId: course.id,
          courseType: course.courseType,
          duration: course.duration,
          certificationBody: course.certificationBody || '',
          certificateValidityYears: course.certificateValidityYears?.toString() || '3',
        },
        active: course.isActive,
      };

      if (productId) {
        // Update existing product
        product = await this.stripe.products.update(productId, productData);
        MonitoringService.info('Updated Stripe product', {
          productId,
          courseName: course.name,
        });
      } else {
        // Create new product
        product = await this.stripe.products.create(productData);
        productId = product.id;
        
        // Store product ID in database
        await this.storeCourseStripeProductId(courseId, productId);
        
        MonitoringService.info('Created Stripe product', {
          productId,
          courseName: course.name,
        });
      }

      // Create or update price
      const priceId = await this.syncCoursePrice(product.id, course);

      // Clear cache
      await cache.delete(cache.generateKey('stripe:product', courseId));

      return { productId, priceId };
    } catch (error) {
      MonitoringService.error('Failed to sync course to Stripe', error, { courseId });
      throw error;
    }
  }

  /**
   * Create or update Stripe price for a course
   */
  private static async syncCoursePrice(
    productId: string,
    course: Course
  ): Promise<string> {
    try {
      // Convert price to pence
      const unitAmount = Math.round(parseFloat(course.price) * 100);

      // Check for existing active price
      const existingPrices = await this.stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      });

      // Find price with matching amount
      const existingPrice = existingPrices.data.find(
        price => price.unit_amount === unitAmount && price.currency === 'gbp'
      );

      if (existingPrice) {
        return existingPrice.id;
      }

      // Deactivate old prices
      for (const oldPrice of existingPrices.data) {
        await this.stripe.prices.update(oldPrice.id, { active: false });
      }

      // Create new price
      const priceData: StripePriceData = {
        product: productId,
        unit_amount: unitAmount,
        currency: 'gbp',
        metadata: {
          courseId: course.id,
          courseName: course.name,
        },
        active: true,
      };

      const price = await this.stripe.prices.create(priceData);

      MonitoringService.info('Created Stripe price', {
        priceId: price.id,
        amount: unitAmount,
        courseName: course.name,
      });

      return price.id;
    } catch (error) {
      MonitoringService.error('Failed to sync course price', error, {
        productId,
        courseId: course.id,
      });
      throw error;
    }
  }

  /**
   * Sync all courses to Stripe
   */
  static async syncAllCourses(): Promise<void> {
    this.initialize();

    try {
      const allCourses = await db
        .select()
        .from(courses)
        .where(eq(courses.isActive, true));

      MonitoringService.info(`Syncing ${allCourses.length} courses to Stripe`);

      const results = await Promise.allSettled(
        allCourses.map(course => this.syncCourseToStripe(course.id))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      MonitoringService.info('Course sync completed', {
        total: allCourses.length,
        successful,
        failed,
      });

      if (failed > 0) {
        const failures = results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map(r => r.reason);
        
        MonitoringService.error('Some courses failed to sync', null, { failures });
      }
    } catch (error) {
      MonitoringService.error('Failed to sync all courses', error);
      throw error;
    }
  }

  /**
   * Get Stripe product ID for a course (from cache or database)
   */
  private static async getCourseStripeProductId(courseId: string): Promise<string | null> {
    // Check cache first
    const cacheKey = cache.generateKey('stripe:product', courseId);
    const cached = await cache.get<string>(cacheKey);
    if (cached) return cached;

    // Check database first
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));
    
    if (course?.stripeProductId) {
      await cache.set(cacheKey, course.stripeProductId, { ttl: 3600 });
      return course.stripeProductId;
    }

    // Fallback: search Stripe by metadata
    try {
      const products = await this.stripe.products.search({
        query: `metadata['courseId']:'${courseId}'`,
        limit: 1,
      });

      if (products.data.length > 0) {
        const productId = products.data[0].id;
        
        // Update database with found product ID
        await db
          .update(courses)
          .set({ stripeProductId: productId })
          .where(eq(courses.id, courseId));
        
        await cache.set(cacheKey, productId, { ttl: 3600 });
        return productId;
      }
    } catch (error) {
      MonitoringService.error('Failed to search Stripe products', error);
    }

    return null;
  }

  /**
   * Store Stripe product ID for a course
   */
  private static async storeCourseStripeProductId(
    courseId: string,
    productId: string
  ): Promise<void> {
    // Store in database
    await db
      .update(courses)
      .set({ 
        stripeProductId: productId,
        stripeProductSyncedAt: new Date()
      })
      .where(eq(courses.id, courseId));

    // Store in cache
    const cacheKey = cache.generateKey('stripe:product', courseId);
    await cache.set(cacheKey, productId, { ttl: 3600 });
  }

  /**
   * Get Stripe price for a course
   */
  static async getCourseStripePrice(courseId: string): Promise<{
    priceId: string;
    amount: number;
    currency: string;
  } | null> {
    this.initialize();

    try {
      const productId = await this.getCourseStripeProductId(courseId);
      if (!productId) {
        // Product doesn't exist, create it
        const { priceId } = await this.syncCourseToStripe(courseId);
        const price = await this.stripe.prices.retrieve(priceId);
        
        return {
          priceId: price.id,
          amount: price.unit_amount || 0,
          currency: price.currency,
        };
      }

      // Get active prices for the product
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
        limit: 1,
      });

      if (prices.data.length === 0) {
        // No active price, sync the course
        const { priceId } = await this.syncCourseToStripe(courseId);
        const price = await this.stripe.prices.retrieve(priceId);
        
        return {
          priceId: price.id,
          amount: price.unit_amount || 0,
          currency: price.currency,
        };
      }

      const price = prices.data[0];
      return {
        priceId: price.id,
        amount: price.unit_amount || 0,
        currency: price.currency,
      };
    } catch (error) {
      MonitoringService.error('Failed to get course Stripe price', error, { courseId });
      return null;
    }
  }

  /**
   * Deactivate Stripe product when course is deactivated
   */
  static async deactivateCourseProduct(courseId: string): Promise<void> {
    this.initialize();

    try {
      const productId = await this.getCourseStripeProductId(courseId);
      if (!productId) {
        MonitoringService.warn('No Stripe product found for course', { courseId });
        return;
      }

      // Deactivate product
      await this.stripe.products.update(productId, { active: false });

      // Deactivate all prices
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      });

      await Promise.all(
        prices.data.map(price =>
          this.stripe.prices.update(price.id, { active: false })
        )
      );

      // Clear cache
      await cache.delete(cache.generateKey('stripe:product', courseId));

      MonitoringService.info('Deactivated Stripe product', { productId, courseId });
    } catch (error) {
      MonitoringService.error('Failed to deactivate course product', error, { courseId });
      throw error;
    }
  }

  /**
   * Create checkout session with course product
   */
  static async createCourseCheckoutSession(
    courseId: string,
    customerEmail: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Checkout.Session> {
    this.initialize();

    try {
      const priceInfo = await this.getCourseStripePrice(courseId);
      if (!priceInfo) {
        throw new Error('No Stripe price found for course');
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceInfo.priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: {
          courseId,
          ...metadata,
        },
      });

      MonitoringService.info('Created checkout session', {
        sessionId: session.id,
        courseId,
        amount: priceInfo.amount,
      });

      return session;
    } catch (error) {
      MonitoringService.error('Failed to create checkout session', error, { courseId });
      throw error;
    }
  }
}