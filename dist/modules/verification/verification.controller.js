"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationController = exports.VerificationController = void 0;
const verification_service_1 = require("./verification.service");
const client_1 = require("@prisma/client");
const errors_1 = require("../../common/errors");
class VerificationController {
    async verifyOrder(req, res, next) {
        try {
            const id = req.params.id;
            const { otp } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new errors_1.AppError('Unauthorized', 401, 'UNAUTHORIZED');
            }
            if (!otp) {
                throw new errors_1.AppError('OTP is required', 400, 'OTP_REQUIRED');
            }
            await verification_service_1.verificationService.verifyOrder(id, userId, otp);
            res.status(200).json({
                success: true,
                message: 'Order verified successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resendVerification(req, res, next) {
        try {
            const id = req.params.id;
            // In a real scenario, type might come from request, but we default to OTP here
            const type = req.body.type || client_1.OrderVerificationType.OTP;
            const { otp } = await verification_service_1.verificationService.createVerification(id, type);
            res.status(200).json({
                success: true,
                message: 'Verification code sent successfully',
                // In production we shouldn't return OTP, but it might be useful for testing envs
                data: process.env.NODE_ENV !== 'production' ? { otp } : undefined
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.VerificationController = VerificationController;
exports.verificationController = new VerificationController();
