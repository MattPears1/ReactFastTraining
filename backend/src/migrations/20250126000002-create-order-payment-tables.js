'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Orders table
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      orderNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'canceled', 'refunded', 'failed'),
        defaultValue: 'pending'
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'),
        defaultValue: 'pending'
      },
      orderType: {
        type: Sequelize.ENUM('product', 'service', 'mixed'),
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
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
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      couponCode: {
        type: Sequelize.STRING(50)
      },
      shippingAddress: {
        type: Sequelize.JSONB
      },
      billingAddress: {
        type: Sequelize.JSONB
      },
      paymentMethod: {
        type: Sequelize.STRING(100)
      },
      paymentIntentId: {
        type: Sequelize.STRING(255)
      },
      transactionId: {
        type: Sequelize.STRING(255)
      },
      customerNotes: {
        type: Sequelize.TEXT
      },
      internalNotes: {
        type: Sequelize.TEXT
      },
      trackingInfo: {
        type: Sequelize.JSONB
      },
      paidAt: {
        type: Sequelize.DATE
      },
      shippedAt: {
        type: Sequelize.DATE
      },
      deliveredAt: {
        type: Sequelize.DATE
      },
      completedAt: {
        type: Sequelize.DATE
      },
      canceledAt: {
        type: Sequelize.DATE
      },
      cancelReason: {
        type: Sequelize.STRING(255)
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

    // Create indexes for orders
    await queryInterface.addIndex('orders', ['orderNumber'], { unique: true });
    await queryInterface.addIndex('orders', ['userId']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['paymentStatus']);
    await queryInterface.addIndex('orders', ['createdAt']);
    await queryInterface.addIndex('orders', ['orderType']);

    // Create Order Items table
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
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
        onDelete: 'SET NULL'
      },
      serviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'services',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      itemType: {
        type: Sequelize.ENUM('product', 'service'),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING(100)
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
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

    // Create indexes for order items
    await queryInterface.addIndex('order_items', ['orderId']);
    await queryInterface.addIndex('order_items', ['productId']);
    await queryInterface.addIndex('order_items', ['serviceId']);

    // Create Payment Methods table
    await queryInterface.createTable('payment_methods', {
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
        type: Sequelize.ENUM('card', 'bank_account', 'paypal', 'apple_pay', 'google_pay', 'crypto'),
        allowNull: false
      },
      provider: {
        type: Sequelize.ENUM('stripe', 'paypal', 'square', 'razorpay', 'crypto_processor'),
        allowNull: false
      },
      last4: {
        type: Sequelize.STRING(4)
      },
      brand: {
        type: Sequelize.STRING(50)
      },
      expiryMonth: {
        type: Sequelize.INTEGER
      },
      expiryYear: {
        type: Sequelize.INTEGER
      },
      providerMethodId: {
        type: Sequelize.STRING(255)
      },
      fingerprint: {
        type: Sequelize.STRING(255)
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      billingAddress: {
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
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create indexes for payment methods
    await queryInterface.addIndex('payment_methods', ['userId']);
    await queryInterface.addIndex('payment_methods', ['type']);
    await queryInterface.addIndex('payment_methods', ['provider']);
    await queryInterface.addIndex('payment_methods', ['isDefault']);

    // Create Payments table
    await queryInterface.createTable('payments', {
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
        onDelete: 'RESTRICT'
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
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded'),
        defaultValue: 'pending'
      },
      provider: {
        type: Sequelize.ENUM('stripe', 'paypal', 'square', 'razorpay', 'crypto_processor'),
        allowNull: false
      },
      providerPaymentId: {
        type: Sequelize.STRING(255)
      },
      paymentMethodId: {
        type: Sequelize.UUID,
        references: {
          model: 'payment_methods',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      description: {
        type: Sequelize.TEXT
      },
      providerResponse: {
        type: Sequelize.JSONB
      },
      failureReason: {
        type: Sequelize.TEXT
      },
      failureCode: {
        type: Sequelize.STRING(50)
      },
      refundedAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      processedAt: {
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
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create indexes for payments
    await queryInterface.addIndex('payments', ['userId']);
    await queryInterface.addIndex('payments', ['orderId']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['provider']);
    await queryInterface.addIndex('payments', ['providerPaymentId']);
    await queryInterface.addIndex('payments', ['createdAt']);

    // Create Refunds table
    await queryInterface.createTable('refunds', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      paymentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('pending', 'succeeded', 'failed', 'canceled'),
        defaultValue: 'pending'
      },
      provider: {
        type: Sequelize.ENUM('stripe', 'paypal', 'square', 'razorpay', 'crypto_processor'),
        allowNull: false
      },
      providerRefundId: {
        type: Sequelize.STRING(255)
      },
      providerResponse: {
        type: Sequelize.JSONB
      },
      failureReason: {
        type: Sequelize.TEXT
      },
      processedAt: {
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
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create indexes for refunds
    await queryInterface.addIndex('refunds', ['paymentId']);
    await queryInterface.addIndex('refunds', ['status']);
    await queryInterface.addIndex('refunds', ['provider']);
    await queryInterface.addIndex('refunds', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('refunds');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('payment_methods');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
  }
};