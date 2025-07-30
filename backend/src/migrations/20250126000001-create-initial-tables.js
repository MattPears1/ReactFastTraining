'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      firstName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'moderator', 'user', 'guest'),
        defaultValue: 'user'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      emailVerificationToken: {
        type: Sequelize.STRING
      },
      emailVerificationExpires: {
        type: Sequelize.DATE
      },
      resetPasswordToken: {
        type: Sequelize.STRING
      },
      resetPasswordExpires: {
        type: Sequelize.DATE
      },
      twoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      twoFactorSecret: {
        type: Sequelize.STRING
      },
      profilePicture: {
        type: Sequelize.STRING
      },
      phoneNumber: {
        type: Sequelize.STRING(20)
      },
      preferences: {
        type: Sequelize.JSONB
      },
      metadata: {
        type: Sequelize.JSONB
      },
      lastLoginAt: {
        type: Sequelize.DATE
      },
      lastLoginIp: {
        type: Sequelize.STRING(45)
      },
      loginCount: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create indexes for users
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['isActive']);
    await queryInterface.addIndex('users', ['createdAt']);

    // Create Categories table
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      image: {
        type: Sequelize.STRING(255)
      },
      parentId: {
        type: Sequelize.UUID,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      metadata: {
        type: Sequelize.JSONB
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create indexes for categories
    await queryInterface.addIndex('categories', ['slug'], { unique: true });
    await queryInterface.addIndex('categories', ['parentId']);
    await queryInterface.addIndex('categories', ['order']);

    // Create Products table
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      shortDescription: {
        type: Sequelize.TEXT
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      compareAtPrice: {
        type: Sequelize.DECIMAL(10, 2)
      },
      costPrice: {
        type: Sequelize.DECIMAL(10, 2)
      },
      stockQuantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      trackInventory: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isDigital: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      images: {
        type: Sequelize.JSONB
      },
      attributes: {
        type: Sequelize.JSONB
      },
      variants: {
        type: Sequelize.JSONB
      },
      seo: {
        type: Sequelize.JSONB
      },
      weight: {
        type: Sequelize.DECIMAL(3, 2)
      },
      dimensions: {
        type: Sequelize.JSONB
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      categoryId: {
        type: Sequelize.UUID,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      salesCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create indexes for products
    await queryInterface.addIndex('products', ['slug'], { unique: true });
    await queryInterface.addIndex('products', ['sku'], { unique: true });
    await queryInterface.addIndex('products', ['categoryId']);
    await queryInterface.addIndex('products', ['price']);
    await queryInterface.addIndex('products', ['isActive']);
    await queryInterface.addIndex('products', ['isFeatured']);
    await queryInterface.addIndex('products', ['createdAt']);

    // Create Service Categories table
    await queryInterface.createTable('service_categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      icon: {
        type: Sequelize.STRING(255)
      },
      image: {
        type: Sequelize.STRING(255)
      },
      parentId: {
        type: Sequelize.UUID,
        references: {
          model: 'service_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      metadata: {
        type: Sequelize.JSONB
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create indexes for service categories
    await queryInterface.addIndex('service_categories', ['slug'], { unique: true });
    await queryInterface.addIndex('service_categories', ['parentId']);
    await queryInterface.addIndex('service_categories', ['order']);

    // Create Services table
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      shortDescription: {
        type: Sequelize.TEXT
      },
      serviceType: {
        type: Sequelize.ENUM('one_time', 'recurring', 'subscription', 'consultation'),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      duration: {
        type: Sequelize.ENUM('15_minutes', '30_minutes', '1_hour', '2_hours', '4_hours', '8_hours', 'custom')
      },
      customDurationMinutes: {
        type: Sequelize.INTEGER
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      images: {
        type: Sequelize.JSONB
      },
      features: {
        type: Sequelize.JSONB
      },
      deliverables: {
        type: Sequelize.JSONB
      },
      requirements: {
        type: Sequelize.JSONB
      },
      maxBookingsPerDay: {
        type: Sequelize.INTEGER
      },
      minAdvanceBookingHours: {
        type: Sequelize.INTEGER
      },
      maxAdvanceBookingDays: {
        type: Sequelize.INTEGER
      },
      availability: {
        type: Sequelize.JSONB
      },
      seo: {
        type: Sequelize.JSONB
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      categoryId: {
        type: Sequelize.UUID,
        references: {
          model: 'service_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      bookingCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      averageRating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0
      },
      reviewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      metadata: {
        type: Sequelize.JSONB
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create indexes for services
    await queryInterface.addIndex('services', ['slug'], { unique: true });
    await queryInterface.addIndex('services', ['serviceType']);
    await queryInterface.addIndex('services', ['categoryId']);
    await queryInterface.addIndex('services', ['price']);
    await queryInterface.addIndex('services', ['isActive']);
    await queryInterface.addIndex('services', ['isFeatured']);
    await queryInterface.addIndex('services', ['createdAt']);

    // Continue with more tables in the next migration file...
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('services');
    await queryInterface.dropTable('service_categories');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('users');
  }
};