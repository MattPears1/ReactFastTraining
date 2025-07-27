import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('venues', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('address_line1', 255).notNullable();
    table.string('address_line2', 255);
    table.string('city', 100).notNullable();
    table.string('postcode', 10).notNullable();
    table.integer('capacity').notNullable();
    table.jsonb('facilities').defaultTo('{}');
    table.text('parking_info');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index('city');
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('venues');
}