import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Check if users table exists
  const hasUsersTable = await knex.schema.hasTable('users');
  
  if (!hasUsersTable) {
    // Create users table if it doesn't exist
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 100);
      table.string('last_name', 100);
      table.string('phone', 20);
      table.enum('role', ['customer', 'admin', 'instructor']).defaultTo('customer');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_login');
      table.timestamps(true, true);
      
      // Add indexes
      table.index('email');
      table.index('role');
    });
  } else {
    // Extend existing users table
    await knex.schema.alterTable('users', (table) => {
      // Check and add columns if they don't exist
      const hasPhone = await knex.schema.hasColumn('users', 'phone');
      const hasRole = await knex.schema.hasColumn('users', 'role');
      const hasIsActive = await knex.schema.hasColumn('users', 'is_active');
      const hasLastLogin = await knex.schema.hasColumn('users', 'last_login');
      
      if (!hasPhone) {
        table.string('phone', 20);
      }
      
      if (!hasRole) {
        table.enum('role', ['customer', 'admin', 'instructor']).defaultTo('customer');
        table.index('role');
      }
      
      if (!hasIsActive) {
        table.boolean('is_active').defaultTo(true);
      }
      
      if (!hasLastLogin) {
        table.timestamp('last_login');
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Check if we created the table or just extended it
  const hasPasswordHash = await knex.schema.hasColumn('users', 'password_hash');
  
  if (hasPasswordHash) {
    // We created the table, so drop it
    await knex.schema.dropTableIfExists('users');
  } else {
    // We extended the table, so remove added columns
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('phone');
      table.dropColumn('role');
      table.dropColumn('is_active');
      table.dropColumn('last_login');
      
      table.dropIndex('role');
    });
  }
}