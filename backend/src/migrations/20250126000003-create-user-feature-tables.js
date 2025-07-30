'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Carts table
    await queryInterface.createTable('carts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true
      },
      sessionId: {
        type: Sequelize.STRING(255)
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      shippingAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      couponCode: {
        type: Sequelize.STRING(50)
      },
      expiresAt: {
        type: Sequelize.DATE
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
      }
    });

    // Create indexes for carts
    await queryInterface.addIndex('carts', ['userId'], { unique: true });
    await queryInterface.addIndex('carts', ['sessionId']);
    await queryInterface.addIndex('carts', ['expiresAt']);

    // Create Cart Items table
    await queryInterface.createTable('cart_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      cartId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'carts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        type: Sequelize.UUID,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      serviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'services',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      itemType: {
        type: Sequelize.ENUM('product', 'service'),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      productVariant: {
        type: Sequelize.JSONB
      },
      serviceDetails: {
        type: Sequelize.JSONB
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
      }
    });

    // Create indexes for cart items
    await queryInterface.addIndex('cart_items', ['cartId']);
    await queryInterface.addIndex('cart_items', ['productId']);
    await queryInterface.addIndex('cart_items', ['serviceId']);

    // Create Addresses table
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('billing', 'shipping', 'both'),
        defaultValue: 'both'
      },
      label: {
        type: Sequelize.STRING(100)
      },
      firstName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      company: {
        type: Sequelize.STRING(100)
      },
      addressLine1: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      addressLine2: {
        type: Sequelize.STRING(255)
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(100)
      },
      postalCode: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING(20)
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Create indexes for addresses
    await queryInterface.addIndex('addresses', ['userId']);
    await queryInterface.addIndex('addresses', ['type']);
    await queryInterface.addIndex('addresses', ['isDefault']);

    // Create Reviews table
    await queryInterface.createTable('reviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        type: Sequelize.UUID,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      serviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'services',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      orderId: {
        type: Sequelize.UUID,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewType: {
        type: Sequelize.ENUM('product', 'service'),
        allowNull: false
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255)
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      pros: {
        type: Sequelize.JSONB
      },
      cons: {
        type: Sequelize.JSONB
      },
      images: {
        type: Sequelize.JSONB
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'flagged'),
        defaultValue: 'pending'
      },
      isVerifiedPurchase: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      helpfulCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      notHelpfulCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      moderatorNotes: {
        type: Sequelize.TEXT
      },
      approvedAt: {
        type: Sequelize.DATE
      },
      approvedBy: {
        type: Sequelize.UUID
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

    // Create indexes for reviews
    await queryInterface.addIndex('reviews', ['userId']);
    await queryInterface.addIndex('reviews', ['productId']);
    await queryInterface.addIndex('reviews', ['serviceId']);
    await queryInterface.addIndex('reviews', ['orderId']);
    await queryInterface.addIndex('reviews', ['status']);
    await queryInterface.addIndex('reviews', ['rating']);
    await queryInterface.addIndex('reviews', ['createdAt']);

    // Create Notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM(
          'order_placed', 'order_shipped', 'order_delivered', 'order_canceled',
          'payment_success', 'payment_failed', 'refund_processed',
          'service_booked', 'service_reminder', 'service_completed',
          'review_request', 'review_response',
          'promotion', 'system', 'security', 'account'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB
      },
      channels: {
        type: Sequelize.ARRAY(Sequelize.ENUM('in_app', 'email', 'sms', 'push')),
        defaultValue: ['in_app']
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE
      },
      deliveryStatus: {
        type: Sequelize.JSONB
      },
      actionUrl: {
        type: Sequelize.STRING(255)
      },
      actionText: {
        type: Sequelize.STRING(100)
      },
      icon: {
        type: Sequelize.STRING(255)
      },
      expiresAt: {
        type: Sequelize.DATE
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
      }
    });

    // Create indexes for notifications
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['isRead']);
    await queryInterface.addIndex('notifications', ['priority']);
    await queryInterface.addIndex('notifications', ['createdAt']);

    // Create Audit Logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.ENUM(
          'create', 'update', 'delete', 'login', 'logout',
          'password_change', 'password_reset', 'email_verification',
          'permission_change', 'export_data', 'import_data',
          'api_access', 'failed_login', 'security_alert'
        ),
        allowNull: false
      },
      resource: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      resourceId: {
        type: Sequelize.UUID
      },
      previousValues: {
        type: Sequelize.JSONB
      },
      newValues: {
        type: Sequelize.JSONB
      },
      metadata: {
        type: Sequelize.JSONB
      },
      ipAddress: {
        type: Sequelize.STRING(45)
      },
      userAgent: {
        type: Sequelize.STRING(255)
      },
      sessionId: {
        type: Sequelize.STRING(100)
      },
      description: {
        type: Sequelize.TEXT
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for audit logs
    await queryInterface.addIndex('audit_logs', ['userId']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['resource']);
    await queryInterface.addIndex('audit_logs', ['resourceId']);
    await queryInterface.addIndex('audit_logs', ['timestamp']);
    await queryInterface.addIndex('audit_logs', ['ipAddress']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('reviews');
    await queryInterface.dropTable('addresses');
    await queryInterface.dropTable('cart_items');
    await queryInterface.dropTable('carts');
  }
};