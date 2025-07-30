import {
  get,
  post,
  put,
  del,
  param,
  requestBody,
  HttpErrors,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {db} from '../../config/database.config';
import {alerts} from '../../db/schema';
import {eq, desc, and, or} from 'drizzle-orm';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  status: 'read' | 'unread';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  metadata?: any;
}

interface CreateAlertRequest {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: Date;
  metadata?: any;
}

@authenticate('jwt')
@authorize({allowedRoles: ['admin']})
export class AdminAlertsController {
  constructor() {}

  @get('/api/admin/alerts')
  async find(
    @param.query.string('status') status?: 'read' | 'unread',
    @param.query.string('type') type?: string,
    @param.query.string('priority') priority?: string,
  ): Promise<Alert[]> {
    try {
      // For now, return mock data since alerts table might not exist
      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'info',
          title: 'System Update',
          message: 'The system has been updated to the latest version.',
          status: 'unread',
          priority: 'low',
          createdAt: new Date(),
        },
        {
          id: '2',
          type: 'warning',
          title: 'Low Stock Alert',
          message: 'Some course materials are running low on stock.',
          status: 'unread',
          priority: 'medium',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
      ];

      // Filter based on query parameters
      let filtered = mockAlerts;
      
      if (status) {
        filtered = filtered.filter(alert => alert.status === status);
      }
      
      if (type) {
        filtered = filtered.filter(alert => alert.type === type);
      }
      
      if (priority) {
        filtered = filtered.filter(alert => alert.priority === priority);
      }

      return filtered;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw new HttpErrors.InternalServerError('Failed to fetch alerts');
    }
  }

  @get('/api/admin/alerts/{id}')
  async findById(@param.path.string('id') id: string): Promise<Alert> {
    try {
      // Mock implementation
      const mockAlert: Alert = {
        id,
        type: 'info',
        title: 'System Update',
        message: 'The system has been updated to the latest version.',
        status: 'read',
        priority: 'low',
        createdAt: new Date(),
        readAt: new Date(),
      };
      
      return mockAlert;
    } catch (error) {
      console.error('Error fetching alert:', error);
      throw new HttpErrors.NotFound(`Alert with id ${id} not found`);
    }
  }

  @post('/api/admin/alerts')
  async create(
    @requestBody() alertData: CreateAlertRequest,
  ): Promise<Alert> {
    try {
      const newAlert: Alert = {
        id: Date.now().toString(),
        ...alertData,
        status: 'unread',
        priority: alertData.priority || 'medium',
        createdAt: new Date(),
      };
      
      return newAlert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new HttpErrors.InternalServerError('Failed to create alert');
    }
  }

  @put('/api/admin/alerts/{id}/read')
  async markAsRead(@param.path.string('id') id: string): Promise<{success: boolean}> {
    try {
      // Mock implementation
      return {success: true};
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw new HttpErrors.InternalServerError('Failed to mark alert as read');
    }
  }

  @put('/api/admin/alerts/read-all')
  async markAllAsRead(): Promise<{success: boolean; count: number}> {
    try {
      // Mock implementation
      return {success: true, count: 2};
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      throw new HttpErrors.InternalServerError('Failed to mark all alerts as read');
    }
  }

  @del('/api/admin/alerts/{id}')
  async deleteById(@param.path.string('id') id: string): Promise<{success: boolean}> {
    try {
      // Mock implementation
      return {success: true};
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw new HttpErrors.InternalServerError('Failed to delete alert');
    }
  }
}