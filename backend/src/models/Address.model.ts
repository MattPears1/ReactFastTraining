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
  IsUUID
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User.model';

export enum AddressType {
  BILLING = 'billing',
  SHIPPING = 'shipping',
  BOTH = 'both'
}

@Table({
  tableName: 'addresses',
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['isDefault'] }
  ]
})
export class Address extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @Default(AddressType.BOTH)
  @Column(DataType.ENUM(...Object.values(AddressType)))
  type!: AddressType;

  @Column(DataType.STRING(100))
  label?: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  firstName!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  lastName!: string;

  @Column(DataType.STRING(100))
  company?: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  addressLine1!: string;

  @Column(DataType.STRING(255))
  addressLine2?: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  city!: string;

  @Column(DataType.STRING(100))
  state?: string;

  @AllowNull(false)
  @Column(DataType.STRING(20))
  postalCode!: string;

  @AllowNull(false)
  @Column(DataType.STRING(2))
  country!: string;

  @Column(DataType.STRING(20))
  phoneNumber?: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isDefault!: boolean;

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

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get fullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.state,
      this.postalCode,
      this.country
    ].filter(Boolean);
    return parts.join(', ');
  }
}