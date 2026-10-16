"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const queue_1 = require("./queue");
const errors_1 = require("../../common/errors");
class NotificationService {
    async send(userId, channel, type, title, body, metadata) {
        const notification = await prisma_service_1.prisma.notification.create({
            data: {
                userId,
                channel,
                type,
                title,
                body,
                metadata: metadata || {},
                status: 'PENDING'
            }
        });
        if (channel === 'SMS') {
            await queue_1.smsQueue.add('sendSms', { notificationId: notification.id }, { jobId: `sms-${notification.id}` }).catch(() => { });
        }
        else if (channel === 'EMAIL') {
            await queue_1.emailQueue.add('sendEmail', { notificationId: notification.id }, { jobId: `email-${notification.id}` }).catch(() => { });
        }
        return notification;
    }
    async createInAppNotification(data) {
        try {
            if (data.userId) {
                return await prisma_service_1.prisma.notification.create({
                    data: {
                        userId: data.userId,
                        channel: 'IN_APP',
                        type: data.type,
                        title: data.title,
                        body: data.body,
                        metadata: data.metadata || {},
                        status: 'UNREAD',
                    },
                });
            }
            // Broadcast to active admin staff
            const admins = await prisma_service_1.prisma.user.findMany({
                where: {
                    role: { in: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SUPPORT', 'CONTENT_MANAGER', 'FINANCE_MANAGER'] },
                    status: 'ACTIVE',
                },
                select: { id: true },
            });
            if (admins.length === 0)
                return null;
            await prisma_service_1.prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.id,
                    channel: 'IN_APP',
                    type: data.type,
                    title: data.title,
                    body: data.body,
                    metadata: data.metadata || {},
                    status: 'UNREAD',
                })),
            });
            return true;
        }
        catch (err) {
            console.error('[NotificationService] Failed to create in-app notification:', err);
            return null;
        }
    }
    async markAsRead(id, userId) {
        const notification = await prisma_service_1.prisma.notification.findUnique({ where: { id } });
        if (!notification) {
            throw new errors_1.AppError('Notification not found', 404, 'NOT_FOUND');
        }
        if (userId && notification.userId !== userId) {
            // If user is admin, allow marking as read
            const user = await prisma_service_1.prisma.user.findUnique({ where: { id: userId } });
            if (!user || user.role === 'CUSTOMER') {
                throw new errors_1.AppError('Unauthorized access to notification', 403, 'FORBIDDEN');
            }
        }
        return prisma_service_1.prisma.notification.update({
            where: { id },
            data: {
                status: 'READ',
                readAt: new Date(),
            }
        });
    }
    async markAllAsRead(userId) {
        if (userId) {
            await prisma_service_1.prisma.notification.updateMany({
                where: {
                    userId,
                    status: 'UNREAD',
                },
                data: {
                    status: 'READ',
                    readAt: new Date(),
                },
            });
        }
        else {
            await prisma_service_1.prisma.notification.updateMany({
                where: {
                    channel: 'IN_APP',
                    status: 'UNREAD',
                },
                data: {
                    status: 'READ',
                    readAt: new Date(),
                },
            });
        }
        return { success: true };
    }
    async getUserNotifications(userId) {
        return prisma_service_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }
    async getAdminNotificationMetrics(userId) {
        const pendingOrdersCount = await prisma_service_1.prisma.order.count({
            where: {
                status: { in: ['PENDING', 'RISK_REVIEW', 'VERIFICATION_REQUIRED'] },
            },
        });
        const pendingReturnsCount = await prisma_service_1.prisma.return.count({
            where: {
                status: { in: ['REQUESTED', 'UNDER_REVIEW'] },
            },
        });
        const recentOrders = await prisma_service_1.prisma.order.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 8,
            include: {
                customer: { select: { name: true, phone: true } },
            },
        });
        const recentReturns = await prisma_service_1.prisma.return.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 4,
            include: {
                order: { select: { id: true, total: true, orderNumber: true } },
            },
        });
        const userWhere = { channel: 'IN_APP' };
        if (userId) {
            userWhere.userId = userId;
        }
        const [dbNotifications, unreadCount, recentAudits] = await Promise.all([
            prisma_service_1.prisma.notification.findMany({
                where: userWhere,
                orderBy: { createdAt: 'desc' },
                take: 30,
            }),
            prisma_service_1.prisma.notification.count({
                where: {
                    ...userWhere,
                    status: 'UNREAD',
                },
            }),
            prisma_service_1.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 8,
                include: {
                    user: { select: { name: true, role: true } },
                },
            }),
        ]);
        let finalNotifications = dbNotifications;
        let finalUnreadCount = unreadCount;
        // If no user-specific in-app notifications found, check all in-app notifications
        if (finalNotifications.length === 0) {
            const anyStaffNotifications = await prisma_service_1.prisma.notification.findMany({
                where: { channel: 'IN_APP' },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
            if (anyStaffNotifications.length > 0) {
                finalNotifications = anyStaffNotifications;
                finalUnreadCount = anyStaffNotifications.filter((n) => n.status === 'UNREAD').length;
            }
        }
        // Build unified notifications list
        const notifications = finalNotifications.length > 0
            ? finalNotifications.map((n) => ({
                id: n.id,
                title: n.title,
                body: n.body,
                type: n.type,
                status: n.status,
                readAt: n.readAt ? n.readAt.toISOString() : null,
                createdAt: n.createdAt.toISOString(),
                metadata: n.metadata,
            }))
            : recentAudits.map((a) => ({
                id: a.id,
                title: a.action.replace(/_/g, ' '),
                body: `By ${a.user?.name || 'Staff'} on ${a.entity} ${a.entityId}`,
                type: a.action.startsWith('ORDER')
                    ? 'ORDER_UPDATE'
                    : a.action.startsWith('DISPATCH')
                        ? 'ORDER_SHIPPED'
                        : 'SYSTEM',
                status: 'UNREAD',
                readAt: null,
                createdAt: a.createdAt.toISOString(),
                metadata: { entity: a.entity, entityId: a.entityId },
            }));
        return {
            pendingOrdersCount,
            pendingReturnsCount,
            totalPending: pendingOrdersCount + pendingReturnsCount,
            unreadNotificationsCount: finalUnreadCount,
            totalUnread: finalUnreadCount + pendingOrdersCount + pendingReturnsCount,
            recentOrders: recentOrders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber || o.id.slice(0, 8).toUpperCase(),
                customerName: o.customer?.name || o.customer?.phone || 'Customer',
                total: Number(o.total),
                status: o.status,
                createdAt: o.createdAt.toISOString(),
            })),
            recentReturns: recentReturns.map((r) => ({
                id: r.id,
                orderId: r.orderId,
                orderNumber: r.order?.orderNumber || r.orderId.slice(0, 8).toUpperCase(),
                reason: r.reason,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
            })),
            notifications,
            dbNotifications: notifications,
        };
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
