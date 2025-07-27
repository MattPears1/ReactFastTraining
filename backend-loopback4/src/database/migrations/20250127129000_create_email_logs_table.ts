import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('email_logs', (table) => {
    table.increments('id').primary();
    
    // Email details
    table.string('recipient_email', 255).notNullable();
    table.string('email_type', 50).notNullable();
    table.string('subject', 255);
    
    // Related booking
    table.integer('booking_id').unsigned();
    table.foreign('booking_id').references('bookings.id').onDelete('SET NULL');
    
    // Status
    table.enum('status', ['sent', 'failed', 'bounced']).defaultTo('sent');
    table.text('error_message');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('recipient_email');
    table.index('email_type');
    table.index('booking_id');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('email_logs');
}