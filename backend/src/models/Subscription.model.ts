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
  DeletedAt,
  Index,
  AllowNull,
  IsUUID,
  Min,
  Scopes
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User.model';
import { PaymentMethod } from './Payment.model';
import { PaymentProvider, SubscriptionStatus, PlanInterval } from '../interfaces/payment.interface';

@Scopes(() => ({
  active: {
    where: { status: SubscriptionStatus.ACTIVE }
  },
  expiring: (days: number) => ({
    where: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: {
        [Op.between]: [new Date(), new Date(Date.now() + days * 24 * 60 * 60 * 1000)]
      }
    }
  }),
  byPlan: (planId: string) => ({
    where: { planId }
  })
}))
@Table({
  tableName: 'subscriptions',
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['planId'] },
    { fields: ['status'] },
    { fields: ['provider'] },
    { fields: ['providerSubscriptionId'] },
    { fields: ['currentPeriodEnd'] }
  ]
})
export class Subscription extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @ForeignKey(() => SubscriptionPlan)
  @AllowNull(false)
  @Column(DataType.UUID)
  planId!: string;

  @Default(SubscriptionStatus.INCOMPLETE)
  @Column(DataType.ENUM(...Object.values(SubscriptionStatus)))
  status!: SubscriptionStatus;

  @AllowNull(false)
  @Column(DataType.DATE)
  currentPeriodStart!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  currentPeriodEnd!: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  cancelAtPeriodEnd!: boolean;

  @Column(DataType.DATE)
  canceledAt?: Date;

  @Column(DataType.DATE)
  endedAt?: Date;

  @Column(DataType.DATE)
  trialStart?: Date;

  @Column(DataType.DATE)
  trialEnd?: Date;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(PaymentProvider)))
  provider!: PaymentProvider;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  providerSubscriptionId!: string;

  @ForeignKey(() => PaymentMethod)
  @AllowNull(false)
  @Column(DataType.UUID)
  paymentMethodId!: string;

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

  @BelongsTo(() => SubscriptionPlan)
  plan!: SubscriptionPlan;

  @BelongsTo(() => PaymentMethod)
  paymentMethod!: PaymentMethod;

  // @HasMany(() => Invoice)
  // invoices?: Invoice[];

  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  get isTrialing(): boolean {
    return this.status === SubscriptionStatus.TRIALING;
  }

  get daysUntilRenewal(): number {
    if (!this.isActive) return 0;
    const now = new Date();
    const diffTime = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get willRenew(): boolean {
    return this.isActive && !this.cancelAtPeriodEnd;
  }
}

@Table({
  tableName: 'subscription_plans',
  paranoid: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['isActive'] },
    { fields: ['amount'] },
    { fields: ['interval'] }
  ]
})
export class SubscriptionPlan extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  amount!: number;

  @Default('USD')
  @Column(DataType.STRING(3))
  currency!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(PlanInterval)))
  interval!: PlanInterval;

  @Default(1)
  @Min(1)
  @Column(DataType.INTEGER)
  intervalCount!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  trialPeriodDays!: number;

  @Column(DataType.JSONB)
  features!: string[];

  @Column(DataType.JSONB)
  limits?: {
    [key: string]: number;
  };

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isPopular!: boolean;

  @Column(DataType.INTEGER)
  sortOrder?: number;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  // @HasMany(() => Subscription)
  // subscriptions?: Subscription[];

  get displayPrice(): string {
    const intervalText = this.intervalCount > 1 ? `${this.intervalCount} ${this.interval}s` : this.interval;
    return `${this.currency} ${this.amount}/${intervalText}`;
  }

  get monthlyPrice(): number {
    const daysInInterval: Record<PlanInterval, number> = {
      [PlanInterval.DAY]: 1,
      [PlanInterval.WEEK]: 7,
      [PlanInterval.MONTH]: 30,
      [PlanInterval.YEAR]: 365
    };
    
    const days = daysInInterval[this.interval] * this.intervalCount;
    return (this.amount / days) * 30;
  }
}