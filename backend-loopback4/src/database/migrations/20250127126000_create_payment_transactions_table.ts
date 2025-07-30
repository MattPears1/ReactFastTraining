import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('payment_transactions', (table) => {
    table.increments('id').primary();
    
    // Foreign key
    table.integer('booking_id').unsigned().notNullable();
    table.foreign('booking_id').references('bookings.id').onDelete('CASCADE');
    
    // Payment details
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('GBP');
    table.string('payment_method', 50).notNullable();
    table.string('stripe_payment_intent_id', 255);
    table.string('stripe_charge_id', 255);
    table.enum('status', ['pending', 'succeeded', 'failed', 'refunded']).notNullable();
    table.text('failure_reason');
    table.jsonb('metadata').defaultTo('{}');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('booking_id');
    table.index('stripe_payment_intent_id');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('payment_transactions');
}