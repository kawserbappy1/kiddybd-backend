import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { auditLog } from '../../middlewares/audit-log.middleware';
import { Role } from '@prisma/client';

export const adminRoutes = Router();
const controller = new AdminController();

// Apply authentication to all admin management routes
adminRoutes.use(authenticate);

// 0. Dashboard Analytics Metrics (All Admin Roles)
adminRoutes.get(
  '/metrics',
  controller.getMetrics
);

// 1. Order Management (ORDER_MANAGER, ADMIN, SUPER_ADMIN)
adminRoutes.get(
  '/orders',
  authorize([Role.ORDER_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  controller.getOrders
);
adminRoutes.get(
  '/orders/:id',
  authorize([Role.ORDER_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  controller.getOrderById
);
adminRoutes.patch(
  '/orders/:id/status',
  authorize([Role.ORDER_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Order'),
  controller.updateOrderStatus
);
adminRoutes.post(
  '/orders/:id/assign-courier',
  authorize([Role.ORDER_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('OrderShipment'),
  controller.assignCourier
);

// 2. Inventory Management (INVENTORY_MANAGER, ADMIN, SUPER_ADMIN)
adminRoutes.get(
  '/inventory',
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  controller.getInventory
);
adminRoutes.patch(
  '/inventory/:id',
  authorize([Role.INVENTORY_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Inventory'),
  controller.adjustStock
);

// 3. Customer Management (CUSTOMER_SUPPORT, ADMIN, SUPER_ADMIN)
adminRoutes.get(
  '/customers',
  authorize([Role.CUSTOMER_SUPPORT, Role.ADMIN, Role.SUPER_ADMIN]),
  controller.getCustomers
);
adminRoutes.get(
  '/customers/:id',
  authorize([Role.CUSTOMER_SUPPORT, Role.ADMIN, Role.SUPER_ADMIN]),
  controller.getCustomerById
);
adminRoutes.patch(
  '/customers/:id/status',
  authorize([Role.CUSTOMER_SUPPORT, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Customer'),
  controller.updateCustomerStatus
);

// 4. Returns & Refunds Management (ORDER_MANAGER, CUSTOMER_SUPPORT, ADMIN, SUPER_ADMIN)
adminRoutes.get(
  '/returns',
  authorize([Role.ORDER_MANAGER, Role.CUSTOMER_SUPPORT, Role.ADMIN, Role.SUPER_ADMIN]),
  controller.getReturns
);
adminRoutes.post(
  '/returns/:id/approve',
  authorize([Role.ORDER_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Return'),
  controller.approveReturn
);
adminRoutes.post(
  '/returns/:id/reject',
  authorize([Role.ORDER_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLog('Return'),
  controller.rejectReturn
);

// 5. Finance Management (FINANCE_MANAGER, ADMIN, SUPER_ADMIN)
adminRoutes.get(
  '/payments',
  authorize([Role.FINANCE_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  controller.getPayments
);
adminRoutes.get(
  '/refunds',
  authorize([Role.FINANCE_MANAGER, Role.ADMIN, Role.SUPER_ADMIN]),
  controller.getRefunds
);

// 6. Admin Staff Management & Role Assignments (SUPER_ADMIN ONLY)
adminRoutes.get(
  '/staff',
  authorize([Role.SUPER_ADMIN]),
  controller.getAdminUsers
);
adminRoutes.post(
  '/staff',
  authorize([Role.SUPER_ADMIN]),
  auditLog('AdminStaff'),
  controller.createAdminUser
);
adminRoutes.patch(
  '/staff/:id/role',
  authorize([Role.SUPER_ADMIN]),
  auditLog('AdminStaff'),
  controller.updateAdminRole
);

// 7. Audit Log Stream for Super Admin
adminRoutes.get(
  '/audit-logs',
  authorize([Role.SUPER_ADMIN]),
  controller.getAuditLogs
);
