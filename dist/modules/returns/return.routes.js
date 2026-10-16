"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnRoutes = void 0;
const express_1 = require("express");
const return_controller_1 = require("./return.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const idempotency_middleware_1 = require("../../middlewares/idempotency.middleware");
const router = (0, express_1.Router)();
// Customer Routes
router.post('/returns', return_controller_1.returnController.createReturn);
router.get('/returns/order/:orderNumber', return_controller_1.returnController.getReturnsByOrder);
// Admin Routes
router.get('/returns', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'CUSTOMER_SUPPORT']), return_controller_1.returnController.getAllReturns);
router.get('/returns/:id', auth_middleware_1.authenticate, return_controller_1.returnController.getReturnById);
// Idempotency check can be added as middleware before controller
router.post('/admin/returns/:id/approve', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']), idempotency_middleware_1.idempotencyMiddleware, return_controller_1.returnController.approveReturn);
router.post('/admin/returns/:id/reject', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']), return_controller_1.returnController.rejectReturn);
exports.returnRoutes = router;
