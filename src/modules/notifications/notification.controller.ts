import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notifications = await notificationService.getUserNotifications(userId);
      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const metrics = await notificationService.getAdminNotificationMetrics(userId);
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const result = await notificationService.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      const result = await notificationService.markAsRead(id, userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
