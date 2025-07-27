import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('password_resets', (table) => {
    table.increments('id').primary();
    
    // Foreign key
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    
    // Reset details
    table.string('token', 255).unique().notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('used_at');
    table.string('ip_address', 45);
    table.text('user_agent');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('token');
    table.index('user_id');
    table.index('expires_at');
    table.index('used');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('password_resets');
}