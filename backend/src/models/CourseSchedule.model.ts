import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

interface CourseScheduleAttributes {
  id: number
  courseType: 'EFAW' | 'FAW' | 'PAEDIATRIC' | 'MENTAL_HEALTH'
  courseName: string
  courseDate: Date
  startTime: string
  endTime: string
  venue: 'LEEDS' | 'SHEFFIELD' | 'BRADFORD' | 'ON_SITE' | 'ONLINE'
  venueAddress?: string
  maxParticipants: number
  currentParticipants: number
  pricePerPerson: number
  groupDiscountRate?: number
  isActive: boolean
  instructor?: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

interface CourseScheduleCreationAttributes extends Optional<CourseScheduleAttributes, 'id' | 'createdAt' | 'updatedAt' | 'venueAddress' | 'groupDiscountRate' | 'instructor' | 'description'> {}

export class CourseSchedule extends Model<CourseScheduleAttributes, CourseScheduleCreationAttributes> implements CourseScheduleAttributes {
  public id!: number
  public courseType!: 'EFAW' | 'FAW' | 'PAEDIATRIC' | 'MENTAL_HEALTH'
  public courseName!: string
  public courseDate!: Date
  public startTime!: string
  public endTime!: string
  public venue!: 'LEEDS' | 'SHEFFIELD' | 'BRADFORD' | 'ON_SITE' | 'ONLINE'
  public venueAddress?: string
  public maxParticipants!: number
  public currentParticipants!: number
  public pricePerPerson!: number
  public groupDiscountRate?: number
  public isActive!: boolean
  public instructor?: string
  public description?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // Instance methods
  public get availableSpots(): number {
    return this.maxParticipants - this.currentParticipants
  }

  public get isFullyBooked(): boolean {
    return this.currentParticipants >= this.maxParticipants
  }

  public get isPastDate(): boolean {
    return new Date(this.courseDate) < new Date()
  }

  public canBook(numberOfParticipants: number): boolean {
    return !this.isFullyBooked && 
           !this.isPastDate && 
           this.isActive && 
           this.availableSpots >= numberOfParticipants
  }

  public calculateGroupPrice(numberOfParticipants: number): number {
    if (numberOfParticipants >= 5 && this.groupDiscountRate) {
      return this.pricePerPerson * numberOfParticipants * (1 - this.groupDiscountRate / 100)
    }
    return this.pricePerPerson * numberOfParticipants
  }
}

CourseSchedule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    venue: {
      type: DataTypes.ENUM('LEEDS', 'SHEFFIELD', 'BRADFORD', 'ON_SITE', 'ONLINE'),
      allowNull: false,
    },
    venueAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
      validate: {
        min: 1,
        max: 20,
      },
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    pricePerPerson: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    groupDiscountRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    instructor: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Lex',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CourseSchedule',
    tableName: 'course_schedules',
    timestamps: true,
    indexes: [
      {
        fields: ['courseType'],
      },
      {
        fields: ['courseDate'],
      },
      {
        fields: ['venue'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
)

export default CourseSchedule