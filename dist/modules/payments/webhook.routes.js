"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("../payments/payment.controller");
const router = (0, express_1.Router)();
// Webhook endpoint (no auth, signature verified internally)
router.post('/payment/:provider', payment_controller_1.paymentController.handleWebhook);
exports.webhookRoutes = router;
