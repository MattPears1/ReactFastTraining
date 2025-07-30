# Database Documentation - Lex Business Platform

## Overview

The Lex Business Platform uses PostgreSQL as its primary database with Sequelize ORM for database interactions. The schema is designed to support both product and service business models with comprehensive e-commerce functionality.

## Database Architecture

### Technology Stack
- **Database**: PostgreSQL 13+
- **ORM**: Sequelize v6 with TypeScript
- **Caching**: Redis for session management and caching
- **Migrations**: Sequelize CLI for version control

### Design Principles
1. **Normalization**: 3NF (Third Normal Form) for data integrity
2. **Soft Deletes**: Paranoid tables with deletedAt timestamps
3. **UUID Primary Keys**: For better distributed system compatibility
4. **JSONB Fields**: For flexible metadata storage
5. **Comprehensive Indexing**: For optimal query performance

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│    USER     │────<│     ORDER       │>────│  ORDER_ITEM  │
└──────┬──────┘     └────────┬────────┘     └──────┬───────┘
       │                     │                      │
       │                     │                ┌─────┴──────┐
       │                     │                │            │
       │              ┌──────┴───────┐  ┌────▼───┐  ┌────▼────┐
       │              │   PAYMENT    │  │PRODUCT │  │ SERVICE │
       │              └──────┬───────┘  └────┬───┘  └────┬────┘
       │                     │               │            │
       │              ┌──────▼───────┐  ┌────▼───┐  ┌────▼────┐
       │              │   REFUND     │  │CATEGORY│  │SVC_CATEG│
       │              └──────────────┘  └────────┘  └─────────┘
       │
       ├─────────────┬───────────────┬────────────────┬─────────────┐
       │             │               │                │             │
┌──────▼─────┐ ┌─────▼──────┐ ┌─────▼─────┐ ┌───────▼────┐ ┌──────▼─────┐
│   CART     │ │  ADDRESS   │ │  REVIEW   │ │NOTIFICATION│ │ AUDIT_LOG  │
└──────┬─────┘ └────────────┘ └───────────┘ └────────────┘ └────────────┘
       │
┌──────▼─────┐
│ CART_ITEM  │
└────────────┘

Additional Entities:
┌─────────────────┐  ┌──────────────┐  ┌─────────────┐
│ PAYMENT_METHOD  │  │ SUBSCRIPTION │  │   COUPON    │
└─────────────────┘  └──────┬───────┘  └──────┬──────┘
                            │                  │
                     ┌──────▼───────┐  ┌──────▼──────┐
                     │ SUBSCR_PLAN  │  │ COUPON_USE  │
                     └──────────────┘  └─────────────┘
```

## Core Entities

### 1. User Management

#### Users Table
- **Purpose**: Core user authentication and profile data
- **Key Fields**:
  - `id` (UUID): Primary key
  - `email` (unique): User email
  - `role`: Enum (super_admin, admin, moderator, user, guest)
  - `password`: Bcrypt hashed
  - `twoFactorEnabled`: 2FA support
- **Indexes**: email, role, isActive, createdAt
- **Relationships**: Has many orders, payments, addresses, reviews, etc.

### 2. Product Catalog

#### Products Table
- **Purpose**: Physical and digital products
- **Key Fields**:
  - `sku` (unique): Stock keeping unit
  - `slug` (unique): URL-friendly identifier
  - `price`, `compareAtPrice`: Pricing with sale support
  - `stockQuantity`: Inventory tracking
  - `images` (JSONB): Multiple product images
- **Indexes**: slug, sku, categoryId, price, isActive, isFeatured
- **Full-text Search**: name, description

#### Categories Table
- **Purpose**: Hierarchical product categorization
- **Features**: Self-referential for parent-child relationships
- **Indexes**: slug, parentId, order

### 3. Service Management

#### Services Table
- **Purpose**: Service offerings with booking capabilities
- **Key Fields**:
  - `serviceType`: Enum (one_time, recurring, subscription, consultation)
  - `duration`: Predefined or custom duration
  - `availability` (JSONB): Weekly schedule
  - `maxBookingsPerDay`: Capacity management
- **Indexes**: slug, serviceType, categoryId, price

### 4. Order Processing

#### Orders Table
- **Purpose**: Central order management
- **Key Fields**:
  - `orderNumber` (unique): Human-readable identifier
  - `status`: Order lifecycle tracking
  - `paymentStatus`: Payment state
  - `orderType`: product, service, or mixed
- **Indexes**: orderNumber, userId, status, paymentStatus

#### Order Items Table
- **Purpose**: Line items for orders
- **Features**: Polymorphic relationship to products/services
- **Indexes**: orderId, productId, serviceId

### 5. Payment System

#### Payments Table
- **Purpose**: Payment transaction records
- **Providers**: Stripe, PayPal, Square, Razorpay
- **Indexes**: userId, orderId, status, provider, providerPaymentId

#### Payment Methods Table
- **Purpose**: Stored payment methods
- **Types**: card, bank_account, paypal, apple_pay, google_pay, crypto
- **Security**: Only stores tokenized data

#### Refunds Table
- **Purpose**: Refund tracking
- **Relationships**: Belongs to payment

### 6. Subscription Management

#### Subscriptions Table
- **Purpose**: Recurring billing management
- **Features**: Trial periods, pause/resume, cancellation
- **Indexes**: userId, planId, status, currentPeriodEnd

#### Subscription Plans Table
- **Purpose**: Available subscription tiers
- **Features**: Flexible billing intervals, feature lists

### 7. User Features

#### Cart System
- **Tables**: carts, cart_items
- **Features**: Guest cart support, expiration handling

#### Addresses
- **Purpose**: Billing and shipping addresses
- **Types**: billing, shipping, or both

#### Reviews
- **Purpose**: Product and service reviews
- **Features**: Moderation workflow, verified purchase flag
- **Indexes**: Multiple composite indexes for performance

#### Notifications
- **Purpose**: Multi-channel user notifications
- **Channels**: in_app, email, sms, push
- **Features**: Priority levels, expiration

### 8. System Features

#### Audit Logs
- **Purpose**: Security and compliance tracking
- **Features**: Comprehensive action logging
- **Indexes**: userId, action, resource, timestamp

#### Coupons
- **Purpose**: Discount management
- **Types**: Fixed amount or percentage
- **Features**: Usage limits, validity periods

## Performance Optimization

### Indexing Strategy

1. **Primary Indexes**: All UUID primary keys
2. **Unique Indexes**: Email, SKU, slug fields
3. **Foreign Key Indexes**: All relationship fields
4. **Composite Indexes**:
   - `order_items`: (orderId, itemType)
   - `reviews`: (productId, status, rating)
   - `payments`: (userId, status)
   - `notifications`: (userId, isRead, createdAt)

### Query Optimization

1. **Scopes**: Pre-defined query patterns in models
2. **Default Scopes**: Exclude soft-deleted records
3. **Eager Loading**: Defined associations for N+1 prevention
4. **JSONB Indexes**: For frequently queried JSON fields

## Data Flow Diagrams

### Order Creation Flow
```
User → Cart → Checkout → Order → Payment → Inventory Update → Notification
                ↓                    ↓
            Validation          Payment Gateway
                              ↓
                         Success/Failure
```

### Subscription Flow
```
User → Select Plan → Payment Method → Create Subscription → Recurring Billing
                           ↓                    ↓
                     Stripe/PayPal        Webhook Handler
                                                ↓
                                          Update Status
```

## Migration Strategy

### Version Control
- Sequential timestamp-based migrations
- Rollback support for all migrations
- Separate migrations for schema and data

### Migration Files
1. `20250126000001-create-initial-tables.js`: Core user and catalog tables
2. `20250126000002-create-order-payment-tables.js`: Order and payment system
3. `20250126000003-create-user-feature-tables.js`: User features and support
4. `20250126000004-create-subscription-coupon-tables.js`: Subscriptions and promotions

### Running Migrations
```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Rollback all migrations
npx sequelize-cli db:migrate:undo:all
```

## Data Constraints

### Validation Rules

1. **Email**: Valid email format, unique
2. **Prices**: Non-negative decimals (10,2)
3. **Quantities**: Positive integers
4. **Ratings**: Integer between 1-5
5. **Percentages**: 0-100 range

### Business Rules

1. **Orders**: Cannot be deleted, only canceled
2. **Payments**: Immutable after processing
3. **Reviews**: Require moderation before display
4. **Inventory**: Track only if enabled per product

## Security Considerations

### Data Protection

1. **Passwords**: Bcrypt hashed with salt rounds
2. **Payment Data**: No raw card data stored
3. **PII**: Encrypted at rest (database level)
4. **Soft Deletes**: Data retention for compliance

### Access Control

1. **Row-Level Security**: User can only access own data
2. **Role-Based Access**: Admin/moderator privileges
3. **Audit Trail**: All data modifications logged

## Backup and Recovery

### Backup Strategy

1. **Frequency**: Daily automated backups
2. **Retention**: 30-day rolling window
3. **Type**: Full database dumps + WAL archiving
4. **Location**: Off-site storage (S3/Cloud)

### Recovery Procedures

1. **Point-in-Time Recovery**: Using WAL archives
2. **Full Restore**: From daily backups
3. **Partial Restore**: Table-level recovery

## Monitoring and Maintenance

### Key Metrics

1. **Query Performance**: Slow query log analysis
2. **Index Usage**: Regular index statistics review
3. **Table Bloat**: VACUUM and ANALYZE schedules
4. **Connection Pool**: Monitor active connections

### Maintenance Tasks

1. **Weekly**: VACUUM ANALYZE
2. **Monthly**: Index rebuild for fragmented indexes
3. **Quarterly**: Performance review and optimization

## Development Guidelines

### Naming Conventions

1. **Tables**: Plural, snake_case (users, order_items)
2. **Columns**: snake_case (first_name, created_at)
3. **Indexes**: idx_table_column format
4. **Foreign Keys**: fk_table_reference format

### Best Practices

1. Always use migrations for schema changes
2. Test migrations in development first
3. Include both up and down migrations
4. Use transactions for data migrations
5. Document significant schema changes

## Future Considerations

### Scalability

1. **Read Replicas**: For read-heavy operations
2. **Partitioning**: For large tables (orders, audit_logs)
3. **Sharding**: By user_id for horizontal scaling

### Enhancements

1. **Full-Text Search**: PostgreSQL FTS or Elasticsearch
2. **Time-Series Data**: For analytics and metrics
3. **Graph Relationships**: For recommendation engine