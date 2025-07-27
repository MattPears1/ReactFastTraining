import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Check if columns exist before adding them
  const hasTrainerId = await knex.schema.hasColumn('course_schedules', 'trainer_id');
  const hasStatus = await knex.schema.hasColumn('course_schedules', 'status');
  const hasCancelledAt = await knex.schema.hasColumn('course_schedules', 'cancelled_at');
  const hasCancellationReason = await knex.schema.hasColumn('course_schedules', 'cancellation_reason');

  return knex.schema.alterTable('course_schedules', (table) => {
    // Add trainer assignment
    if (!hasTrainerId) {
      table.integer('trainer_id').unsigned();
      table.foreign('trainer_id').references('trainers.id').onDelete('SET NULL');
      table.index('trainer_id');
    }
    
    // Add session status
    if (!hasStatus) {
      table.enum('status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'])
        .defaultTo('scheduled');
      table.index('status');
    }
    
    // Add cancellation info
    if (!hasCancelledAt) {
      table.timestamp('cancelled_at');
    }
    
    if (!hasCancellationReason) {
      table.text('cancellation_reason');
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('course_schedules', (table) => {
    table.dropForeign(['trainer_id']);
    table.dropColumn('trainer_id');
    table.dropColumn('status');
    table.dropColumn('cancelled_at');
    table.dropColumn('cancellation_reason');
  });
}