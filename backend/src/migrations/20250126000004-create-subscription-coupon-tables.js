'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Subscription Plans table
    await queryInterface.createTable('subscription_plans', {
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
      description: {
        type: Sequelize.TEXT
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      interval: {
        type: Sequelize.ENUM('day', 'week', 'month', 'year'),
        allowNull: false
      },
      intervalCount: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      trialPeriodDays: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      limits: {
        type: Sequelize.JSONB
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isPopular: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sortOrder: {
        type: Sequelize.INTEGER
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

    // Create indexes for subscription plans
    await queryInterface.addIndex('subscription_plans', ['name']);
    await queryInterface.addIndex('subscription_plans', ['isActive']);
    await queryInterface.addIndex('subscription_plans', ['amount']);
    await queryInterface.addIndex('subscription_plans', ['interval']);

    // Create Subscriptions table
    await queryInterface.createTable('subscriptions', {
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
      planId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'subscription_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.ENUM('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing', 'paused'),
        defaultValue: 'incomplete'
      },
      currentPeriodStart: {
        type: Sequelize.DATE,
        allowNull: false
      },
      currentPeriodEnd: {
        type: Sequelize.DATE,
        allowNull: false
      },
      cancelAtPeriodEnd: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      canceledAt: {
        type: Sequelize.DATE
      },
      endedAt: {
        type: Sequelize.DATE
      },
      trialStart: {
        type: Sequelize.DATE
      },
      trialEnd: {
        type: Sequelize.DATE
      },
      provider: {
        type: Sequelize.ENUM('stripe', 'paypal', 'square', 'razorpay', 'crypto_processor'),
        allowNull: false
      },
      providerSubscriptionId: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      paymentMethodId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'payment_methods',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    // Create indexes for subscriptions
    await queryInterface.addIndex('subscriptions', ['userId']);
    await queryInterface.addIndex('subscriptions', ['planId']);
    await queryInterface.addIndex('subscriptions', ['status']);
    await queryInterface.addIndex('subscriptions', ['provider']);
    await queryInterface.addIndex('subscriptions', ['providerSubscriptionId']);
    await queryInterface.addIndex('subscriptions', ['currentPeriodEnd']);

    // Create Coupons table
    await queryInterface.createTable('coupons', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING(255)
      },
      type: {
        type: Sequelize.ENUM('fixed', 'percentage'),
        allowNull: false
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      maxPercentageDiscount: {
        type: Sequelize.DECIMAL(5, 2)
      },
      minimumPurchaseAmount: {
        type: Sequelize.DECIMAL(10, 2)
      },
      appliesTo: {
        type: Sequelize.ENUM('all', 'products', 'services', 'categories', 'specific_items'),
        defaultValue: 'all'
      },
      applicableItems: {
        type: Sequelize.JSONB
      },
      validFrom: {
        type: Sequelize.DATE
      },
      validUntil: {
        type: Sequelize.DATE
      },
      usageLimit: {
        type: Sequelize.INTEGER
      },
      usageLimitPerUser: {
        type: Sequelize.INTEGER
      },
      usageCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isFirstTimeUserOnly: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isStackable: {
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

    // Create indexes for coupons
    await queryInterface.addIndex('coupons', ['code'], { unique: true });
    await queryInterface.addIndex('coupons', ['type']);
    await queryInterface.addIndex('coupons', ['isActive']);
    await queryInterface.addIndex('coupons', ['validFrom']);
    await queryInterface.addIndex('coupons', ['validUntil']);

    // Create Coupon Usages table
    await queryInterface.createTable('coupon_usages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      couponId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'coupons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      usedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for coupon usages
    await queryInterface.addIndex('coupon_usages', ['couponId']);
    await queryInterface.addIndex('coupon_usages', ['userId']);
    await queryInterface.addIndex('coupon_usages', ['orderId']);

    // Add composite indexes for better query performance
    await queryInterface.addIndex('order_items', ['orderId', 'itemType']);
    await queryInterface.addIndex('cart_items', ['cartId', 'itemType']);
    await queryInterface.addIndex('reviews', ['productId', 'status', 'rating']);
    await queryInterface.addIndex('reviews', ['serviceId', 'status', 'rating']);
    await queryInterface.addIndex('payments', ['userId', 'status']);
    await queryInterface.addIndex('orders', ['userId', 'status']);
    await queryInterface.addIndex('addresses', ['userId', 'type', 'isDefault']);
    await queryInterface.addIndex('notifications', ['userId', 'isRead', 'createdAt']);
    await queryInterface.addIndex('coupon_usages', ['couponId', 'userId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('coupon_usages');
    await queryInterface.dropTable('coupons');
    await queryInterface.dropTable('subscriptions');
    await queryInterface.dropTable('subscription_plans');
  }
};