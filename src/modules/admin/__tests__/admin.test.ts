import { adminRoutes } from '../admin.routes';
import { AdminService } from '../admin.service';
import request from 'supertest';
import express from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../../database/prisma.service';

jest.mock('../admin.service');
jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    auditLog: {
      create: jest.fn().mockResolvedValue({})
    }
  }
}));

const mockAuthenticate = jest.fn();
jest.mock('../../../middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => mockAuthenticate(req, res, next)
}));

const app = express();
app.use(express.json());
app.use('/api/v1/admin', adminRoutes);

describe('Admin Dashboard APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RBAC Validation', () => {
    it('CUSTOMER_SUPPORT cannot access FINANCE_MANAGER routes', async () => {
      mockAuthenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'user-1', role: Role.CUSTOMER_SUPPORT };
        next();
      });

      const response = await request(app).get('/api/v1/admin/payments');
      expect(response.status).toBe(403);
    });

    it('FINANCE_MANAGER can access finance routes', async () => {
      mockAuthenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'user-1', role: Role.FINANCE_MANAGER };
        next();
      });

      (AdminService.prototype.getPayments as jest.Mock).mockResolvedValue({ data: [], meta: {} });

      const response = await request(app).get('/api/v1/admin/payments');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('AuditLog Middleware', () => {
    it('Admin action -> AuditLog created', async () => {
      mockAuthenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'admin-1', role: Role.SUPER_ADMIN };
        next();
      });

      (AdminService.prototype.updateOrderStatus as jest.Mock).mockResolvedValue({ id: 'order-1', status: 'CONFIRMED' });

      const response = await request(app)
        .patch('/api/v1/admin/orders/order-1/status')
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      
      // Since auditlog intercept is async and non-blocking, we just wait a tick
      await new Promise(process.nextTick);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'admin-1',
            action: 'PATCH /orders/:id/status',
            entity: 'Order',
            entityId: 'order-1',
          })
        })
      );
    });
  });
});
