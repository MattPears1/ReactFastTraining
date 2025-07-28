import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('testimonials', (table) => {
    table.increments('id').primary();
    
    // User information
    table.integer('user_id').unsigned();
    table.foreign('user_id').references('users.id').onDelete('SET NULL');
    
    // Testimonial content
    table.string('author_name', 100).notNullable();
    table.string('author_email', 255).notNullable();
    table.string('author_location', 100); // e.g., "Leeds, Yorkshire"
    table.string('course_taken', 255).notNullable();
    table.date('course_date');
    table.text('content').notNullable();
    table.integer('rating').unsigned().notNullable().checkBetween([1, 5]);
    
    // Photo upload
    table.string('photo_url', 500);
    table.string('photo_consent').defaultTo('not_given'); // 'given', 'not_given'
    
    // Status and moderation
    table.enum('status', ['pending', 'approved', 'rejected', 'featured']).defaultTo('pending');
    table.string('rejection_reason', 500);
    table.datetime('approved_at');
    table.integer('approved_by').unsigned();
    table.foreign('approved_by').references('users.id').onDelete('SET NULL');
    
    // Display options
    table.boolean('show_on_homepage').defaultTo(false);
    table.boolean('show_full_name').defaultTo(true);
    table.integer('display_order').defaultTo(0);
    
    // Verification
    table.boolean('verified_booking').defaultTo(false);
    table.string('booking_reference', 50);
    table.string('verification_token', 100);
    table.datetime('verified_at');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index('status');
    table.index('author_email');
    table.index('show_on_homepage');
    table.index('created_at');
    table.index('display_order');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('testimonials');
}