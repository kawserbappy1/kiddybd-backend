"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Assuming admin role is required for these endpoints
router.use(auth_middleware_1.authenticate);
router.use((0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));
router.get('/orders', analytics_controller_1.analyticsController.getOrders);
router.get('/customers', analytics_controller_1.analyticsController.getCustomers);
router.get('/products', analytics_controller_1.analyticsController.getProducts);
router.get('/couriers', analytics_controller_1.analyticsController.getCouriers);
router.get('/settlement', analytics_controller_1.analyticsController.getSettlement);
exports.analyticsRoutes = router;
