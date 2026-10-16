"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const token_service_1 = require("../modules/auth/token.service");
const errors_1 = require("../common/errors");
const tokenService = new token_service_1.TokenService();
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new errors_1.AppError('Missing or invalid token format', 401, 'UNAUTHORIZED'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = tokenService.verifyAccessToken(token);
        req.user = {
            ...payload,
            id: payload.userId,
            userId: payload.userId,
        };
        next();
    }
    catch (err) {
        next(new errors_1.AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
    }
};
exports.authenticate = authenticate;
