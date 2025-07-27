import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('refunds', (table) => {
    table.increments('id').primary();
    
    // Foreign keys
    table.integer('booking_id').unsigned().notNullable();
    table.foreign('booking_id').references('bookings.id').onDelete('RESTRICT');
    
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('RESTRICT');
    
    table.integer('processed_by_id').unsigned();
    table.foreign('processed_by_id').references('users.id').onDelete('SET NULL');
    
    // Refund details
    table.string('refund_reference', 50).unique().notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.enum('status', ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.enum('reason', ['course_cancelled', 'customer_cancelled', 'duplicate_booking', 'medical', 'other']).notNullable();
    table.text('reason_details');
    
    // Payment details
    table.string('stripe_refund_id', 255);
    table.decimal('processing_fee', 10, 2).defaultTo(0);
    table.decimal('net_refund', 10, 2);
    
    // Processing info
    table.timestamp('requested_at').defaultTo(knex.fn.now());
    table.timestamp('approved_at');
    table.timestamp('processed_at');
    table.timestamp('completed_at');
    table.text('admin_notes');
    table.text('rejection_reason');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('refund_reference');
    table.index('booking_id');
    table.index('user_id');
    table.index('status');
    table.index('requested_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('refunds');
}