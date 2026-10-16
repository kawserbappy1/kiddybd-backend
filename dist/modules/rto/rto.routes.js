"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rtoRoutes = void 0;
const express_1 = require("express");
const rto_controller_1 = require("./rto.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Routes for ORDER_MANAGER
router.get('/admin/rto', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']), rto_controller_1.rtoController.getAllRTOs);
router.get('/admin/rto/:orderId', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']), rto_controller_1.rtoController.getRTOByOrderId);
exports.rtoRoutes = router;
