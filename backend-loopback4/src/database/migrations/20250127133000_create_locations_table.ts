import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("locations", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("address", 500).notNullable();
    table.string("city", 100).notNullable();
    table.string("postcode", 20).notNullable();
    table.string("phone", 20);
    table.string("email", 255);
    table.text("directions");
    table.text("parking_info");
    table.text("public_transport_info");
    table.jsonb("facilities").defaultTo("[]");
    table.integer("capacity").unsigned().notNullable();
    table.boolean("is_active").defaultTo(true);
    table.decimal("latitude", 10, 8);
    table.decimal("longitude", 11, 8);
    table.timestamps(true, true);

    // Add indexes
    table.index("city");
    table.index("is_active");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("locations");
}