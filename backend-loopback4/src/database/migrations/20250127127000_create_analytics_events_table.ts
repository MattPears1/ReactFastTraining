import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('analytics_events', (table) => {
    table.increments('id').primary();
    
    // Event details
    table.string('event_type', 50).notNullable();
    table.integer('user_id').unsigned();
    table.foreign('user_id').references('users.id').onDelete('SET NULL');
    
    // Session info
    table.string('session_id', 100);
    table.text('page_url');
    table.text('referrer_url');
    table.jsonb('event_data').defaultTo('{}');
    
    // Client info
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    table.string('device_type', 20);
    table.string('browser', 50);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('event_type');
    table.index('user_id');
    table.index('session_id');
    table.index('created_at');
    
    // Partial index for page_url (first 255 chars)
    knex.raw('CREATE INDEX idx_analytics_page_url ON analytics_events (LEFT(page_url, 255))');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('analytics_events');
}