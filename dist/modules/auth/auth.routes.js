"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
exports.authRoutes = router;
const authController = new auth_controller_1.AuthController();
// Rate limiters
const phoneOtpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: { success: false, error: { message: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});
const emailOtpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: { success: false, error: { message: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});
const adminLoginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, error: { message: 'Too many attempts, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});
// Phone OTP routes
router.post('/phone/send-otp', phoneOtpLimiter, (0, validate_middleware_1.validateRequest)(auth_validation_1.sendPhoneOTPSchema), authController.sendPhoneOTP);
router.post('/phone/verify-otp', (0, validate_middleware_1.validateRequest)(auth_validation_1.verifyPhoneOTPSchema), authController.verifyPhoneOTP);
router.post('/phone/firebase-login', (0, validate_middleware_1.validateRequest)(auth_validation_1.firebasePhoneLoginSchema), authController.loginWithFirebasePhone);
// Email OTP routes
router.post('/email/send-otp', emailOtpLimiter, (0, validate_middleware_1.validateRequest)(auth_validation_1.sendEmailOTPSchema), authController.sendEmailOTP);
router.post('/email/verify-otp', (0, validate_middleware_1.validateRequest)(auth_validation_1.verifyEmailOTPSchema), authController.verifyEmailOTP);
// Google OAuth routes
router.get('/google', authController.getGoogleAuthUrl);
router.get('/google/callback', authController.handleGoogleCallback);
// Admin Login
router.post('/admin/login', adminLoginLimiter, (0, validate_middleware_1.validateRequest)(auth_validation_1.adminLoginSchema), authController.adminLogin);
// Session routes
router.get('/me', auth_middleware_1.authenticate, authController.getMe);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
