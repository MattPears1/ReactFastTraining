import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create course analytics table
  await knex.schema.createTable('course_analytics', (table) => {
    table.increments('id').primary();
    table.integer('course_id').references('id').inTable('courses');
    table.date('date').notNullable();
    table.integer('day_of_week').notNullable(); // 0=Sunday, 6=Saturday
    table.integer('month').notNullable();
    table.integer('year').notNullable();
    
    // Metrics
    table.integer('sessions_scheduled').defaultTo(0);
    table.integer('total_bookings').defaultTo(0);
    table.integer('completed_bookings').defaultTo(0);
    table.integer('cancelled_bookings').defaultTo(0);
    table.integer('no_show_bookings').defaultTo(0);
    
    // Financial
    table.decimal('revenue_generated', 10, 2).defaultTo(0);
    table.decimal('refunds_processed', 10, 2).defaultTo(0);
    table.decimal('net_revenue', 10, 2).defaultTo(0);
    
    // Capacity
    table.integer('total_capacity').defaultTo(0);
    table.integer('seats_filled').defaultTo(0);
    table.decimal('fill_rate', 5, 2).defaultTo(0); // percentage
    
    table.timestamps(true, true);
    
    // Indexes
    table.index(['course_id', 'date']);
    table.index('day_of_week');
    table.index(['month', 'year']);
  });

  // Create visitor analytics table (GDPR compliant)
  await knex.schema.createTable('visitor_analytics', (table) => {
    table.increments('id').primary();
    table.uuid('session_id').notNullable();
    table.date('date').notNullable();
    table.integer('hour').notNullable(); // 0-23
    
    // Journey stages
    table.boolean('visited_homepage').defaultTo(false);
    table.boolean('visited_courses_page').defaultTo(false);
    table.boolean('visited_booking_page').defaultTo(false);
    table.boolean('started_booking').defaultTo(false);
    table.boolean('completed_booking').defaultTo(false);
    table.boolean('cancelled_booking').defaultTo(false);
    
    // Additional metrics
    table.integer('pages_viewed').defaultTo(0);
    table.integer('time_on_site_seconds').defaultTo(0);
    table.string('device_type', 20); // mobile, tablet, desktop
    table.string('referrer_source', 100); // google, direct, facebook, etc
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['date', 'hour']);
    table.index('session_id');
  });

  // Create error logs table
  await knex.schema.createTable('error_logs', (table) => {
    table.increments('id').primary();
    table.string('error_level', 20).notNullable(); // ERROR, WARNING, INFO
    table.string('error_type', 100).notNullable();
    table.text('error_message').notNullable();
    table.text('error_stack');
    
    // Context
    table.string('user_email', 255);
    table.string('ip_address', 45);
    table.text('user_agent');
    table.text('request_url');
    table.string('request_method', 10);
    
    // Categorization
    table.string('category', 50); // booking, payment, auth, system
    table.boolean('resolved').defaultTo(false);
    table.timestamp('resolved_at');
    table.string('resolved_by', 255);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('error_level');
    table.index('created_at');
    table.index('category');
  });

  // Create course popularity by time view
  await knex.raw(`
    CREATE VIEW course_popularity_by_time AS
    SELECT 
      c.name as course_name,
      c.category,
      ca.day_of_week,
      CASE ca.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END as day_name,
      COUNT(*) as session_count,
      SUM(ca.total_bookings) as total_bookings,
      AVG(ca.fill_rate) as avg_fill_rate,
      SUM(ca.net_revenue) as total_revenue
    FROM course_analytics ca
    JOIN courses c ON ca.course_id = c.id
    WHERE ca.date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY c.name, c.category, ca.day_of_week
    ORDER BY total_bookings DESC
  `);

  // Create monthly trends view
  await knex.raw(`
    CREATE VIEW course_monthly_trends AS
    SELECT 
      c.name as course_name,
      ca.month,
      ca.year,
      TO_CHAR(TO_DATE(ca.month::text, 'MM'), 'Month') as month_name,
      COUNT(DISTINCT ca.date) as days_with_sessions,
      SUM(ca.total_bookings) as total_bookings,
      SUM(ca.net_revenue) as total_revenue,
      AVG(ca.fill_rate) as avg_fill_rate
    FROM course_analytics ca
    JOIN courses c ON ca.course_id = c.id
    GROUP BY c.name, ca.month, ca.year
    ORDER BY ca.year DESC, ca.month DESC
  `);

  // Create booking funnel view
  await knex.raw(`
    CREATE VIEW booking_funnel AS
    SELECT 
      date,
      COUNT(DISTINCT session_id) as total_visitors,
      COUNT(DISTINCT CASE WHEN visited_homepage THEN session_id END) as homepage_visitors,
      COUNT(DISTINCT CASE WHEN visited_courses_page THEN session_id END) as courses_page_visitors,
      COUNT(DISTINCT CASE WHEN visited_booking_page THEN session_id END) as booking_page_visitors,
      COUNT(DISTINCT CASE WHEN started_booking THEN session_id END) as started_bookings,
      COUNT(DISTINCT CASE WHEN completed_booking THEN session_id END) as completed_bookings,
      COUNT(DISTINCT CASE WHEN cancelled_booking THEN session_id END) as cancelled_bookings,
      
      -- Conversion rates
      ROUND(100.0 * COUNT(DISTINCT CASE WHEN visited_booking_page THEN session_id END) / 
        NULLIF(COUNT(DISTINCT session_id), 0), 2) as visitor_to_booking_page_rate,
      ROUND(100.0 * COUNT(DISTINCT CASE WHEN completed_booking THEN session_id END) / 
        NULLIF(COUNT(DISTINCT CASE WHEN visited_booking_page THEN session_id END), 0), 2) as booking_page_conversion_rate,
      ROUND(100.0 * COUNT(DISTINCT CASE WHEN completed_booking THEN session_id END) / 
        NULLIF(COUNT(DISTINCT session_id), 0), 2) as overall_conversion_rate
    FROM visitor_analytics
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY date
    ORDER BY date DESC
  `);

  // Create error summary view
  await knex.raw(`
    CREATE VIEW error_summary AS
    SELECT 
      DATE(created_at) as date,
      error_level,
      category,
      COUNT(*) as error_count,
      COUNT(DISTINCT user_email) as affected_users
    FROM error_logs
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at), error_level, category
    ORDER BY date DESC, error_count DESC
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop views first
  await knex.raw('DROP VIEW IF EXISTS error_summary');
  await knex.raw('DROP VIEW IF EXISTS booking_funnel');
  await knex.raw('DROP VIEW IF EXISTS course_monthly_trends');
  await knex.raw('DROP VIEW IF EXISTS course_popularity_by_time');
  
  // Drop tables
  await knex.schema.dropTableIfExists('error_logs');
  await knex.schema.dropTableIfExists('visitor_analytics');
  await knex.schema.dropTableIfExists('course_analytics');
}