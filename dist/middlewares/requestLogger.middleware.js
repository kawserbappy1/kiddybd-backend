"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const crypto_1 = require("crypto");
const logger_1 = require("../config/logger");
const requestLogger = (req, res, next) => {
    req.id = req.headers['x-request-id'] || (0, crypto_1.randomUUID)();
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const userId = req.user?.id || 'unauthenticated';
        // Check if error status code
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger_1.logger.log(level, `[${req.method}] ${req.originalUrl}`, {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            userId,
            ip: req.ip
        });
    });
    next();
};
exports.requestLogger = requestLogger;
