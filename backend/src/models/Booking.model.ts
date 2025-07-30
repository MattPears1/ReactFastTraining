import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'
import { User } from './User.model'

interface BookingAttributes {
  id: number
  userId?: number
  courseType: 'EFAW' | 'FAW' | 'PAEDIATRIC' | 'MENTAL_HEALTH'
  courseName: string
  courseDate: Date
  courseTime: string
  venue: 'LEEDS' | 'SHEFFIELD' | 'BRADFORD' | 'ON_SITE' | 'ONLINE'
  venueDetails?: string
  numberOfParticipants: number
  totalPrice: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'
  paymentMethod?: 'CARD' | 'BANK_TRANSFER' | 'INVOICE'
  paymentIntentId?: string
  contactName: string
  contactEmail: string
  contactPhone: string
  companyName?: string
  companyAddress?: string
  specialRequirements?: string
  participantDetails?: any
  invoiceNumber?: string
  confirmationCode?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'venueDetails' | 'paymentMethod' | 'paymentIntentId' | 'companyName' | 'companyAddress' | 'specialRequirements' | 'participantDetails' | 'invoiceNumber' | 'confirmationCode' | 'notes'> {}

export class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  public id!: number
  public userId?: number
  public courseType!: 'EFAW' | 'FAW' | 'PAEDIATRIC' | 'MENTAL_HEALTH'
  public courseName!: string
  public courseDate!: Date
  public courseTime!: string
  public venue!: 'LEEDS' | 'SHEFFIELD' | 'BRADFORD' | 'ON_SITE' | 'ONLINE'
  public venueDetails?: string
  public numberOfParticipants!: number
  public totalPrice!: number
  public status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  public paymentStatus!: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'
  public paymentMethod?: 'CARD' | 'BANK_TRANSFER' | 'INVOICE'
  public paymentIntentId?: string
  public contactName!: string
  public contactEmail!: string
  public contactPhone!: string
  public companyName?: string
  public companyAddress?: string
  public specialRequirements?: string
  public participantDetails?: any
  public invoiceNumber?: string
  public confirmationCode?: string
  public notes?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // Association
  public readonly user?: User

  // Instance methods
  public generateConfirmationCode(): string {
    const prefix = this.courseType.substring(0, 3).toUpperCase()
    const date = this.courseDate.toISOString().slice(2, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    this.confirmationCode = `${prefix}-${date}-${random}`
    return this.confirmationCode
  }

  public generateInvoiceNumber(): string {
    const year = new Date().getFullYear()
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
    const sequence = this.id.toString().padStart(5, '0')
    this.invoiceNumber = `INV-${year}${month}-${sequence}`
    return this.invoiceNumber
  }

  public calculateTotalPrice(pricePerPerson: number): number {
    this.totalPrice = pricePerPerson * this.numberOfParticipants
    return this.totalPrice
  }
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    courseType: {
      type: DataTypes.ENUM('EFAW', 'FAW', 'PAEDIATRIC', 'MENTAL_HEALTH'),
      allowNull: false,
    },
    courseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    courseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    courseTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    venue: {
      type: DataTypes.ENUM('LEEDS', 'SHEFFIELD', 'BRADFORD', 'ON_SITE', 'ONLINE'),
      allowNull: false,
    },
    venueDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    numberOfParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 20,
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    paymentMethod: {
      type: DataTypes.ENUM('CARD', 'BANK_TRANSFER', 'INVOICE'),
      allowNull: true,
    },
    paymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    specialRequirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    participantDetails: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    confirmationCode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['courseDate'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['confirmationCode'],
      },
      {
        fields: ['contactEmail'],
      },
    ],
  }
)

// Associations
Booking.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
})

export default Booking