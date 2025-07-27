import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.string('password_reset_token');
    table.timestamp('password_reset_expiry');
    
    // Add index for faster lookups
    table.index('password_reset_token');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropIndex('password_reset_token');
    table.dropColumn('password_reset_token');
    table.dropColumn('password_reset_expiry');
  });
}