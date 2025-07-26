import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  BelongsTo,
  HasMany,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  Index,
  AllowNull,
  IsUUID,
  Min
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User.model';
import { Product } from './Product.model';
import { Service } from './Service.model';

@Table({
  tableName: 'carts',
  paranoid: false,
  indexes: [
    { fields: ['userId'], unique: true },
    { fields: ['sessionId'] },
    { fields: ['expiresAt'] }
  ]
})
export class Cart extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId?: string;

  @Column(DataType.STRING(255))
  sessionId?: string;

  @Default(0)
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

  @Default(0)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  totalAmount!: number;

  @Column(DataType.STRING(50))
  couponCode?: string;

  @Column(DataType.DATE)
  expiresAt?: Date;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => User)
  user?: User;

  @HasMany(() => CartItem)
  items!: CartItem[];

  calculateTotals(): void {
    if (this.items) {
      this.subtotal = this.items.reduce((sum, item) => sum + item.totalAmount, 0);
      this.totalAmount = this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount;
    }
  }

  get itemCount(): number {
    if (!this.items) return 0;
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get isEmpty(): boolean {
    return !this.items || this.items.length === 0;
  }
}

@Table({
  tableName: 'cart_items',
  paranoid: false,
  indexes: [
    { fields: ['cartId'] },
    { fields: ['productId'] },
    { fields: ['serviceId'] }
  ]
})
export class CartItem extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Cart)
  @AllowNull(false)
  @Column(DataType.UUID)
  cartId!: string;

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
  @Min(1)
  @Column(DataType.INTEGER)
  quantity!: number;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  price!: number;

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
    additionalInfo?: Record<string, any>;
  };

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Cart)
  cart!: Cart;

  @BelongsTo(() => Product)
  product?: Product;

  @BelongsTo(() => Service)
  service?: Service;

  calculateTotal(): void {
    this.totalAmount = (this.price * this.quantity) - this.discountAmount;
  }
}