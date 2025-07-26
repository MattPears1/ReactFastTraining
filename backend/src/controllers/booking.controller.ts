import { Request, Response, NextFunction } from 'express'
import { Service } from 'typedi'
import { Op } from 'sequelize'
import { Booking } from '../models/Booking.model'
import { CourseSchedule } from '../models/CourseSchedule.model'
import { EmailService } from '../services/email/email.service'
import { logger } from '../utils/logger'
import sequelize from '../config/database'

@Service()
export class BookingController {
  constructor(private emailService: EmailService) {}

  // Get available course dates
  async getAvailableCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseType, venue, month } = req.query
      
      const where: any = {
        isActive: true,
        courseDate: {
          [Op.gte]: new Date()
        }
      }

      if (courseType) {
        where.courseType = courseType
      }

      if (venue) {
        where.venue = venue
      }

      if (month) {
        const startDate = new Date(month as string)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
        
        where.courseDate = {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      }

      const courses = await CourseSchedule.findAll({
        where,
        order: [['courseDate', 'ASC']],
        attributes: {
          include: [
            [sequelize.literal('max_participants - current_participants'), 'availableSpots']
          ]
        }
      })

      res.json({
        success: true,
        data: courses
      })
    } catch (error) {
      next(error)
    }
  }

  // Create a new booking
  async createBooking(req: Request, res: Response, next: NextFunction) {
    const transaction = await sequelize.transaction()
    
    try {
      const {
        courseScheduleId,
        numberOfParticipants,
        contactName,
        contactEmail,
        contactPhone,
        companyName,
        companyAddress,
        specialRequirements,
        participantDetails
      } = req.body

      // Find the course schedule
      const courseSchedule = await CourseSchedule.findByPk(courseScheduleId, { transaction })
      
      if (!courseSchedule) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Course schedule not found'
        })
      }

      // Check availability
      if (!courseSchedule.canBook(numberOfParticipants)) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: 'Not enough available spots for this course'
        })
      }

      // Calculate price
      const totalPrice = courseSchedule.calculateGroupPrice(numberOfParticipants)

      // Create booking
      const booking = await Booking.create({
        userId: req.user?.id,
        courseType: courseSchedule.courseType,
        courseName: courseSchedule.courseName,
        courseDate: courseSchedule.courseDate,
        courseTime: `${courseSchedule.startTime} - ${courseSchedule.endTime}`,
        venue: courseSchedule.venue,
        venueDetails: courseSchedule.venueAddress,
        numberOfParticipants,
        totalPrice,
        contactName,
        contactEmail,
        contactPhone,
        companyName,
        companyAddress,
        specialRequirements,
        participantDetails
      }, { transaction })

      // Generate confirmation code
      await booking.generateConfirmationCode()
      await booking.save({ transaction })

      // Update course schedule participant count
      courseSchedule.currentParticipants += numberOfParticipants
      await courseSchedule.save({ transaction })

      // Commit transaction
      await transaction.commit()

      // Send confirmation emails
      try {
        // Email to customer
        await this.emailService.send({
          to: contactEmail,
          subject: `Booking Confirmation - ${courseName} on ${new Date(courseSchedule.courseDate).toLocaleDateString('en-GB')}`,
          template: 'booking-confirmation',
          data: {
            booking,
            courseSchedule,
            confirmationCode: booking.confirmationCode
          }
        })

        // Email to admin
        await this.emailService.send({
          to: process.env.ADMIN_EMAIL || 'info@reactfasttraining.co.uk',
          subject: `New Booking - ${courseName} on ${new Date(courseSchedule.courseDate).toLocaleDateString('en-GB')}`,
          template: 'booking-notification-admin',
          data: {
            booking,
            courseSchedule
          }
        })
      } catch (emailError) {
        logger.error('Failed to send booking confirmation emails', emailError)
      }

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          bookingId: booking.id,
          confirmationCode: booking.confirmationCode,
          totalPrice: booking.totalPrice
        }
      })
    } catch (error) {
      await transaction.rollback()
      next(error)
    }
  }

  // Get booking by confirmation code
  async getBookingByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params

      const booking = await Booking.findOne({
        where: { confirmationCode: code },
        include: ['user']
      })

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        })
      }

      res.json({
        success: true,
        data: booking
      })
    } catch (error) {
      next(error)
    }
  }

  // Get user's bookings
  async getUserBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const { status } = req.query

      const where: any = { userId }
      if (status) {
        where.status = status
      }

      const bookings = await Booking.findAll({
        where,
        order: [['courseDate', 'DESC']]
      })

      res.json({
        success: true,
        data: bookings
      })
    } catch (error) {
      next(error)
    }
  }

  // Cancel booking
  async cancelBooking(req: Request, res: Response, next: NextFunction) {
    const transaction = await sequelize.transaction()
    
    try {
      const { id } = req.params
      const { reason } = req.body

      const booking = await Booking.findByPk(id, { transaction })
      
      if (!booking) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        })
      }

      // Check if user owns the booking
      if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
        await transaction.rollback()
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to cancel this booking'
        })
      }

      // Check if booking can be cancelled (e.g., 48 hours before course)
      const courseDate = new Date(booking.courseDate)
      const now = new Date()
      const hoursDiff = (courseDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff < 48) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel booking less than 48 hours before the course'
        })
      }

      // Update booking status
      booking.status = 'CANCELLED'
      booking.notes = `Cancelled by user: ${reason}`
      await booking.save({ transaction })

      // Update course schedule participant count
      const courseSchedule = await CourseSchedule.findOne({
        where: {
          courseType: booking.courseType,
          courseDate: booking.courseDate,
          venue: booking.venue
        },
        transaction
      })

      if (courseSchedule) {
        courseSchedule.currentParticipants = Math.max(0, courseSchedule.currentParticipants - booking.numberOfParticipants)
        await courseSchedule.save({ transaction })
      }

      await transaction.commit()

      // Send cancellation email
      try {
        await this.emailService.send({
          to: booking.contactEmail,
          subject: 'Booking Cancellation Confirmation',
          template: 'booking-cancellation',
          data: {
            booking,
            reason
          }
        })
      } catch (emailError) {
        logger.error('Failed to send cancellation email', emailError)
      }

      res.json({
        success: true,
        message: 'Booking cancelled successfully'
      })
    } catch (error) {
      await transaction.rollback()
      next(error)
    }
  }
}

export const bookingController = new BookingController(new EmailService())