import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
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
  Max,
  Scopes,
  BeforeCreate
} from 'sequelize-typescript';
import { Op, col } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User.model';
import { Order } from './Order.model';

export enum CouponType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage'
}

export enum CouponAppliesTo {
  ALL = 'all',
  PRODUCTS = 'products',
  SERVICES = 'services',
  CATEGORIES = 'categories',
  SPECIFIC_ITEMS = 'specific_items'
}

@Scopes(() => ({
  active: {
    where: {
      isActive: true,
      [Op.or]: [
        { validFrom: { [Op.lte]: new Date() } },
        { validFrom: null }
      ],
      [Op.or]: [
        { validUntil: { [Op.gte]: new Date() } },
        { validUntil: null }
      ]
    }
  },
  valid: {
    where: {
      isActive: true,
      [Op.or]: [
        { usageLimit: null },
        { usageCount: { [Op.lt]: col('usageLimit') } }
      ],
      [Op.or]: [
        { validFrom: { [Op.lte]: new Date() } },
        { validFrom: null }
      ],
      [Op.or]: [
        { validUntil: { [Op.gte]: new Date() } },
        { validUntil: null }
      ]
    }
  }
}))
@Table({
  tableName: 'coupons',
  paranoid: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['type'] },
    { fields: ['isActive'] },
    { fields: ['validFrom'] },
    { fields: ['validUntil'] }
  ]
})
export class Coupon extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  code!: string;

  @Column(DataType.STRING(255))
  description?: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(CouponType)))
  type!: CouponType;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  value!: number;

  @Max(100)
  @Column(DataType.DECIMAL(5, 2))
  maxPercentageDiscount?: number;

  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  minimumPurchaseAmount?: number;

  @Default(CouponAppliesTo.ALL)
  @Column(DataType.ENUM(...Object.values(CouponAppliesTo)))
  appliesTo!: CouponAppliesTo;

  @Column(DataType.JSONB)
  applicableItems?: {
    productIds?: string[];
    serviceIds?: string[];
    categoryIds?: string[];
  };

  @Column(DataType.DATE)
  validFrom?: Date;

  @Column(DataType.DATE)
  validUntil?: Date;

  @Min(0)
  @Column(DataType.INTEGER)
  usageLimit?: number;

  @Min(0)
  @Column(DataType.INTEGER)
  usageLimitPerUser?: number;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  usageCount!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isFirstTimeUserOnly!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isStackable!: boolean;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  // @HasMany(() => CouponUsage)
  // usages?: CouponUsage[];

  @BeforeCreate
  static uppercaseCode(instance: Coupon) {
    instance.code = instance.code.toUpperCase();
  }

  get isValid(): boolean {
    if (!this.isActive) return false;
    
    const now = new Date();
    if (this.validFrom && this.validFrom > now) return false;
    if (this.validUntil && this.validUntil < now) return false;
    if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
    
    return true;
  }

  get isExpired(): boolean {
    return !!this.validUntil && this.validUntil < new Date();
  }

  get remainingUses(): number | null {
    if (!this.usageLimit) return null;
    return Math.max(0, this.usageLimit - this.usageCount);
  }

  calculateDiscount(amount: number): number {
    if (!this.isValid) return 0;
    if (this.minimumPurchaseAmount && amount < this.minimumPurchaseAmount) return 0;

    if (this.type === CouponType.FIXED) {
      return Math.min(this.value, amount);
    } else {
      const percentageDiscount = amount * (this.value / 100);
      if (this.maxPercentageDiscount) {
        return Math.min(percentageDiscount, this.maxPercentageDiscount);
      }
      return percentageDiscount;
    }
  }
}

@Table({
  tableName: 'coupon_usages',
  paranoid: false,
  indexes: [
    { fields: ['couponId'] },
    { fields: ['userId'] },
    { fields: ['orderId'] }
  ]
})
export class CouponUsage extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Coupon)
  @AllowNull(false)
  @Column(DataType.UUID)
  couponId!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @ForeignKey(() => Order)
  @Column(DataType.UUID)
  orderId?: string;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  discountAmount!: number;

  @CreatedAt
  usedAt!: Date;

  // Associations
  // @BelongsTo(() => Coupon)
  // coupon!: Coupon;

  // @BelongsTo(() => User)
  // user!: User;

  // @BelongsTo(() => Order)
  // order?: Order;
}