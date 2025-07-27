import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reports', (table) => {
    table.increments('id').primary();
    
    // Foreign key
    table.integer('generated_by_id').unsigned().notNullable();
    table.foreign('generated_by_id').references('users.id').onDelete('RESTRICT');
    
    // Report details
    table.string('report_type', 100).notNullable();
    table.string('report_name', 255).notNullable();
    table.text('parameters'); // JSON of report parameters
    table.enum('format', ['pdf', 'csv', 'excel', 'json']).notNullable();
    table.enum('status', ['pending', 'generating', 'completed', 'failed']).defaultTo('pending');
    
    // Date range
    table.date('start_date');
    table.date('end_date');
    
    // File info
    table.string('file_url', 500);
    table.integer('file_size');
    table.integer('row_count');
    
    // Processing info
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.integer('processing_time_ms');
    table.text('error_message');
    
    // Scheduling
    table.boolean('is_scheduled').defaultTo(false);
    table.string('schedule_frequency', 50); // daily, weekly, monthly
    table.timestamp('next_run_at');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('generated_by_id');
    table.index('report_type');
    table.index('status');
    table.index('created_at');
    table.index('is_scheduled');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('reports');
}