'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const users = [
      {
        id: uuidv4(),
        email: 'admin@lexbusiness.com',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'moderator@lexbusiness.com',
        firstName: 'Moderator',
        lastName: 'User',
        password: hashedPassword,
        role: 'moderator',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};