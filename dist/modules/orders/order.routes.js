"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const order_schema_1 = require("./order.schema");
const catchAsync_1 = require("../../common/utils/catchAsync");
const idempotency_middleware_1 = require("../../middlewares/idempotency.middleware");
const router = (0, express_1.Router)();
// Public Direct Order Route (Guest checkout with auto-identified user by phone)
router.post('/direct', (0, catchAsync_1.catchAsync)(order_controller_1.orderController.createDirectOrder));
// Public Order Tracking by Order Number
router.get('/track/:orderNumber', (0, catchAsync_1.catchAsync)(order_controller_1.orderController.getOrderByOrderNumber));
router.use(auth_middleware_1.authenticate);
router.post('/', idempotency_middleware_1.idempotencyMiddleware, (0, validate_middleware_1.validateRequest)(order_schema_1.createOrderSchema), (0, catchAsync_1.catchAsync)(order_controller_1.orderController.createOrder));
router.get('/', (0, catchAsync_1.catchAsync)(order_controller_1.orderController.getOrders));
router.get('/:id', (0, catchAsync_1.catchAsync)(order_controller_1.orderController.getOrderById));
router.post('/:id/cancel', (0, catchAsync_1.catchAsync)(order_controller_1.orderController.cancelOrder));
exports.orderRoutes = router;
