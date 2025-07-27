import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('admin_sessions', (table) => {
    table.increments('id').primary();
    
    // Foreign key
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    
    // Session details
    table.string('session_token', 255).unique().notNullable();
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('expires_at').notNullable();
    table.timestamp('last_activity');
    table.boolean('is_active').defaultTo(true);
    
    // Security tracking
    table.integer('failed_attempts').defaultTo(0);
    table.timestamp('locked_until');
    table.string('device_fingerprint', 255);
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('session_token');
    table.index('user_id');
    table.index('expires_at');
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('admin_sessions');
}