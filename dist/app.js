"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("./docs/registry");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const health_routes_1 = require("./modules/health/health.routes");
const auth_routes_1 = require("./modules/auth/auth.routes");
const user_routes_1 = require("./modules/users/user.routes");
const catalog_routes_1 = require("./modules/catalog/catalog.routes");
const cart_routes_1 = require("./modules/cart/cart.routes");
const requestLogger_middleware_1 = require("./middlewares/requestLogger.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const order_routes_1 = require("./modules/orders/order.routes");
const verification_routes_1 = require("./modules/verification/verification.routes");
const risk_routes_1 = require("./modules/risk/risk.routes");
const payment_routes_1 = require("./modules/payments/payment.routes");
const webhook_routes_1 = require("./modules/payments/webhook.routes");
const shipment_routes_1 = require("./modules/courier/shipment.routes");
const rto_routes_1 = require("./modules/rto/rto.routes");
const return_routes_1 = require("./modules/returns/return.routes");
const review_routes_1 = require("./modules/reviews/review.routes");
const coupon_routes_1 = require("./modules/coupons/coupon.routes");
const wishlist_routes_1 = require("./modules/wishlist/wishlist.routes");
const notification_routes_1 = require("./modules/notifications/notification.routes");
const admin_routes_1 = require("./modules/admin/admin.routes");
const analytics_routes_1 = require("./modules/analytics/analytics.routes");
const swagger_1 = require("./docs/swagger");
const app = (0, express_1.default)();
exports.app = app;
(0, swagger_1.setupSwagger)(app);
const security_middleware_1 = require("./middlewares/security.middleware");
// Security middlewares
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow server-to-server, curl, Postman or mobile requests without origin
        if (!origin)
            return callback(null, true);
        const allAllowed = [...allowedOrigins, ...defaultAllowedOrigins];
        if (allAllowed.includes(origin) || origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        return callback(null, true); // Fallback allow to avoid unexpected client blocks
    },
    credentials: true,
}));
app.use(security_middleware_1.globalRateLimiter);
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, cookie_parser_1.default)());
app.use(security_middleware_1.xssSanitizer);
// Request logging
app.use(requestLogger_middleware_1.requestLogger);
// Routes
app.use('/health', health_routes_1.healthRouter);
app.use('/api/v1/auth', auth_routes_1.authRoutes);
app.use('/api/v1/users', user_routes_1.userRoutes);
app.use('/api/v1', catalog_routes_1.catalogRoutes);
app.use('/api/v1/cart', cart_routes_1.cartRoutes);
app.use('/api/v1/orders', order_routes_1.orderRoutes);
app.use('/api/v1/orders', verification_routes_1.verificationRoutes);
app.use('/api/v1/payments', payment_routes_1.paymentRoutes);
app.use('/api/v1/webhooks', webhook_routes_1.webhookRoutes);
app.use('/api/v1/admin', admin_routes_1.adminRoutes);
app.use('/api/v1/admin', risk_routes_1.riskAdminRoutes);
app.use('/api/v1/admin/analytics', analytics_routes_1.analyticsRoutes);
app.use('/api/v1', shipment_routes_1.shipmentRoutes);
app.use('/api/v1', rto_routes_1.rtoRoutes);
app.use('/api/v1', return_routes_1.returnRoutes);
app.use('/api/v1', review_routes_1.reviewRoutes);
app.use('/api/v1', coupon_routes_1.couponRoutes);
app.use('/api/v1', wishlist_routes_1.wishlistRoutes);
app.use('/api/v1', notification_routes_1.notificationRoutes);
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to the KiddyBD API',
    });
});
// Global Error Handler
app.use(error_middleware_1.errorMiddleware);
