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
  Index,
  AllowNull,
  IsUUID,
  Scopes
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User.model';

export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELED = 'order_canceled',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  SERVICE_BOOKED = 'service_booked',
  SERVICE_REMINDER = 'service_reminder',
  SERVICE_COMPLETED = 'service_completed',
  REVIEW_REQUEST = 'review_request',
  REVIEW_RESPONSE = 'review_response',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  SECURITY = 'security',
  ACCOUNT = 'account'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Scopes(() => ({
  unread: {
    where: { isRead: false }
  },
  byChannel: (channel: NotificationChannel) => ({
    where: { channels: { [Op.contains]: [channel] } }
  }),
  recent: {
    order: [['createdAt', 'DESC']],
    limit: 50
  }
}))
@Table({
  tableName: 'notifications',
  paranoid: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['isRead'] },
    { fields: ['priority'] },
    { fields: ['createdAt'] }
  ]
})
export class Notification extends Model {
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
  @Column(DataType.ENUM(...Object.values(NotificationType)))
  type!: NotificationType;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  title!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;

  @Column(DataType.JSONB)
  data?: Record<string, any>;

  @Default([NotificationChannel.IN_APP])
  @Column(DataType.ARRAY(DataType.ENUM(...Object.values(NotificationChannel))))
  channels!: NotificationChannel[];

  @Default(NotificationPriority.MEDIUM)
  @Column(DataType.ENUM(...Object.values(NotificationPriority)))
  priority!: NotificationPriority;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isRead!: boolean;

  @Column(DataType.DATE)
  readAt?: Date;

  @Column(DataType.JSONB)
  deliveryStatus?: {
    [key in NotificationChannel]?: {
      sent: boolean;
      sentAt?: Date;
      error?: string;
    };
  };

  @Column(DataType.STRING(255))
  actionUrl?: string;

  @Column(DataType.STRING(100))
  actionText?: string;

  @Column(DataType.STRING(255))
  icon?: string;

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
  user!: User;

  markAsRead(): Promise<void> {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }

  get isExpired(): boolean {
    return !!this.expiresAt && this.expiresAt < new Date();
  }

  static async createForUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      data?: Record<string, any>;
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
      actionUrl?: string;
      actionText?: string;
      icon?: string;
      expiresAt?: Date;
    }
  ): Promise<Notification> {
    return this.create({
      userId,
      type,
      title,
      message,
      ...options
    });
  }
}