import { prisma } from '../../database/prisma.service';
import { smsQueue, emailQueue } from './queue';
import { AppError } from '../../common/errors';

export class NotificationService {
  async send(userId: string, channel: 'SMS' | 'EMAIL', type: string, title: string, body: string, metadata?: any) {
    const notification = await prisma.notification.create({
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
      await smsQueue.add('sendSms', { notificationId: notification.id }, { jobId: `sms-${notification.id}` }).catch(() => {});
    } else if (channel === 'EMAIL') {
      await emailQueue.add('sendEmail', { notificationId: notification.id }, { jobId: `email-${notification.id}` }).catch(() => {});
    }

    return notification;
  }

  async createInAppNotification(data: {
    userId?: string;
    type: string;
    title: string;
    body: string;
    metadata?: any;
  }) {
    try {
      if (data.userId) {
        return await prisma.notification.create({
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
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SUPPORT', 'CONTENT_MANAGER', 'FINANCE_MANAGER'] },
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      if (admins.length === 0) return null;

      await prisma.notification.createMany({
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
    } catch (err) {
      console.error('[NotificationService] Failed to create in-app notification:', err);
      return null;
    }
  }

  async markAsRead(id: string, userId?: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    
    if (userId && notification.userId !== userId) {
      // If user is admin, allow marking as read
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role === 'CUSTOMER') {
        throw new AppError('Unauthorized access to notification', 403, 'FORBIDDEN');
      }
    }

    return prisma.notification.update({
      where: { id },
      data: {
        status: 'READ',
        readAt: new Date(),
      }
    });
  }

  async markAllAsRead(userId?: string) {
    if (userId) {
      await prisma.notification.updateMany({
        where: {
          userId,
          status: 'UNREAD',
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });
    } else {
      await prisma.notification.updateMany({
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

  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async getAdminNotificationMetrics(userId?: string) {
    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: { in: ['PENDING', 'RISK_REVIEW', 'VERIFICATION_REQUIRED'] },
      },
    });

    const pendingReturnsCount = await prisma.return.count({
      where: {
        status: { in: ['REQUESTED', 'UNDER_REVIEW'] },
      },
    });

    const recentOrders = await prisma.order.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 8,
      include: {
        customer: { select: { name: true, phone: true } },
      },
    });

    const recentReturns = await prisma.return.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 4,
      include: {
        order: { select: { id: true, total: true, orderNumber: true } },
      },
    });

    const userWhere: any = { channel: 'IN_APP' };
    if (userId) {
      userWhere.userId = userId;
    }

    const [dbNotifications, unreadCount, recentAudits] = await Promise.all([
      prisma.notification.findMany({
        where: userWhere,
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: {
          ...userWhere,
          status: 'UNREAD',
        },
      }),
      prisma.auditLog.findMany({
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
      const anyStaffNotifications = await prisma.notification.findMany({
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

export const notificationService = new NotificationService();
