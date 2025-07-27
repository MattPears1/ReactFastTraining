import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('special_requirements', (table) => {
    table.increments('id').primary();
    
    // Foreign keys
    table.integer('booking_id').unsigned().notNullable();
    table.foreign('booking_id').references('bookings.id').onDelete('CASCADE');
    
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    
    // Requirements details
    table.enum('requirement_type', [
      'dietary',
      'accessibility',
      'medical',
      'language',
      'learning',
      'other'
    ]).notNullable();
    
    table.text('details').notNullable();
    table.enum('severity', ['low', 'medium', 'high']).defaultTo('medium');
    table.boolean('requires_action').defaultTo(true);
    table.boolean('action_completed').defaultTo(false);
    table.text('action_taken');
    table.integer('handled_by_id').unsigned();
    table.foreign('handled_by_id').references('users.id').onDelete('SET NULL');
    
    // Privacy
    table.boolean('is_confidential').defaultTo(true);
    table.boolean('share_with_trainer').defaultTo(false);
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('booking_id');
    table.index('user_id');
    table.index('requirement_type');
    table.index('requires_action');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('special_requirements');
}