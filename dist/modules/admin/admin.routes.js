"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const audit_log_middleware_1 = require("../../middlewares/audit-log.middleware");
const client_1 = require("@prisma/client");
exports.adminRoutes = (0, express_1.Router)();
const controller = new admin_controller_1.AdminController();
// Apply authentication to all admin management routes
exports.adminRoutes.use(auth_middleware_1.authenticate);
// 0. Dashboard Analytics Metrics (All Admin Roles)
exports.adminRoutes.get('/metrics', controller.getMetrics);
// 1. Order Management (ORDER_MANAGER, ADMIN, SUPER_ADMIN)
exports.adminRoutes.get('/orders', (0, rbac_middleware_1.authorize)([client_1.Role.ORDER_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), controller.getOrders);
exports.adminRoutes.get('/orders/:id', (0, rbac_middleware_1.authorize)([client_1.Role.ORDER_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), controller.getOrderById);
exports.adminRoutes.patch('/orders/:id/status', (0, rbac_middleware_1.authorize)([client_1.Role.ORDER_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Order'), controller.updateOrderStatus);
exports.adminRoutes.post('/orders/:id/assign-courier', (0, rbac_middleware_1.authorize)([client_1.Role.ORDER_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('OrderShipment'), controller.assignCourier);
// 2. Inventory Management (INVENTORY_MANAGER, ADMIN, SUPER_ADMIN)
exports.adminRoutes.get('/inventory', (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), controller.getInventory);
exports.adminRoutes.patch('/inventory/:id', (0, rbac_middleware_1.authorize)([client_1.Role.INVENTORY_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Inventory'), controller.adjustStock);
// 3. Customer Management (CUSTOMER_SUPPORT, ADMIN, SUPER_ADMIN)
exports.adminRoutes.get('/customers', (0, rbac_middleware_1.authorize)([client_1.Role.CUSTOMER_SUPPORT, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), controller.getCustomers);
exports.adminRoutes.get('/customers/:id', (0, rbac_middleware_1.authorize)([client_1.Role.CUSTOMER_SUPPORT, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), controller.getCustomerById);
exports.adminRoutes.patch('/customers/:id/status', (0, rbac_middleware_1.authorize)([client_1.Role.CUSTOMER_SUPPORT, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Customer'), controller.updateCustomerStatus);
// 4. Returns & Refunds Management (ORDER_MANAGER, CUSTOMER_SUPPORT, ADMIN, SUPER_ADMIN)
exports.adminRoutes.get('/returns', (0, rbac_middleware_1.authorize)([client_1.Role.ORDER_MANAGER, client_1.Role.CUSTOMER_SUPPORT, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), controller.getReturns);
exports.adminRoutes.post('/returns/:id/approve', (0, rbac_middleware_1.authorize)([client_1.Role.ORDER_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Return'), controller.approveReturn);
exports.adminRoutes.post('/returns/:id/reject', (0, rbac_middleware_1.authorize)([client_1.Role.ORDER_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('Return'), controller.rejectReturn);
// 5. Finance Management (FINANCE_MANAGER, ADMIN, SUPER_ADMIN)
exports.adminRoutes.get('/payments', (0, rbac_middleware_1.authorize)([client_1.Role.FINANCE_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), controller.getPayments);
exports.adminRoutes.get('/refunds', (0, rbac_middleware_1.authorize)([client_1.Role.FINANCE_MANAGER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN]), controller.getRefunds);
// 6. Admin Staff Management & Role Assignments (SUPER_ADMIN ONLY)
exports.adminRoutes.get('/staff', (0, rbac_middleware_1.authorize)([client_1.Role.SUPER_ADMIN]), controller.getAdminUsers);
exports.adminRoutes.post('/staff', (0, rbac_middleware_1.authorize)([client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('AdminStaff'), controller.createAdminUser);
exports.adminRoutes.patch('/staff/:id/role', (0, rbac_middleware_1.authorize)([client_1.Role.SUPER_ADMIN]), (0, audit_log_middleware_1.auditLog)('AdminStaff'), controller.updateAdminRole);
// 7. Audit Log Stream for Super Admin
exports.adminRoutes.get('/audit-logs', (0, rbac_middleware_1.authorize)([client_1.Role.SUPER_ADMIN]), controller.getAuditLogs);
