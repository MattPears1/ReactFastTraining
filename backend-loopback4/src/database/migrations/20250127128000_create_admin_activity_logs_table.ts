import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('admin_activity_logs', (table) => {
    table.increments('id').primary();
    
    // Admin user
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('users.id').onDelete('CASCADE');
    
    // Activity details
    table.string('action', 100).notNullable();
    table.string('entity_type', 50);
    table.integer('entity_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    
    // Request info
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('admin_id');
    table.index('action');
    table.index(['entity_type', 'entity_id']);
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('admin_activity_logs');
}