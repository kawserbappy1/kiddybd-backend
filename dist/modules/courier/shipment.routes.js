"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentRoutes = void 0;
const express_1 = require("express");
const shipment_controller_1 = require("./shipment.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Routes for Shipment
router.post('/admin/shipments/:orderId/create', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['ORDER_MANAGER', 'ADMIN', 'SUPER_ADMIN']), shipment_controller_1.shipmentController.createShipment);
router.get('/shipments/:id', auth_middleware_1.authenticate, shipment_controller_1.shipmentController.getShipment);
router.post('/webhooks/courier/:provider', shipment_controller_1.shipmentController.handleWebhook);
exports.shipmentRoutes = router;
