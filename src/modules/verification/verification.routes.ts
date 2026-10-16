import { Router } from 'express';
import { verificationController } from './verification.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Routes are prefixed with /api/v1/orders in the main router?
// If this router is mounted at /api/v1/orders
router.post(
  '/:id/verify',
  authenticate,
  verificationController.verifyOrder
);

// Resend with rate limit
router.post(
  '/:id/verify/resend',
  authenticate,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 3, message: 'Too many resend requests, please try again later' }), // 3 max per 15 mins
  verificationController.resendVerification
);

export const verificationRoutes = router;
