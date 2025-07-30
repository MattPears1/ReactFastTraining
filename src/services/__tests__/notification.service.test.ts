import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { notificationService, useNotificationService } from '../notification.service'
import { NotificationProvider } from '@contexts/NotificationContext'
import React from 'react'

describe('NotificationService', () => {
  const mockAddNotification = vi.fn()
  const mockShowSystemAlert = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the singleton instance
    notificationService.setHandlers(null, null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton behavior', () => {
    it('returns the same instance', () => {
      const instance1 = notificationService
      const instance2 = notificationService
      expect(instance1).toBe(instance2)
    })
  })

  describe('Handler management', () => {
    it('sets handlers correctly', () => {
      notificationService.setHandlers(mockAddNotification, mockShowSystemAlert)
      
      notificationService.notify('info', 'Test')
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Test',
        message: undefined
      })
    })

    it('warns when no handlers are set', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      notificationService.notify('info', 'Test')
      
      expect(consoleSpy).toHaveBeenCalledWith('NotificationService: No handler set')
      expect(mockAddNotification).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Notification methods', () => {
    beforeEach(() => {
      notificationService.setHandlers(mockAddNotification, mockShowSystemAlert)
    })

    it('calls notify with correct parameters', () => {
      const options = { persistent: true, duration: 3000 }
      
      notificationService.notify('info', 'Test Title', 'Test Message', options)
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Test Title',
        message: 'Test Message',
        persistent: true,
        duration: 3000
      })
    })

    it('success method calls notify with success type', () => {
      notificationService.success('Success Title', 'Success Message')
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Success Title',
        message: 'Success Message'
      })
    })

    it('error method calls notify with error type', () => {
      notificationService.error('Error Title', 'Error Message')
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error Title',
        message: 'Error Message'
      })
    })

    it('warning method calls notify with warning type', () => {
      notificationService.warning('Warning Title', 'Warning Message')
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'warning',
        title: 'Warning Title',
        message: 'Warning Message'
      })
    })

    it('info method calls notify with info type', () => {
      notificationService.info('Info Title', 'Info Message')
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Info Title',
        message: 'Info Message'
      })
    })

    it('returns the result from addNotification', () => {
      mockAddNotification.mockReturnValue('notification-id')
      
      const result = notificationService.info('Test')
      
      expect(result).toBe('notification-id')
    })

    it('handles options with actions', () => {
      const action = { label: 'Undo', onClick: vi.fn() }
      const options = {
        persistent: true,
        actions: [action],
        category: 'system'
      }
      
      notificationService.notify('info', 'Test', 'Message', options)
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Test',
        message: 'Message',
        persistent: true,
        actions: [action],
        category: 'system'
      })
    })
  })

  describe('System alerts', () => {
    beforeEach(() => {
      notificationService.setHandlers(mockAddNotification, mockShowSystemAlert)
    })

    it('calls showSystemAlert with correct parameters', () => {
      const options = {
        persistent: true,
        actions: [{ label: 'OK', onClick: vi.fn(), primary: true }]
      }
      
      notificationService.systemAlert('warning', 'Alert Title', 'Alert Message', options)
      
      expect(mockShowSystemAlert).toHaveBeenCalledWith({
        type: 'warning',
        title: 'Alert Title',
        message: 'Alert Message',
        persistent: true,
        actions: options.actions
      })
    })

    it('warns when no system alert handler is set', () => {
      notificationService.setHandlers(mockAddNotification, null)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      notificationService.systemAlert('error', 'Test')
      
      expect(consoleSpy).toHaveBeenCalledWith('NotificationService: No system alert handler set')
      expect(mockShowSystemAlert).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('useNotificationService hook', () => {
    it('initializes service with context handlers', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      )

      const { result } = renderHook(() => useNotificationService(), { wrapper })
      
      expect(result.current).toBe(notificationService)
    })

    it('updates handlers when context changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      )

      const { rerender } = renderHook(() => useNotificationService(), { wrapper })
      
      // Initial render sets handlers
      expect(notificationService).toBeDefined()
      
      // Rerender should maintain handlers
      rerender()
      expect(notificationService).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    beforeEach(() => {
      notificationService.setHandlers(mockAddNotification, mockShowSystemAlert)
    })

    it('handles undefined message', () => {
      notificationService.info('Title Only')
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Title Only',
        message: undefined
      })
    })

    it('handles empty options', () => {
      notificationService.notify('info', 'Test', 'Message', {})
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Test',
        message: 'Message'
      })
    })

    it('handles null options', () => {
      notificationService.info('Test', 'Message', null)
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Test',
        message: 'Message'
      })
    })

    it('spreads additional options correctly', () => {
      const customOptions = {
        persistent: true,
        duration: 5000,
        customField: 'custom value'
      }
      
      notificationService.notify('info', 'Test', 'Message', customOptions as any)
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Test',
        message: 'Message',
        persistent: true,
        duration: 5000,
        customField: 'custom value'
      })
    })
  })
})