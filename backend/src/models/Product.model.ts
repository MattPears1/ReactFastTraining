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

@DefaultScope(() => ({
  where: { isActive: true },
  attributes: { exclude: ['deletedAt'] }
}))
@Scopes(() => ({
  withInactive: {},
  featured: {
    where: { isFeatured: true }
  },
  inStock: {
    where: { stockQuantity: { [Op.gt]: 0 } }
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
  tableName: 'products',
  paranoid: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['sku'], unique: true },
    { fields: ['categoryId'] },
    { fields: ['price'] },
    { fields: ['isActive'] },
    { fields: ['isFeatured'] },
    { fields: ['createdAt'] },
    { fields: ['name'], type: 'FULLTEXT' },
    { fields: ['description'], type: 'FULLTEXT' }
  ]
})
export class Product extends Model {
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
  @Column(DataType.STRING(100))
  sku!: string;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  price!: number;

  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  compareAtPrice?: number;

  @Min(0)
  @Column(DataType.DECIMAL(10, 2))
  costPrice?: number;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  stockQuantity!: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  trackInventory!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isFeatured!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isDigital!: boolean;

  @Column(DataType.JSONB)
  images?: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];

  @Column(DataType.JSONB)
  attributes?: Record<string, any>;

  @Column(DataType.JSONB)
  variants?: {
    name: string;
    options: string[];
  }[];

  @Column(DataType.JSONB)
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Min(0)
  @Column(DataType.DECIMAL(3, 2))
  weight?: number;

  @Column(DataType.JSONB)
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };

  @Column(DataType.ARRAY(DataType.STRING))
  tags?: string[];

  @ForeignKey(() => Category)
  @Column(DataType.UUID)
  categoryId?: string;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  viewCount!: number;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  salesCount!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  // Associations
  // @BelongsTo(() => Category)
  // category?: Category;

  // @HasMany(() => ProductVariant)
  // productVariants?: ProductVariant[];

  // @HasMany(() => Review)
  // reviews?: Review[];

  // @BelongsToMany(() => Order, () => OrderItem)
  // orders?: Order[];

  // @BelongsToMany(() => User, () => Wishlist)
  // wishlistedBy?: User[];

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: Product) {
    if (instance.changed('name') || !instance.slug) {
      instance.slug = slug(instance.name, { lower: true });
    }
  }

  get isOnSale(): boolean {
    return !!this.compareAtPrice && this.price < this.compareAtPrice;
  }

  get salePercentage(): number {
    if (!this.isOnSale || !this.compareAtPrice) return 0;
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }

  get isInStock(): boolean {
    return !this.trackInventory || this.stockQuantity > 0;
  }

  get primaryImage(): string | undefined {
    if (!this.images || this.images.length === 0) return undefined;
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : this.images[0].url;
  }
}

// Category model referenced above
@Table({
  tableName: 'categories',
  paranoid: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['parentId'] },
    { fields: ['order'] }
  ]
})
export class Category extends Model {
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
  image?: string;

  @ForeignKey(() => Category)
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

  // @BelongsTo(() => Category)
  // parent?: Category;

  // @HasMany(() => Category)
  // children?: Category[];

  // @HasMany(() => Product)
  // products?: Product[];

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: Category) {
    if (instance.changed('name') || !instance.slug) {
      instance.slug = slug(instance.name, { lower: true });
    }
  }
}