"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errors_1 = require("../common/errors");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
// Remove sensitive data from log details
const sanitizeDetails = (details) => {
    return details.map(detail => {
        if (typeof detail === 'object' && detail !== null) {
            const sanitized = { ...detail };
            ['password', 'token', 'otp'].forEach(key => {
                if (key in sanitized)
                    sanitized[key] = '***';
            });
            return sanitized;
        }
        return detail;
    });
};
const errorMiddleware = (err, req, res, _next) => {
    if (err instanceof errors_1.AppError) {
        logger_1.logger.error(`[${err.errorCode}] ${err.message}`, {
            method: req.method,
            path: req.path,
            statusCode: err.statusCode,
            details: sanitizeDetails(err.details)
        });
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: {
                code: err.errorCode,
                details: sanitizeDetails(err.details)
            }
        });
        return;
    }
    // Unhandled errors
    logger_1.logger.error(`[INTERNAL_ERROR] ${err.message}`, {
        stack: env_1.env.NODE_ENV === 'development' ? err.stack : undefined,
        method: req.method,
        path: req.path,
    });
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
            code: 'INTERNAL_ERROR',
            details: env_1.env.NODE_ENV === 'development' ? [err.message] : []
        }
    });
};
exports.errorMiddleware = errorMiddleware;
