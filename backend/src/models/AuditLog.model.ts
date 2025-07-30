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
  Index,
  AllowNull,
  IsUUID
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User.model';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  PERMISSION_CHANGE = 'permission_change',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  API_ACCESS = 'api_access',
  FAILED_LOGIN = 'failed_login',
  SECURITY_ALERT = 'security_alert'
}

@Table({
  tableName: 'audit_logs',
  paranoid: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['resource'] },
    { fields: ['resourceId'] },
    { fields: ['createdAt'] },
    { fields: ['ipAddress'] }
  ]
})
export class AuditLog extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId?: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(AuditAction)))
  action!: AuditAction;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  resource!: string;

  @Column(DataType.UUID)
  resourceId?: string;

  @Column(DataType.JSONB)
  previousValues?: Record<string, any>;

  @Column(DataType.JSONB)
  newValues?: Record<string, any>;

  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @Column(DataType.STRING(45))
  ipAddress?: string;

  @Column(DataType.STRING(255))
  userAgent?: string;

  @Column(DataType.STRING(100))
  sessionId?: string;

  @Column(DataType.TEXT)
  description?: string;

  @CreatedAt
  timestamp!: Date;

  // Associations
  @BelongsTo(() => User)
  user?: User;

  static async logAction(params: {
    userId?: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    description?: string;
  }): Promise<AuditLog> {
    return this.create(params);
  }

  static async logUserAction(
    user: User,
    action: AuditAction,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): Promise<AuditLog> {
    return this.create({
      userId: user.id,
      action,
      resource,
      resourceId,
      metadata
    });
  }
}