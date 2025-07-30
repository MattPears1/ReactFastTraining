import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  BeforeCreate,
  HasMany,
  BelongsTo,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Index,
  AllowNull,
  IsUUID,
  Min,
  Scopes,
  DefaultScope
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User.model';
import { Product } from './Product.model';
import { Service } from './Service.model';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

export enum OrderType {
  PRODUCT = 'product',
  SERVICE = 'service',
  MIXED = 'mixed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

@DefaultScope(() => ({
  include: [
    {
      model: OrderItem,
      as: 'items'
    }
  ]
}))
@Scopes(() => ({
  withUser: {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }
    ]
  },
  byStatus: (status: OrderStatus) => ({
    where: { status }
  }),
  dateRange: (startDate: Date, endDate: Date) => ({
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    }
  })
}))
@Table({
  tableName: 'orders',
  paranoid: true,
  indexes: [
    { fields: ['orderNumber'], unique: true },
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['paymentStatus'] },
    { fields: ['createdAt'] },
    { fields: ['orderType'] }
  ]
})
export class Order extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(20))
  orderNumber!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @Default(OrderStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(OrderStatus)))
  status!: OrderStatus;

  @Default(PaymentStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  paymentStatus!: PaymentStatus;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(OrderType)))
  orderType!: OrderType;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  subtotal!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  taxAmount!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  shippingAmount!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  discountAmount!: number;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  totalAmount!: number;

  @Default('USD')
  @Column(DataType.STRING(3))
  currency!: string;

  @Column(DataType.STRING(50))
  couponCode?: string;

  @Column(DataType.JSONB)
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
  };

  @Column(DataType.JSONB)
  billingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
  };

  @Column(DataType.STRING(100))
  paymentMethod?: string;

  @Column(DataType.STRING(255))
  paymentIntentId?: string;

  @Column(DataType.STRING(255))
  transactionId?: string;

  @Column(DataType.TEXT)
  customerNotes?: string;

  @Column(DataType.TEXT)
  internalNotes?: string;

  @Column(DataType.JSONB)
  trackingInfo?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
  };

  @Column(DataType.DATE)
  paidAt?: Date;

  @Column(DataType.DATE)
  shippedAt?: Date;

  @Column(DataType.DATE)
  deliveredAt?: Date;

  @Column(DataType.DATE)
  completedAt?: Date;

  @Column(DataType.DATE)
  canceledAt?: Date;

  @Column(DataType.STRING(255))
  cancelReason?: string;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  // Associations
  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => OrderItem)
  items!: OrderItem[];

  // @HasMany(() => Payment)
  // payments?: Payment[];

  // @HasMany(() => Refund)
  // refunds?: Refund[];

  // @HasMany(() => OrderStatusHistory)
  // statusHistory?: OrderStatusHistory[];

  @BeforeCreate
  static async generateOrderNumber(instance: Order) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    instance.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }

  calculateTotals(): void {
    this.totalAmount = this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount;
  }

  get isPaid(): boolean {
    return this.paymentStatus === PaymentStatus.PAID;
  }

  get canBeCanceled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status);
  }

  get canBeShipped(): boolean {
    return this.status === OrderStatus.PROCESSING && this.isPaid;
  }
}

// OrderItem model
@Table({
  tableName: 'order_items',
  paranoid: false,
  indexes: [
    { fields: ['orderId'] },
    { fields: ['productId'] },
    { fields: ['serviceId'] }
  ]
})
export class OrderItem extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.UUID)
  orderId!: string;

  @ForeignKey(() => Product)
  @Column(DataType.UUID)
  productId?: string;

  @ForeignKey(() => Service)
  @Column(DataType.UUID)
  serviceId?: string;

  @AllowNull(false)
  @Column(DataType.ENUM('product', 'service'))
  itemType!: 'product' | 'service';

  @AllowNull(false)
  @Column(DataType.STRING(255))
  name!: string;

  @Column(DataType.STRING(100))
  sku?: string;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  price!: number;

  @AllowNull(false)
  @Min(1)
  @Column(DataType.INTEGER)
  quantity!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  discountAmount!: number;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  totalAmount!: number;

  @Column(DataType.JSONB)
  productVariant?: {
    name: string;
    value: string;
  }[];

  @Column(DataType.JSONB)
  serviceDetails?: {
    scheduledDate?: Date;
    scheduledTime?: string;
    duration?: number;
    location?: string;
    additionalInfo?: Record<string, any>;
  };

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Order)
  order!: Order;

  @BelongsTo(() => Product)
  product?: Product;

  @BelongsTo(() => Service)
  service?: Service;

  calculateTotal(): void {
    this.totalAmount = (this.price * this.quantity) - this.discountAmount;
  }
}