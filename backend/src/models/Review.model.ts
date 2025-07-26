import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
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
  Scopes
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User.model';
import { Product } from './Product.model';
import { Service } from './Service.model';
import { Order } from './Order.model';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged'
}

@Scopes(() => ({
  approved: {
    where: { status: ReviewStatus.APPROVED }
  },
  withUser: {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      }
    ]
  },
  verified: {
    where: { isVerifiedPurchase: true }
  }
}))
@Table({
  tableName: 'reviews',
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['productId'] },
    { fields: ['serviceId'] },
    { fields: ['orderId'] },
    { fields: ['status'] },
    { fields: ['rating'] },
    { fields: ['createdAt'] }
  ]
})
export class Review extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @ForeignKey(() => Product)
  @Column(DataType.UUID)
  productId?: string;

  @ForeignKey(() => Service)
  @Column(DataType.UUID)
  serviceId?: string;

  @ForeignKey(() => Order)
  @Column(DataType.UUID)
  orderId?: string;

  @AllowNull(false)
  @Column(DataType.ENUM('product', 'service'))
  reviewType!: 'product' | 'service';

  @AllowNull(false)
  @Min(1)
  @Max(5)
  @Column(DataType.INTEGER)
  rating!: number;

  @Column(DataType.STRING(255))
  title?: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  comment!: string;

  @Column(DataType.JSONB)
  pros?: string[];

  @Column(DataType.JSONB)
  cons?: string[];

  @Column(DataType.JSONB)
  images?: {
    url: string;
    caption?: string;
  }[];

  @Default(ReviewStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ReviewStatus)))
  status!: ReviewStatus;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isVerifiedPurchase!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isFeatured!: boolean;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  helpfulCount!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  notHelpfulCount!: number;

  @Column(DataType.TEXT)
  moderatorNotes?: string;

  @Column(DataType.DATE)
  approvedAt?: Date;

  @Column(DataType.UUID)
  approvedBy?: string;

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

  @BelongsTo(() => Product)
  product?: Product;

  @BelongsTo(() => Service)
  service?: Service;

  @BelongsTo(() => Order)
  order?: Order;

  get helpfulnessScore(): number {
    const total = this.helpfulCount + this.notHelpfulCount;
    if (total === 0) return 0;
    return (this.helpfulCount / total) * 100;
  }

  get isApproved(): boolean {
    return this.status === ReviewStatus.APPROVED;
  }
}