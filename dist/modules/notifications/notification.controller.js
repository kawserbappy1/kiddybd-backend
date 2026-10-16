"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
class NotificationController {
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const notifications = await notification_service_1.notificationService.getUserNotifications(userId);
            res.status(200).json({
                success: true,
                data: notifications
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAdminMetrics(req, res, next) {
        try {
            const userId = req.user?.id;
            const metrics = await notification_service_1.notificationService.getAdminNotificationMetrics(userId);
            res.status(200).json({
                success: true,
                data: metrics,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user?.id;
            const result = await notification_service_1.notificationService.markAllAsRead(userId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const userId = req.user?.id;
            const id = req.params.id;
            const result = await notification_service_1.notificationService.markAsRead(id, userId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
