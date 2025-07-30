import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add certificate_name field to bookings table participants
  await knex.schema.alterTable('bookings', (table) => {
    // Since participants is JSONB, we'll add a note column for now
    // The actual certificate_name will be stored within the participants JSON
    table.text('certificate_instructions').defaultTo('Please ensure participant names are exactly as they should appear on certificates.');
  });

  // Create customer_records table for tracking training history
  await knex.schema.createTable('customer_records', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.string('phone', 50);
    table.string('company', 255);
    
    // Training statistics
    table.integer('total_courses_completed').defaultTo(0);
    table.date('first_training_date');
    table.date('last_training_date');
    table.date('next_renewal_due');
    
    // Certificate tracking
    table.integer('active_certificates').defaultTo(0);
    table.integer('expired_certificates').defaultTo(0);
    table.integer('total_certificates').defaultTo(0);
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('last_training_date');
    table.index('next_renewal_due');
  });

  // Create certificate_templates table
  await knex.schema.createTable('certificate_templates', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('course_type', 100).notNullable();
    table.text('template_html').notNullable();
    table.json('template_variables').defaultTo('{}');
    table.string('certification_body', 100);
    table.integer('validity_years').defaultTo(3);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index('course_type');
    table.index('is_active');
  });

  // Create certificate_audit_log table for tracking all certificate operations
  await knex.schema.createTable('certificate_audit_log', (table) => {
    table.increments('id').primary();
    table.uuid('certificate_id').references('id').inTable('certificates');
    table.string('action', 50).notNullable(); // generated, emailed, downloaded, reissued, revoked
    table.string('performed_by_email', 255);
    table.string('ip_address', 45);
    table.text('details');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('certificate_id');
    table.index('action');
    table.index('created_at');
  });

  // Add fields to certificates table
  await knex.schema.alterTable('certificates', (table) => {
    table.string('certificate_name', 255); // The name as it should appear on certificate
    table.boolean('emailed').defaultTo(false);
    table.timestamp('emailed_at');
    table.integer('download_count').defaultTo(0);
    table.timestamp('last_downloaded_at');
    table.string('template_id').references('id').inTable('certificate_templates');
  });

  // Update participants structure to include certificate_name
  await knex.raw(`
    UPDATE bookings 
    SET participants = jsonb_set(
      participants,
      '{0,certificate_name}',
      to_jsonb(participants->0->>'firstName' || ' ' || participants->0->>'lastName'),
      true
    )
    WHERE jsonb_array_length(participants) > 0
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('certificate_audit_log');
  await knex.schema.dropTableIfExists('certificate_templates');
  await knex.schema.dropTableIfExists('customer_records');
  
  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('certificate_instructions');
  });
  
  await knex.schema.alterTable('certificates', (table) => {
    table.dropColumn('certificate_name');
    table.dropColumn('emailed');
    table.dropColumn('emailed_at');
    table.dropColumn('download_count');
    table.dropColumn('last_downloaded_at');
    table.dropColumn('template_id');
  });
}