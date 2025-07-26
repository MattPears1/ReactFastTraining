'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create service categories
    const serviceCategories = [
      {
        id: uuidv4(),
        name: 'Consulting',
        slug: 'consulting',
        description: 'Professional consulting services',
        icon: 'briefcase',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Development',
        slug: 'development',
        description: 'Software development services',
        icon: 'code',
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Design',
        slug: 'design',
        description: 'Creative design services',
        icon: 'palette',
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Marketing',
        slug: 'marketing',
        description: 'Digital marketing services',
        icon: 'trending-up',
        isActive: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('service_categories', serviceCategories, {});

    // Create services
    const services = [
      {
        id: uuidv4(),
        name: 'Business Strategy Consultation',
        slug: 'business-strategy-consultation',
        description: 'One-on-one consultation to develop your business strategy',
        shortDescription: 'Strategic planning for your business',
        serviceType: 'consultation',
        price: 299.99,
        duration: '1_hour',
        isActive: true,
        isAvailable: true,
        isFeatured: true,
        categoryId: serviceCategories[0].id, // Consulting
        features: JSON.stringify([
          'Personalized strategy session',
          'Market analysis',
          'Action plan development',
          'Follow-up support'
        ]),
        deliverables: JSON.stringify([
          { name: 'Strategy Document', description: 'Comprehensive business strategy plan' },
          { name: 'Market Analysis Report', description: 'Detailed market research findings' }
        ]),
        minAdvanceBookingHours: 24,
        maxAdvanceBookingDays: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Website Development Package',
        slug: 'website-development-package',
        description: 'Complete website development from design to deployment',
        shortDescription: 'Professional website creation',
        serviceType: 'one_time',
        price: 2499.99,
        duration: 'custom',
        customDurationMinutes: 0, // Project-based
        isActive: true,
        isAvailable: true,
        isFeatured: true,
        categoryId: serviceCategories[1].id, // Development
        features: JSON.stringify([
          'Custom design',
          'Responsive development',
          'SEO optimization',
          '3 months support'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Logo Design Service',
        slug: 'logo-design-service',
        description: 'Professional logo design with multiple concepts',
        shortDescription: 'Create your brand identity',
        serviceType: 'one_time',
        price: 499.99,
        isActive: true,
        isAvailable: true,
        categoryId: serviceCategories[2].id, // Design
        deliverables: JSON.stringify([
          { name: 'Logo Concepts', description: '3 unique logo concepts' },
          { name: 'Final Files', description: 'All formats (PNG, SVG, AI)' },
          { name: 'Brand Guidelines', description: 'Basic usage guidelines' }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Social Media Management',
        slug: 'social-media-management',
        description: 'Monthly social media management and content creation',
        shortDescription: 'Grow your social presence',
        serviceType: 'subscription',
        price: 999.99,
        isActive: true,
        isAvailable: true,
        categoryId: serviceCategories[3].id, // Marketing
        features: JSON.stringify([
          '30 posts per month',
          'Content calendar',
          'Engagement management',
          'Monthly analytics report'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'SEO Audit & Optimization',
        slug: 'seo-audit-optimization',
        description: 'Comprehensive SEO audit and optimization plan',
        shortDescription: 'Improve your search rankings',
        serviceType: 'one_time',
        price: 799.99,
        duration: '4_hours',
        isActive: true,
        isAvailable: true,
        categoryId: serviceCategories[3].id, // Marketing
        deliverables: JSON.stringify([
          { name: 'SEO Audit Report', description: 'Complete technical and content audit' },
          { name: 'Optimization Plan', description: 'Prioritized action items' },
          { name: 'Keyword Research', description: 'Target keyword recommendations' }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('services', services, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('services', null, {});
    await queryInterface.bulkDelete('service_categories', null, {});
  }
};