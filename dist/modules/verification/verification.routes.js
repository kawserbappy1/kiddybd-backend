"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationRoutes = void 0;
const express_1 = require("express");
const verification_controller_1 = require("./verification.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Routes are prefixed with /api/v1/orders in the main router?
// If this router is mounted at /api/v1/orders
router.post('/:id/verify', auth_middleware_1.authenticate, verification_controller_1.verificationController.verifyOrder);
// Resend with rate limit
router.post('/:id/verify/resend', auth_middleware_1.authenticate, (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 3, message: 'Too many resend requests, please try again later' }), // 3 max per 15 mins
verification_controller_1.verificationController.resendVerification);
exports.verificationRoutes = router;
