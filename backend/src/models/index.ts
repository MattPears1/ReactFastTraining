// User and Authentication
export { User, UserRole } from './User.model';
export { AuditLog, AuditAction } from './AuditLog.model';

// Products and Services
export { Product, Category } from './Product.model';
export { Service, ServiceCategory, ServiceType, ServiceDuration } from './Service.model';

// Orders and Cart
export { Order, OrderItem, OrderStatus, OrderType, PaymentStatus as OrderPaymentStatus } from './Order.model';
export { Cart, CartItem } from './Cart.model';

// Payments and Subscriptions
export { Payment, PaymentMethod, Refund } from './Payment.model';
export { Subscription, SubscriptionPlan } from './Subscription.model';
export { Coupon, CouponUsage, CouponType, CouponAppliesTo } from './Coupon.model';

// User Features
export { Address, AddressType } from './Address.model';
export { Review, ReviewStatus } from './Review.model';
export { Notification, NotificationType, NotificationChannel, NotificationPriority } from './Notification.model';

// Course Booking
export { Booking } from './Booking.model';
export { CourseSchedule } from './CourseSchedule.model';

// Define associations
export function defineAssociations(): void {
  const { User } = require('./User.model');
  const { Product, Category } = require('./Product.model');
  const { Service, ServiceCategory } = require('./Service.model');
  const { Order, OrderItem } = require('./Order.model');
  const { Cart, CartItem } = require('./Cart.model');
  const { Payment, PaymentMethod, Refund } = require('./Payment.model');
  const { Subscription, SubscriptionPlan } = require('./Subscription.model');
  const { Coupon, CouponUsage } = require('./Coupon.model');
  const { Address } = require('./Address.model');
  const { Review } = require('./Review.model');
  const { Notification } = require('./Notification.model');
  const { AuditLog } = require('./AuditLog.model');
  const { Booking } = require('./Booking.model');
  const { CourseSchedule } = require('./CourseSchedule.model');

  // User associations
  User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
  User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
  User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' });
  User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
  User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
  User.hasMany(PaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
  User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
  User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });

  // Product associations
  Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
  Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });
  Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });

  // Category associations
  Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
  Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
  Category.hasMany(Category, { foreignKey: 'parentId', as: 'children' });

  // Service associations
  Service.belongsTo(ServiceCategory, { foreignKey: 'categoryId', as: 'category' });
  Service.hasMany(OrderItem, { foreignKey: 'serviceId', as: 'orderItems' });
  Service.hasMany(CartItem, { foreignKey: 'serviceId', as: 'cartItems' });
  Service.hasMany(Review, { foreignKey: 'serviceId', as: 'reviews' });

  // ServiceCategory associations
  ServiceCategory.hasMany(Service, { foreignKey: 'categoryId', as: 'services' });
  ServiceCategory.belongsTo(ServiceCategory, { foreignKey: 'parentId', as: 'parent' });
  ServiceCategory.hasMany(ServiceCategory, { foreignKey: 'parentId', as: 'children' });

  // Order associations
  Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
  Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });

  // OrderItem associations
  OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
  OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  OrderItem.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

  // Cart associations
  Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });

  // CartItem associations
  CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });
  CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  CartItem.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

  // Payment associations
  Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
  Payment.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
  Payment.hasMany(Refund, { foreignKey: 'paymentId', as: 'refunds' });

  // PaymentMethod associations
  PaymentMethod.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  PaymentMethod.hasMany(Payment, { foreignKey: 'paymentMethodId', as: 'payments' });
  PaymentMethod.hasMany(Subscription, { foreignKey: 'paymentMethodId', as: 'subscriptions' });

  // Refund associations
  Refund.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

  // Subscription associations
  Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });
  Subscription.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });

  // SubscriptionPlan associations
  SubscriptionPlan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });

  // Coupon associations
  Coupon.hasMany(CouponUsage, { foreignKey: 'couponId', as: 'usages' });

  // CouponUsage associations
  CouponUsage.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });
  CouponUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  CouponUsage.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  // Address associations
  Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Review associations
  Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  Review.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
  Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // AuditLog associations
  AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Booking associations
  Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
}