import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  IsEmail,
  BeforeCreate,
  BeforeUpdate,
  HasMany,
  HasOne,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Index,
  Unique,
  AllowNull,
  IsUUID,
  Scopes,
  DefaultScope
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../interfaces/common.interface';

@DefaultScope(() => ({
  attributes: { exclude: ['password', 'twoFactorSecret'] }
}))
@Scopes(() => ({
  withPassword: {
    attributes: { include: ['password'] }
  },
  active: {
    where: { isActive: true }
  },
  verified: {
    where: { isEmailVerified: true }
  },
  admin: {
    where: { role: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }
  }
}))
@Table({
  tableName: 'users',
  paranoid: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['isActive'] },
    { fields: ['createdAt'] }
  ]
})
export class User extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @IsEmail
  @AllowNull(false)
  @Column(DataType.STRING(255))
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  firstName!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  lastName!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  @Default(UserRole.USER)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  role!: UserRole;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isEmailVerified!: boolean;

  @Column(DataType.STRING)
  emailVerificationToken?: string;

  @Column(DataType.DATE)
  emailVerificationExpires?: Date;

  @Column(DataType.STRING)
  resetPasswordToken?: string;

  @Column(DataType.DATE)
  resetPasswordExpires?: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  twoFactorEnabled!: boolean;

  @Column(DataType.STRING)
  twoFactorSecret?: string;

  @Column(DataType.STRING)
  profilePicture?: string;

  @Column(DataType.STRING(20))
  phoneNumber?: string;

  @Column(DataType.JSONB)
  preferences?: Record<string, any>;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @Column(DataType.DATE)
  lastLoginAt?: Date;

  @Column(DataType.STRING(45))
  lastLoginIp?: string;

  @Column(DataType.INTEGER)
  loginCount?: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  // Associations will be defined after all models are created
  // @HasMany(() => Order)
  // orders?: Order[];

  // @HasMany(() => Payment)
  // payments?: Payment[];

  // @HasOne(() => Cart)
  // cart?: Cart;

  // @BelongsToMany(() => Product, () => Wishlist)
  // wishlistProducts?: Product[];

  // @HasMany(() => Review)
  // reviews?: Review[];

  // @HasMany(() => Address)
  // addresses?: Address[];

  // @HasMany(() => Notification)
  // notifications?: Notification[];

  // @HasMany(() => AuditLog)
  // auditLogs?: AuditLog[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  isSuperAdmin(): boolean {
    return this.role === UserRole.SUPER_ADMIN;
  }
}