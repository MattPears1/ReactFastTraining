import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('trainers', (table) => {
    table.increments('id').primary();
    
    // Foreign key - trainers are also users
    table.integer('user_id').unsigned().unique();
    table.foreign('user_id').references('users.id').onDelete('SET NULL');
    
    // Trainer details
    table.string('trainer_code', 20).unique().notNullable();
    table.string('qualification_number', 100);
    table.date('qualification_expiry');
    table.string('specializations', 500); // JSON array of specializations
    table.text('bio');
    table.string('photo_url', 500);
    table.decimal('hourly_rate', 10, 2);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_available').defaultTo(true);
    
    // Contact preferences
    table.string('preferred_contact_method', 50).defaultTo('email');
    table.boolean('can_travel').defaultTo(true);
    table.integer('max_travel_miles').defaultTo(50);
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('trainer_code');
    table.index('is_active');
    table.index('is_available');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('trainers');
}