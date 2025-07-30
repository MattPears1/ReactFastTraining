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
  BelongsToMany,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Index,
  AllowNull,
  IsUUID,
  Min,
  Scopes,
  DefaultScope,
  BeforeUpdate
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import slug from 'slug';

export enum ServiceType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
  SUBSCRIPTION = 'subscription',
  CONSULTATION = 'consultation'
}

export enum ServiceDuration {
  MINUTES_15 = '15_minutes',
  MINUTES_30 = '30_minutes',
  HOUR_1 = '1_hour',
  HOURS_2 = '2_hours',
  HOURS_4 = '4_hours',
  HOURS_8 = '8_hours',
  CUSTOM = 'custom'
}

@DefaultScope(() => ({
  where: { isActive: true },
  attributes: { exclude: ['deletedAt'] }
}))
@Scopes(() => ({
  withInactive: {},
  featured: {
    where: { isFeatured: true }
  },
  available: {
    where: { isAvailable: true }
  },
  priceRange: (min: number, max: number) => ({
    where: {
      price: {
        [Op.between]: [min, max]
      }
    }
  })
}))
@Table({
  tableName: 'services',
  paranoid: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['serviceType'] },
    { fields: ['categoryId'] },
    { fields: ['price'] },
    { fields: ['isActive'] },
    { fields: ['isFeatured'] },
    { fields: ['createdAt'] },
    { fields: ['name'], type: 'FULLTEXT' },
    { fields: ['description'], type: 'FULLTEXT' }
  ]
})
export class Service extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  slug!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column(DataType.TEXT)
  shortDescription?: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(ServiceType)))
  serviceType!: ServiceType;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  price!: number;

  @Column(DataType.STRING(3))
  currency?: string;

  @Column(DataType.ENUM(...Object.values(ServiceDuration)))
  duration?: ServiceDuration;

  @Column(DataType.INTEGER)
  customDurationMinutes?: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isAvailable!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isFeatured!: boolean;

  @Column(DataType.JSONB)
  images?: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];

  @Column(DataType.JSONB)
  features?: string[];

  @Column(DataType.JSONB)
  deliverables?: {
    name: string;
    description?: string;
  }[];

  @Column(DataType.JSONB)
  requirements?: {
    name: string;
    description?: string;
    isRequired: boolean;
  }[];

  @Column(DataType.INTEGER)
  maxBookingsPerDay?: number;

  @Column(DataType.INTEGER)
  minAdvanceBookingHours?: number;

  @Column(DataType.INTEGER)
  maxAdvanceBookingDays?: number;

  @Column(DataType.JSONB)
  availability?: {
    dayOfWeek: number; // 0-6
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }[];

  @Column(DataType.JSONB)
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Column(DataType.ARRAY(DataType.STRING))
  tags?: string[];

  @ForeignKey(() => ServiceCategory)
  @Column(DataType.UUID)
  categoryId?: string;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  viewCount!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  bookingCount!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.DECIMAL(3, 2))
  averageRating!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  reviewCount!: number;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  // Associations
  // @BelongsTo(() => ServiceCategory)
  // category?: ServiceCategory;

  // @HasMany(() => ServiceBooking)
  // bookings?: ServiceBooking[];

  // @HasMany(() => Review)
  // reviews?: Review[];

  // @BelongsToMany(() => ServicePackage, () => ServicePackageItem)
  // packages?: ServicePackage[];

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: Service) {
    if (instance.changed('name') || !instance.slug) {
      instance.slug = slug(instance.name, { lower: true });
    }
  }

  get primaryImage(): string | undefined {
    if (!this.images || this.images.length === 0) return undefined;
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : this.images[0].url;
  }

  get durationInMinutes(): number {
    if (this.duration === ServiceDuration.CUSTOM && this.customDurationMinutes) {
      return this.customDurationMinutes;
    }
    const durationMap: Record<ServiceDuration, number> = {
      [ServiceDuration.MINUTES_15]: 15,
      [ServiceDuration.MINUTES_30]: 30,
      [ServiceDuration.HOUR_1]: 60,
      [ServiceDuration.HOURS_2]: 120,
      [ServiceDuration.HOURS_4]: 240,
      [ServiceDuration.HOURS_8]: 480,
      [ServiceDuration.CUSTOM]: 0
    };
    return durationMap[this.duration || ServiceDuration.HOUR_1];
  }
}

// ServiceCategory model
@Table({
  tableName: 'service_categories',
  paranoid: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['parentId'] },
    { fields: ['order'] }
  ]
})
export class ServiceCategory extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  slug!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column(DataType.STRING(255))
  icon?: string;

  @Column(DataType.STRING(255))
  image?: string;

  @ForeignKey(() => ServiceCategory)
  @Column(DataType.UUID)
  parentId?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  order!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  // @BelongsTo(() => ServiceCategory)
  // parent?: ServiceCategory;

  // @HasMany(() => ServiceCategory)
  // children?: ServiceCategory[];

  // @HasMany(() => Service)
  // services?: Service[];

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: ServiceCategory) {
    if (instance.changed('name') || !instance.slug) {
      instance.slug = slug(instance.name, { lower: true });
    }
  }
}