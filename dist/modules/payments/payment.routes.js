"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const router = (0, express_1.Router)();
// Endpoint for initiating payment from client (Supports both Authenticated and Guest checkouts)
router.post('/initiate', payment_controller_1.paymentController.initiatePayment);
// SSLCommerz redirect callback endpoints (SSLCommerz POSTs form data to these)
router.post('/sslcommerz/success', payment_controller_1.paymentController.handleSSLCommerzSuccess);
router.post('/sslcommerz/fail', payment_controller_1.paymentController.handleSSLCommerzFail);
router.post('/sslcommerz/cancel', payment_controller_1.paymentController.handleSSLCommerzCancel);
router.post('/sslcommerz/ipn', payment_controller_1.paymentController.handleSSLCommerzIPN);
// GET fallbacks for manual browser redirects / testing
router.get('/sslcommerz/success', payment_controller_1.paymentController.handleSSLCommerzSuccess);
router.get('/sslcommerz/fail', payment_controller_1.paymentController.handleSSLCommerzFail);
router.get('/sslcommerz/cancel', payment_controller_1.paymentController.handleSSLCommerzCancel);
exports.paymentRoutes = router;
