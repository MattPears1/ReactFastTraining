'use strict';

const { v4: uuidv4 } = require('uuid');
const slug = require('slug');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create categories
    const categories = [
      {
        id: uuidv4(),
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Books',
        slug: 'books',
        description: 'Books and publications',
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home improvement and gardening',
        isActive: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('categories', categories, {});

    // Create products
    const products = [
      {
        id: uuidv4(),
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        shortDescription: 'Premium wireless headphones',
        sku: 'WBH-001',
        price: 149.99,
        compareAtPrice: 199.99,
        stockQuantity: 50,
        trackInventory: true,
        isActive: true,
        isFeatured: true,
        categoryId: categories[0].id, // Electronics
        images: JSON.stringify([
          { url: '/images/products/headphones-1.jpg', alt: 'Wireless Headphones Front View', isPrimary: true },
          { url: '/images/products/headphones-2.jpg', alt: 'Wireless Headphones Side View' }
        ]),
        features: JSON.stringify(['Noise Cancellation', '30-hour battery life', 'Bluetooth 5.0']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Smart Watch Pro',
        slug: 'smart-watch-pro',
        description: 'Advanced fitness tracking and smart features',
        shortDescription: 'Next-gen smartwatch',
        sku: 'SWP-001',
        price: 299.99,
        stockQuantity: 30,
        trackInventory: true,
        isActive: true,
        isFeatured: true,
        categoryId: categories[0].id, // Electronics
        images: JSON.stringify([
          { url: '/images/products/smartwatch-1.jpg', alt: 'Smart Watch', isPrimary: true }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-t-shirt',
        description: '100% organic cotton t-shirt, comfortable and sustainable',
        shortDescription: 'Organic cotton comfort',
        sku: 'PCT-001',
        price: 29.99,
        stockQuantity: 100,
        trackInventory: true,
        isActive: true,
        categoryId: categories[1].id, // Clothing
        variants: JSON.stringify([
          { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', options: ['Black', 'White', 'Navy', 'Gray'] }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Web Development Mastery',
        slug: 'web-development-mastery',
        description: 'Complete guide to modern web development',
        shortDescription: 'Learn web development from scratch',
        sku: 'WDM-001',
        price: 49.99,
        stockQuantity: 1000,
        trackInventory: false,
        isActive: true,
        isDigital: true,
        categoryId: categories[2].id, // Books
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Indoor Plant Collection',
        slug: 'indoor-plant-collection',
        description: 'Set of 5 easy-to-care indoor plants',
        shortDescription: 'Perfect for beginners',
        sku: 'IPC-001',
        price: 89.99,
        compareAtPrice: 119.99,
        stockQuantity: 20,
        trackInventory: true,
        isActive: true,
        categoryId: categories[3].id, // Home & Garden
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', products, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  }
};