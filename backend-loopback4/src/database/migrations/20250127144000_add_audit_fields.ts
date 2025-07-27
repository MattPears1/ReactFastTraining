import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add created_by and updated_by to tables that need audit tracking
  const tablesToUpdate = [
    'courses',
    'course_schedules',
    'bookings',
    'certificates',
    'refunds',
    'locations',
    'trainers',
    'course_materials',
    'notifications'
  ];
  
  for (const tableName of tablesToUpdate) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasCreatedBy = await knex.schema.hasColumn(tableName, 'created_by_id');
      const hasUpdatedBy = await knex.schema.hasColumn(tableName, 'updated_by_id');
      
      await knex.schema.alterTable(tableName, (table) => {
        if (!hasCreatedBy) {
          table.integer('created_by_id').unsigned();
          table.foreign('created_by_id').references('users.id').onDelete('SET NULL');
        }
        
        if (!hasUpdatedBy) {
          table.integer('updated_by_id').unsigned();
          table.foreign('updated_by_id').references('users.id').onDelete('SET NULL');
        }
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const tablesToUpdate = [
    'courses',
    'course_schedules',
    'bookings',
    'certificates',
    'refunds',
    'locations',
    'trainers',
    'course_materials',
    'notifications'
  ];
  
  for (const tableName of tablesToUpdate) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropForeign(['created_by_id']);
        table.dropForeign(['updated_by_id']);
        table.dropColumn('created_by_id');
        table.dropColumn('updated_by_id');
      });
    }
  }
}