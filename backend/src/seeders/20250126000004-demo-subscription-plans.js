'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const subscriptionPlans = [
      {
        id: uuidv4(),
        name: 'Basic Plan',
        description: 'Perfect for individuals and small teams',
        amount: 29.99,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        trialPeriodDays: 7,
        features: JSON.stringify([
          '5 Projects',
          '10GB Storage',
          'Email Support',
          'Basic Analytics',
          'API Access'
        ]),
        limits: JSON.stringify({
          projects: 5,
          storage: 10737418240, // 10GB in bytes
          apiCalls: 10000
        }),
        isActive: true,
        isPopular: false,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Professional Plan',
        description: 'Great for growing businesses',
        amount: 79.99,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        trialPeriodDays: 14,
        features: JSON.stringify([
          'Unlimited Projects',
          '100GB Storage',
          'Priority Email Support',
          'Advanced Analytics',
          'API Access',
          'Custom Integrations',
          'Team Collaboration'
        ]),
        limits: JSON.stringify({
          projects: -1, // unlimited
          storage: 107374182400, // 100GB in bytes
          apiCalls: 100000,
          teamMembers: 10
        }),
        isActive: true,
        isPopular: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Enterprise Plan',
        description: 'For large organizations with advanced needs',
        amount: 299.99,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        trialPeriodDays: 30,
        features: JSON.stringify([
          'Unlimited Everything',
          '1TB Storage',
          '24/7 Phone Support',
          'Advanced Analytics & Reporting',
          'API Access',
          'Custom Integrations',
          'Unlimited Team Members',
          'SLA Guarantee',
          'Dedicated Account Manager',
          'Custom Training'
        ]),
        limits: JSON.stringify({
          projects: -1,
          storage: 1099511627776, // 1TB in bytes
          apiCalls: -1, // unlimited
          teamMembers: -1
        }),
        isActive: true,
        isPopular: false,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Annual Professional',
        description: 'Professional plan billed annually - Save 20%',
        amount: 767.90, // 79.99 * 12 * 0.8
        currency: 'USD',
        interval: 'year',
        intervalCount: 1,
        trialPeriodDays: 14,
        features: JSON.stringify([
          'All Professional features',
          '20% Annual Discount',
          'Priority Support',
          'Early Access to New Features'
        ]),
        limits: JSON.stringify({
          projects: -1,
          storage: 107374182400,
          apiCalls: 100000,
          teamMembers: 10
        }),
        isActive: true,
        isPopular: false,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('subscription_plans', subscriptionPlans, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('subscription_plans', null, {});
  }
};