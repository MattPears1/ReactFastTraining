import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('settings', (table) => {
    table.increments('id').primary();
    
    // Setting identification
    table.string('key', 100).unique().notNullable();
    table.text('value').notNullable();
    table.enum('value_type', ['string', 'number', 'boolean', 'json', 'date']).defaultTo('string');
    table.string('category', 100).notNullable();
    
    // Metadata
    table.string('display_name', 255).notNullable();
    table.text('description');
    table.boolean('is_public').defaultTo(false);
    table.boolean('is_editable').defaultTo(true);
    table.boolean('requires_restart').defaultTo(false);
    
    // Validation
    table.text('validation_rules'); // JSON schema for validation
    table.text('allowed_values'); // JSON array of allowed values
    table.string('default_value', 500);
    
    // Audit
    table.integer('updated_by_id').unsigned();
    table.foreign('updated_by_id').references('users.id').onDelete('SET NULL');
    table.timestamp('last_updated');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('key');
    table.index('category');
    table.index('is_public');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('settings');
}