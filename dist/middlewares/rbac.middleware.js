"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const errors_1 = require("../common/errors");
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.AppError('Authentication required', 401, 'UNAUTHORIZED'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errors_1.AppError('Insufficient permissions', 403, 'FORBIDDEN'));
        }
        next();
    };
};
exports.authorize = authorize;
