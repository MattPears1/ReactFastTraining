import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('course_schedules', (table) => {
    table.increments('id').primary();
    
    // Foreign keys
    table.integer('course_id').unsigned().notNullable();
    table.foreign('course_id').references('courses.id').onDelete('RESTRICT');
    
    table.integer('venue_id').unsigned().notNullable();
    table.foreign('venue_id').references('venues.id').onDelete('RESTRICT');
    
    table.integer('instructor_id').unsigned();
    table.foreign('instructor_id').references('users.id').onDelete('SET NULL');
    
    // Schedule details
    table.timestamp('start_datetime').notNullable();
    table.timestamp('end_datetime').notNullable();
    table.enum('status', ['draft', 'published', 'full', 'cancelled']).defaultTo('draft');
    table.integer('current_capacity').defaultTo(0);
    table.text('notes');
    
    // Audit fields
    table.integer('created_by').unsigned();
    table.foreign('created_by').references('users.id').onDelete('SET NULL');
    table.timestamps(true, true);
    
    // Indexes
    table.index('course_id');
    table.index('venue_id');
    table.index('start_datetime');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('course_schedules');
}