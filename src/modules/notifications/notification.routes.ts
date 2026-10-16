import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/notifications', notificationController.getNotifications);
router.get('/admin/notifications/metrics', notificationController.getAdminMetrics);
router.post('/admin/notifications/mark-all-read', notificationController.markAllAsRead);
router.post('/notifications/mark-all-read', notificationController.markAllAsRead);
router.patch('/notifications/:id/read', notificationController.markAsRead);

export const notificationRoutes = router;
