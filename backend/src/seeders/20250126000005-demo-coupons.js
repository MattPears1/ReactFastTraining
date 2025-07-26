'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const coupons = [
      {
        id: uuidv4(),
        code: 'WELCOME20',
        description: '20% off for new customers',
        type: 'percentage',
        value: 20,
        minimumPurchaseAmount: 50.00,
        appliesTo: 'all',
        validFrom: now,
        validUntil: nextYear,
        usageLimitPerUser: 1,
        isActive: true,
        isFirstTimeUserOnly: true,
        isStackable: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        code: 'SAVE10',
        description: '$10 off any purchase',
        type: 'fixed',
        value: 10.00,
        minimumPurchaseAmount: 100.00,
        appliesTo: 'all',
        validFrom: now,
        validUntil: nextMonth,
        usageLimit: 100,
        isActive: true,
        isFirstTimeUserOnly: false,
        isStackable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        code: 'ELECTRONICS15',
        description: '15% off electronics',
        type: 'percentage',
        value: 15,
        maxPercentageDiscount: 100.00,
        appliesTo: 'categories',
        applicableItems: JSON.stringify({
          categoryIds: [] // Would reference actual category IDs
        }),
        validFrom: now,
        validUntil: nextMonth,
        isActive: true,
        isFirstTimeUserOnly: false,
        isStackable: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        code: 'FREESHIP',
        description: 'Free shipping on orders over $50',
        type: 'fixed',
        value: 0, // Special handling in business logic
        minimumPurchaseAmount: 50.00,
        appliesTo: 'all',
        validFrom: now,
        validUntil: nextYear,
        isActive: true,
        isFirstTimeUserOnly: false,
        isStackable: true,
        metadata: JSON.stringify({
          applyToShipping: true
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        code: 'VIP50',
        description: '50% off for VIP members',
        type: 'percentage',
        value: 50,
        appliesTo: 'all',
        validFrom: now,
        validUntil: nextYear,
        usageLimit: 50,
        usageLimitPerUser: 5,
        isActive: true,
        isFirstTimeUserOnly: false,
        isStackable: false,
        metadata: JSON.stringify({
          requiresVipStatus: true
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        code: 'EXPIRED2023',
        description: 'Expired coupon for testing',
        type: 'percentage',
        value: 25,
        appliesTo: 'all',
        validFrom: new Date('2023-01-01'),
        validUntil: new Date('2023-12-31'),
        isActive: true,
        isFirstTimeUserOnly: false,
        isStackable: false,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('coupons', coupons, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('coupons', null, {});
  }
};