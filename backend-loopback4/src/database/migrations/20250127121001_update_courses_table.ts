import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // First drop the constraint on course_type column
  await knex.raw(`
    ALTER TABLE courses 
    DROP CONSTRAINT IF EXISTS courses_course_type_check
  `);
  
  // Change course_type to varchar to allow more flexibility
  await knex.schema.alterTable('courses', (table) => {
    table.string('course_type', 100).notNullable().alter();
    table.string('category', 50); // workplace, paediatric, requalification, specialist
    table.string('duration', 50); // "1 Day", "3 Hours", etc.
  });
  
  // Update duration_hours to duration string
  await knex.raw(`
    UPDATE courses 
    SET duration = CASE 
      WHEN duration_hours = 6 THEN '1 Day'
      WHEN duration_hours = 18 THEN '3 Days'
      WHEN duration_hours = 3 THEN '3 Hours'
      WHEN duration_hours = 5 THEN '1 Day'
      ELSE duration_hours || ' hours'
    END
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.dropColumn('category');
    table.dropColumn('duration');
  });
  
  // Restore the enum constraint
  await knex.raw(`
    ALTER TABLE courses 
    ADD CONSTRAINT courses_course_type_check 
    CHECK (course_type IN ('EFAW', 'FAW', 'Paediatric'))
  `);
}