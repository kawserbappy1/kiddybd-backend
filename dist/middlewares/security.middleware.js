"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xssSanitizer = exports.authRateLimiter = exports.globalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const xss_1 = __importDefault(require("xss"));
// Global Rate Limiter
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 500 : 5000, // Generous limit for dev / storefront
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for static asset fetches or local development if needed
        return process.env.NODE_ENV !== 'production' && req.ip === '127.0.0.1';
    },
});
// Auth Rate Limiter
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many authentication attempts, please try again later',
});
// Input Sanitization (XSS)
const xssSanitizer = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query && Object.keys(req.query).length > 0) {
        const sanitized = sanitizeObject(req.query);
        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, sanitized);
    }
    if (req.params && Object.keys(req.params).length > 0) {
        const sanitized = sanitizeObject(req.params);
        Object.keys(req.params).forEach(key => delete req.params[key]);
        Object.assign(req.params, sanitized);
    }
    next();
};
exports.xssSanitizer = xssSanitizer;
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    const sanitized = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = (0, xss_1.default)(value);
        }
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};
