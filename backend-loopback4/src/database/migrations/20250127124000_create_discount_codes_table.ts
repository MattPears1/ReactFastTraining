import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('discount_codes', (table) => {
    table.increments('id').primary();
    table.string('code', 50).unique().notNullable();
    table.text('description');
    table.enum('discount_type', ['percentage', 'fixed']).notNullable();
    table.decimal('discount_value', 10, 2).notNullable();
    table.decimal('min_purchase_amount', 10, 2);
    table.date('valid_from').notNullable();
    table.date('valid_until').notNullable();
    table.integer('usage_limit');
    table.integer('times_used').defaultTo(0);
    table.string('course_type_restriction', 50);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index('code');
    table.index('is_active');
    table.index(['valid_from', 'valid_until']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('discount_codes');
}