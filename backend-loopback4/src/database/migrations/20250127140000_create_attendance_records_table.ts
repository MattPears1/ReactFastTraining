import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('attendance_records', (table) => {
    table.increments('id').primary();
    
    // Foreign keys
    table.integer('booking_id').unsigned().notNullable();
    table.foreign('booking_id').references('bookings.id').onDelete('CASCADE');
    
    table.integer('course_session_id').unsigned().notNullable();
    table.foreign('course_session_id').references('course_schedules.id').onDelete('RESTRICT');
    
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('RESTRICT');
    
    table.integer('marked_by_id').unsigned();
    table.foreign('marked_by_id').references('users.id').onDelete('SET NULL');
    
    // Attendance details
    table.enum('status', ['present', 'absent', 'late', 'partial', 'excused']).notNullable();
    table.time('check_in_time');
    table.time('check_out_time');
    table.integer('duration_minutes');
    
    // Additional info
    table.text('notes');
    table.boolean('certificate_eligible').defaultTo(true);
    table.text('absence_reason');
    table.boolean('makeup_required').defaultTo(false);
    table.date('makeup_scheduled_date');
    
    // Performance tracking
    table.integer('participation_score'); // 1-10
    table.boolean('passed_assessment').defaultTo(true);
    table.text('trainer_feedback');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('booking_id');
    table.index('course_session_id');
    table.index('user_id');
    table.index('status');
    table.index(['course_session_id', 'user_id'], 'idx_session_user_unique');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('attendance_records');
}