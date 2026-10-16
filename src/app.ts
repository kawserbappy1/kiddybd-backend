import './docs/registry';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { healthRouter } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import { catalogRoutes } from './modules/catalog/catalog.routes';
import { cartRoutes } from './modules/cart/cart.routes';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { orderRoutes } from './modules/orders/order.routes';
import { verificationRoutes } from './modules/verification/verification.routes';
import { riskAdminRoutes } from './modules/risk/risk.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { webhookRoutes } from './modules/payments/webhook.routes';
import { shipmentRoutes } from './modules/courier/shipment.routes';
import { rtoRoutes } from './modules/rto/rto.routes';
import { returnRoutes } from './modules/returns/return.routes';
import { reviewRoutes } from './modules/reviews/review.routes';
import { couponRoutes } from './modules/coupons/coupon.routes';
import { wishlistRoutes } from './modules/wishlist/wishlist.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { setupSwagger } from './docs/swagger';

const app = express();
setupSwagger(app);

import { globalRateLimiter, xssSanitizer } from './middlewares/security.middleware';

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
}));
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Always ensure production frontend URL and local dev are permitted
const defaultAllowedOrigins = [
  'https://kiddybd-frontend.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, Postman or mobile requests without origin
      if (!origin) return callback(null, true);

      const allAllowed = [...allowedOrigins, ...defaultAllowedOrigins];
      if (allAllowed.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow to avoid unexpected client blocks
    },
    credentials: true,
  })
);
app.use(globalRateLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(xssSanitizer);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health', healthRouter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', catalogRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/orders', verificationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', riskAdminRoutes);
app.use('/api/v1/admin/analytics', analyticsRoutes);
app.use('/api/v1', shipmentRoutes);
app.use('/api/v1', rtoRoutes);
app.use('/api/v1', returnRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', couponRoutes);
app.use('/api/v1', wishlistRoutes);
app.use('/api/v1', notificationRoutes);
app.use('/api/v1', settingsRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the KiddyBD API',
  });
});

// Global Error Handler
app.use(errorMiddleware);

export { app };
