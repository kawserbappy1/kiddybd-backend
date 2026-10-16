import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { OrderStatus, UserStatus } from '@prisma/client';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getOrders(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await this.adminService.getOrderById(req.params.id as string);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as { status: OrderStatus };
      const changedBy = ((req.user as any)?.userId || (req.user as any)?.id) as string;
      const order = await this.adminService.updateOrderStatus(req.params.id as string, status, changedBy);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  };

  assignCourier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courierId, courier, trackingCode } = req.body;
      const courierName = courier || courierId || 'Pathao';
      const shipment = await this.adminService.assignCourier(
        req.params.id as string,
        courierName,
        trackingCode
      );
      res.status(200).json({ success: true, data: shipment });
    } catch (error) {
      next(error);
    }
  };

  getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getCustomers(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await this.adminService.getCustomerById(req.params.id as string);
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  };

  updateCustomerStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as { status: UserStatus };
      const customer = await this.adminService.updateCustomerStatus(req.params.id as string, status);
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  };

  getPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getPayments(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getRefunds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getRefunds(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.adminService.getInventory(req.query);
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  };

  adjustStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { adjustment, reason } = req.body;
      const result = await this.adminService.adjustStock(
        req.params.id as string,
        Number(adjustment) || 0,
        reason
      );
      res.status(200).json({ success: true, data: result, message: 'Stock adjusted successfully' });
    } catch (error) {
      next(error);
    }
  };

  getReturns = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.adminService.getReturns(req.query);
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  };

  approveReturn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refundMethod } = req.body;
      const result = await this.adminService.approveReturn(
        req.params.id as string,
        refundMethod || 'bKash'
      );
      res.status(200).json({ success: true, data: result, message: 'Return approved' });
    } catch (error) {
      next(error);
    }
  };

  rejectReturn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const result = await this.adminService.rejectReturn(
        req.params.id as string,
        reason || 'Policy mismatch'
      );
      res.status(200).json({ success: true, data: result, message: 'Return rejected' });
    } catch (error) {
      next(error);
    }
  };

  getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await this.adminService.getMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  };

  getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.adminService.getAdminUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  };

  createAdminUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, role, password } = req.body;
      const user = await this.adminService.createAdminUser({
        name,
        email,
        phone,
        role,
        password,
      });
      res.status(201).json({ success: true, data: user, message: 'Admin user configured successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateAdminRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, status, password, name, email, phone, avatarUrl } = req.body;
      const user = await this.adminService.updateAdminRole(
        req.params.id as string,
        role,
        status,
        password,
        { name, email, phone, avatarUrl }
      );
      res.status(200).json({ success: true, data: user, message: 'Admin details updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getAuditLogs(req.query as any);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}
