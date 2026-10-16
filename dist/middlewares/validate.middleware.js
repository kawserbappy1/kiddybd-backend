"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const errors_1 = require("../common/errors");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message
                }));
                next(new errors_1.AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateRequest = validateRequest;
