import { Knex } from "knex";
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Check if admin user already exists
  const existingAdmin = await knex('users')
    .where({ email: 'lex@reactfasttraining.co.uk' })
    .first();

  if (!existingAdmin) {
    // Hash the password
    const passwordHash = await bcrypt.hash('LexOnly321!', 12);

    // Insert admin user
    await knex('users').insert({
      email: 'lex@reactfasttraining.co.uk',
      password_hash: passwordHash,
      first_name: 'Lex',
      last_name: 'Admin',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }
}