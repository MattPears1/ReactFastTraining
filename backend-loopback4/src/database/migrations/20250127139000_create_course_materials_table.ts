import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('course_materials', (table) => {
    table.increments('id').primary();
    
    // Foreign key
    table.integer('course_id').unsigned().notNullable();
    table.foreign('course_id').references('courses.id').onDelete('CASCADE');
    
    // Material details
    table.string('title', 255).notNullable();
    table.text('description');
    table.enum('material_type', [
      'pdf',
      'video',
      'presentation',
      'document',
      'link',
      'quiz',
      'assessment'
    ]).notNullable();
    
    // File/resource info
    table.string('file_url', 500);
    table.string('file_name', 255);
    table.integer('file_size');
    table.string('mime_type', 100);
    
    // Access control
    table.boolean('is_public').defaultTo(false);
    table.boolean('requires_completion').defaultTo(false);
    table.integer('display_order').defaultTo(0);
    table.boolean('is_downloadable').defaultTo(true);
    
    // Version control
    table.integer('version').defaultTo(1);
    table.timestamp('last_updated');
    table.integer('updated_by_id').unsigned();
    table.foreign('updated_by_id').references('users.id').onDelete('SET NULL');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('course_id');
    table.index('material_type');
    table.index('is_public');
    table.index('display_order');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('course_materials');
}