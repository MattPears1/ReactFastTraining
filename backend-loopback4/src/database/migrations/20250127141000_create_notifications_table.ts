import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    
    // Foreign key
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    
    // Notification details
    table.enum('type', [
      'booking_confirmed',
      'booking_reminder',
      'course_cancelled',
      'certificate_ready',
      'payment_received',
      'refund_processed',
      'course_updated',
      'system_announcement',
      'certificate_expiring'
    ]).notNullable();
    
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    
    // Delivery channels
    table.boolean('send_email').defaultTo(true);
    table.boolean('send_sms').defaultTo(false);
    table.boolean('show_in_app').defaultTo(true);
    
    // Status tracking
    table.enum('status', ['pending', 'sent', 'delivered', 'failed', 'read']).defaultTo('pending');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('read_at');
    table.integer('retry_count').defaultTo(0);
    table.text('error_message');
    
    // Related entities
    table.integer('booking_id').unsigned();
    table.foreign('booking_id').references('bookings.id').onDelete('SET NULL');
    
    table.integer('course_id').unsigned();
    table.foreign('course_id').references('courses.id').onDelete('SET NULL');
    
    // Metadata
    table.text('metadata'); // JSON for additional data
    table.string('action_url', 500);
    table.timestamp('expires_at');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('type');
    table.index('status');
    table.index('priority');
    table.index('created_at');
    table.index(['user_id', 'read_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('notifications');
}