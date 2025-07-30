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
import { Order } from './Order.model';
import { PaymentProvider, PaymentStatus, PaymentMethodType } from '../interfaces/payment.interface';

@DefaultScope(() => ({
  attributes: { exclude: ['deletedAt'] }
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
  byStatus: (status: PaymentStatus) => ({
    where: { status }
  }),
  byProvider: (provider: PaymentProvider) => ({
    where: { provider }
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
  tableName: 'payments',
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['orderId'] },
    { fields: ['status'] },
    { fields: ['provider'] },
    { fields: ['providerPaymentId'] },
    { fields: ['createdAt'] }
  ]
})
export class Payment extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @ForeignKey(() => Order)
  @Column(DataType.UUID)
  orderId?: string;

  @AllowNull(false)
  @Min(0.01)
  @Column(DataType.DECIMAL(10, 2))
  amount!: number;

  @Default('USD')
  @Column(DataType.STRING(3))
  currency!: string;

  @Default(PaymentStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  status!: PaymentStatus;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(PaymentProvider)))
  provider!: PaymentProvider;

  @Column(DataType.STRING(255))
  providerPaymentId?: string;

  @ForeignKey(() => PaymentMethod)
  @Column(DataType.UUID)
  paymentMethodId?: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column(DataType.JSONB)
  providerResponse?: Record<string, any>;

  @Column(DataType.TEXT)
  failureReason?: string;

  @Column(DataType.STRING(50))
  failureCode?: string;

  @Default(0)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  refundedAmount!: number;

  @Column(DataType.DATE)
  processedAt?: Date;

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

  @BelongsTo(() => Order)
  order?: Order;

  @BelongsTo(() => PaymentMethod)
  paymentMethod?: PaymentMethod;

  @HasMany(() => Refund)
  refunds?: Refund[];

  get isSuccessful(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }

  get isRefunded(): boolean {
    return this.refundedAmount > 0;
  }

  get isFullyRefunded(): boolean {
    return this.refundedAmount >= this.amount;
  }

  get refundableAmount(): number {
    return this.amount - this.refundedAmount;
  }
}

// PaymentMethod model
@Table({
  tableName: 'payment_methods',
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['provider'] },
    { fields: ['isDefault'] }
  ]
})
export class PaymentMethod extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(PaymentMethodType)))
  type!: PaymentMethodType;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(PaymentProvider)))
  provider!: PaymentProvider;

  @Column(DataType.STRING(4))
  last4?: string;

  @Column(DataType.STRING(50))
  brand?: string;

  @Column(DataType.INTEGER)
  expiryMonth?: number;

  @Column(DataType.INTEGER)
  expiryYear?: number;

  @Column(DataType.STRING(255))
  providerMethodId?: string;

  @Column(DataType.STRING(255))
  fingerprint?: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isDefault!: boolean;

  @Column(DataType.JSONB)
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };

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

  @HasMany(() => Payment)
  payments?: Payment[];

  // @HasMany(() => Subscription)
  // subscriptions?: Subscription[];

  get isExpired(): boolean {
    if (!this.expiryMonth || !this.expiryYear) return false;
    const now = new Date();
    const expiry = new Date(this.expiryYear, this.expiryMonth - 1);
    return expiry < now;
  }

  get displayName(): string {
    if (this.type === PaymentMethodType.CARD && this.brand && this.last4) {
      return `${this.brand} •••• ${this.last4}`;
    }
    return this.type;
  }
}

// Refund model
@Table({
  tableName: 'refunds',
  paranoid: true,
  indexes: [
    { fields: ['paymentId'] },
    { fields: ['status'] },
    { fields: ['provider'] },
    { fields: ['createdAt'] }
  ]
})
export class Refund extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Payment)
  @AllowNull(false)
  @Column(DataType.UUID)
  paymentId!: string;

  @AllowNull(false)
  @Min(0.01)
  @Column(DataType.DECIMAL(10, 2))
  amount!: number;

  @AllowNull(false)
  @Column(DataType.STRING(3))
  currency!: string;

  @Column(DataType.TEXT)
  reason?: string;

  @Default('pending')
  @Column(DataType.ENUM('pending', 'succeeded', 'failed', 'canceled'))
  status!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(PaymentProvider)))
  provider!: PaymentProvider;

  @Column(DataType.STRING(255))
  providerRefundId?: string;

  @Column(DataType.JSONB)
  providerResponse?: Record<string, any>;

  @Column(DataType.TEXT)
  failureReason?: string;

  @Column(DataType.DATE)
  processedAt?: Date;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  // Associations
  @BelongsTo(() => Payment)
  payment!: Payment;

  get isSuccessful(): boolean {
    return this.status === 'succeeded';
  }
}