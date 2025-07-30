import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    
    // Foreign keys
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('RESTRICT');
    
    table.integer('course_schedule_id').unsigned().notNullable();
    table.foreign('course_schedule_id').references('course_schedules.id').onDelete('RESTRICT');
    
    table.integer('discount_code_id').unsigned();
    table.foreign('discount_code_id').references('discount_codes.id').onDelete('SET NULL');
    
    // Booking details
    table.string('booking_reference', 20).unique().notNullable();
    table.enum('status', ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).defaultTo('pending');
    table.enum('payment_status', ['pending', 'paid', 'refunded', 'failed']).defaultTo('pending');
    table.decimal('payment_amount', 10, 2).notNullable();
    table.decimal('discount_applied', 10, 2).defaultTo(0);
    
    // Additional info
    table.text('notes');
    table.boolean('confirmation_sent').defaultTo(false);
    table.boolean('reminder_sent').defaultTo(false);
    table.boolean('certificate_issued').defaultTo(false);
    table.date('certificate_issued_date');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('course_schedule_id');
    table.index('booking_reference');
    table.index('status');
    table.index('payment_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('bookings');
}