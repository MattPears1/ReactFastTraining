'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create course_schedules table
    await queryInterface.createTable('course_schedules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      courseType: {
        type: Sequelize.ENUM('EFAW', 'FAW', 'PAEDIATRIC', 'MENTAL_HEALTH'),
        allowNull: false
      },
      courseName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      courseDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      startTime: {
        type: Sequelize.STRING,
        allowNull: false
      },
      endTime: {
        type: Sequelize.STRING,
        allowNull: false
      },
      venue: {
        type: Sequelize.ENUM('LEEDS', 'SHEFFIELD', 'BRADFORD', 'ON_SITE', 'ONLINE'),
        allowNull: false
      },
      venueAddress: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      maxParticipants: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 12
      },
      currentParticipants: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      pricePerPerson: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      groupDiscountRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      instructor: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Lex'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create bookings table
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      courseType: {
        type: Sequelize.ENUM('EFAW', 'FAW', 'PAEDIATRIC', 'MENTAL_HEALTH'),
        allowNull: false
      },
      courseName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      courseDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      courseTime: {
        type: Sequelize.STRING,
        allowNull: false
      },
      venue: {
        type: Sequelize.ENUM('LEEDS', 'SHEFFIELD', 'BRADFORD', 'ON_SITE', 'ONLINE'),
        allowNull: false
      },
      venueDetails: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      numberOfParticipants: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      paymentMethod: {
        type: Sequelize.ENUM('CARD', 'BANK_TRANSFER', 'INVOICE'),
        allowNull: true
      },
      paymentIntentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contactName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contactEmail: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contactPhone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      companyName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      companyAddress: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      specialRequirements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      participantDetails: {
        type: Sequelize.JSON,
        allowNull: true
      },
      invoiceNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      confirmationCode: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('course_schedules', ['courseType']);
    await queryInterface.addIndex('course_schedules', ['courseDate']);
    await queryInterface.addIndex('course_schedules', ['venue']);
    await queryInterface.addIndex('course_schedules', ['isActive']);
    
    await queryInterface.addIndex('bookings', ['userId']);
    await queryInterface.addIndex('bookings', ['courseDate']);
    await queryInterface.addIndex('bookings', ['status']);
    await queryInterface.addIndex('bookings', ['confirmationCode']);
    await queryInterface.addIndex('bookings', ['contactEmail']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
    await queryInterface.dropTable('bookings');
    await queryInterface.dropTable('course_schedules');
  }
};