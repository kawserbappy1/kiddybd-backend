import { notificationService } from '../notification.service';
import { smsQueue } from '../queue';
import { prisma } from '../../../database/prisma.service';
import { smsWorker } from '../notification.worker';

// Mock prisma and bullmq
jest.mock('../queue', () => ({
  smsQueue: { add: jest.fn() },
  emailQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() }
}));

jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    notification: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() }
  }
}));

describe('NotificationModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NotificationService.send', () => {
    it('should create a notification and queue an SMS job', async () => {
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1', status: 'PENDING' });

      await notificationService.send('user-1', 'SMS', 'OrderCreated', 'Title', 'Body');

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(smsQueue.add).toHaveBeenCalledWith('sendSms', { notificationId: 'notif-1' }, expect.any(Object));
    });
  });

  describe('Dead Letter Queue logic', () => {
    it('should mark notification as FAILED if max retries exceeded', async () => {
      // Simulate emitting a 'failed' event on the worker
      const mockJob = { data: { notificationId: 'notif-failed' }, attemptsMade: 3, opts: { attempts: 3 } };
      
      // Manually trigger the failed event handler for testing
      const failedListeners = smsWorker.listeners('failed');
      if (failedListeners.length > 0) {
        await failedListeners[0](mockJob as any, new Error('Test failure'));
      }

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-failed' },
        data: { status: 'FAILED' }
      });
    });

    it('should NOT mark notification as FAILED if retries remaining', async () => {
      const mockJob = { data: { notificationId: 'notif-failed' }, attemptsMade: 1, opts: { attempts: 3 } };
      
      const failedListeners = smsWorker.listeners('failed');
      if (failedListeners.length > 0) {
        await failedListeners[0](mockJob as any, new Error('Test failure'));
      }

      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });
});
