import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.service';

export const auditLog = (entityName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const originalJson = res.json;
      res.json = function (body: any) {
        const statusCode = res.statusCode;
        const user = (req as any).user;
        const userId = user?.userId || user?.id;

        if (statusCode >= 200 && statusCode < 300 && userId) {
          let action = `${req.method} ${entityName}`;
          if (entityName === 'Order' && req.body?.status) {
            action = `ORDER_STATUS_${req.body.status}`;
          } else if (entityName === 'OrderShipment') {
            const courier = req.body?.courier || req.body?.courierName || 'COURIER';
            action = `DISPATCH_${courier.toUpperCase()}`;
          } else if (entityName === 'Inventory' && req.body?.adjustment !== undefined) {
            action = `STOCK_ADJUSTMENT_${Number(req.body.adjustment) >= 0 ? '+' : ''}${req.body.adjustment}`;
          } else if (entityName === 'Return') {
            if (req.path.includes('/approve')) action = 'RETURN_APPROVED';
            else if (req.path.includes('/reject')) action = 'RETURN_REJECTED';
            else action = 'RETURN_UPDATED';
          } else if (entityName === 'Customer') {
            action = `CUSTOMER_STATUS_${req.body?.status || 'UPDATED'}`;
          } else if (entityName === 'AdminStaff') {
            action = req.method === 'POST'
              ? `CREATE_STAFF_${req.body?.role || 'ADMIN'}`
              : `UPDATE_STAFF_${req.body?.role || 'ROLE'}`;
          }

          let entityId = req.params.id || (body && body.data?.id) || 'unknown';
          if (body?.data?.orderNumber) {
            entityId = `${body.data.orderNumber} (${entityId})`;
          }

          prisma.auditLog.create({
            data: {
              userId,
              action,
              entity: entityName,
              entityId,
              newValue: body?.data || body,
              ip: (req.ip || req.socket.remoteAddress || '127.0.0.1').toString(),
              userAgent: (req.headers['user-agent'] || 'Unknown').toString().slice(0, 255),
            }
          }).catch(err => {
            console.error('[AuditLog Error]', err);
          });
        }

        return originalJson.call(this, body);
      };
    }
    next();
  };
};
