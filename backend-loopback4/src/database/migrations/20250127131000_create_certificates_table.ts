import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('certificates', (table) => {
    table.increments('id').primary();
    
    // Foreign keys
    table.integer('booking_id').unsigned().notNullable();
    table.foreign('booking_id').references('bookings.id').onDelete('RESTRICT');
    
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('RESTRICT');
    
    table.integer('course_id').unsigned().notNullable();
    table.foreign('course_id').references('courses.id').onDelete('RESTRICT');
    
    // Certificate details
    table.string('certificate_number', 50).unique().notNullable();
    table.date('issue_date').notNullable();
    table.date('expiry_date').notNullable();
    table.string('pdf_url', 500);
    table.enum('status', ['active', 'expired', 'revoked']).defaultTo('active');
    table.text('revocation_reason');
    table.timestamp('revoked_at');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('certificate_number');
    table.index('user_id');
    table.index('status');
    table.index('expiry_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('certificates');
}