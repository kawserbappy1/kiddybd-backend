import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';
import {
  sendPhoneOTPSchema,
  verifyPhoneOTPSchema,
  sendEmailOTPSchema,
  verifyEmailOTPSchema,
  adminLoginSchema,
  firebasePhoneLoginSchema,
} from './auth.validation';

const router = Router();
const authController = new AuthController();

// Rate limiters
const phoneOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { success: false, error: { message: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});

const emailOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { success: false, error: { message: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});

const adminLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: { message: 'Too many attempts, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});

// Phone OTP routes
router.post('/phone/send-otp', phoneOtpLimiter, validateRequest(sendPhoneOTPSchema), authController.sendPhoneOTP);
router.post('/phone/verify-otp', validateRequest(verifyPhoneOTPSchema), authController.verifyPhoneOTP);
router.post('/phone/firebase-login', validateRequest(firebasePhoneLoginSchema), authController.loginWithFirebasePhone);


// Email OTP routes
router.post('/email/send-otp', emailOtpLimiter, validateRequest(sendEmailOTPSchema), authController.sendEmailOTP);
router.post('/email/verify-otp', validateRequest(verifyEmailOTPSchema), authController.verifyEmailOTP);

// Google OAuth routes
router.get('/google', authController.getGoogleAuthUrl);
router.get('/google/callback', authController.handleGoogleCallback);

// Admin Login
router.post('/admin/login', adminLoginLimiter, validateRequest(adminLoginSchema), authController.adminLogin);

// Session routes
router.get('/me', authenticate, authController.getMe);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

export { router as authRoutes };
