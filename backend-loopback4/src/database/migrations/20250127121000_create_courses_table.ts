import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('courses', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.enum('course_type', ['EFAW', 'FAW', 'Paediatric']).notNullable();
    table.decimal('duration_hours', 4, 2).notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('max_capacity').notNullable().defaultTo(12);
    table.integer('certification_validity_years').defaultTo(3);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index('course_type');
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('courses');
}