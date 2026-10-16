"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationService = exports.VerificationService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const redis_1 = require("../../config/redis");
const errors_1 = require("../../common/errors");
const client_1 = require("@prisma/client");
class VerificationService {
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async createVerification(orderId, type) {
        const order = await prisma_service_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true }
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }
        if (order.status !== client_1.OrderStatus.VERIFICATION_REQUIRED) {
            throw new errors_1.AppError('Order does not require verification', 400, 'VERIFICATION_NOT_REQUIRED');
        }
        // Check for existing pending verification
        let verification = await prisma_service_1.prisma.orderVerification.findFirst({
            where: { orderId, status: client_1.OrderVerificationStatus.PENDING }
        });
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        if (!verification) {
            verification = await prisma_service_1.prisma.orderVerification.create({
                data: {
                    orderId,
                    type,
                    expiresAt,
                    status: client_1.OrderVerificationStatus.PENDING,
                    attempts: 0
                }
            });
        }
        else {
            // Check cooldown
            const cooldownKey = `kiddybd:otp:order:${orderId}:cooldown`;
            const onCooldown = await redis_1.redis.get(cooldownKey);
            if (onCooldown) {
                throw new errors_1.AppError('Please wait before requesting another OTP', 429, 'RATE_LIMIT_EXCEEDED');
            }
            // Update expiry and type
            verification = await prisma_service_1.prisma.orderVerification.update({
                where: { id: verification.id },
                data: {
                    type,
                    expiresAt,
                    attempts: 0 // Reset attempts on resend
                }
            });
        }
        const otp = this.generateOTP();
        const key = `kiddybd:otp:order:${orderId}`;
        const cooldownKey = `${key}:cooldown`;
        // Store OTP in redis
        await redis_1.redis.set(key, otp, 'EX', 300); // 5 minutes
        await redis_1.redis.set(cooldownKey, '1', 'EX', 60); // 60s cooldown
        // Note: In production, send OTP via SMS/Email to order.customer.phone
        // For tests/development, we return the OTP if needed or we could mock the SMS service
        return { verificationId: verification.id, otp }; // Returning OTP for ease of testing
    }
    async verifyOrder(orderId, userId, submittedOtp) {
        const order = await prisma_service_1.prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }
        if (order.customerId !== userId) {
            throw new errors_1.AppError('Unauthorized', 403, 'UNAUTHORIZED');
        }
        if (order.status !== client_1.OrderStatus.VERIFICATION_REQUIRED) {
            throw new errors_1.AppError('Order is not in verification state', 400, 'INVALID_ORDER_STATE');
        }
        const verification = await prisma_service_1.prisma.orderVerification.findFirst({
            where: { orderId, status: client_1.OrderVerificationStatus.PENDING },
            orderBy: { createdAt: 'desc' }
        });
        if (!verification) {
            throw new errors_1.AppError('No pending verification found', 404, 'VERIFICATION_NOT_FOUND');
        }
        if (verification.expiresAt < new Date()) {
            await prisma_service_1.prisma.orderVerification.update({
                where: { id: verification.id },
                data: { status: client_1.OrderVerificationStatus.EXPIRED }
            });
            throw new errors_1.AppError('Verification expired', 400, 'VERIFICATION_EXPIRED');
        }
        if (verification.attempts >= 5) {
            await prisma_service_1.prisma.orderVerification.update({
                where: { id: verification.id },
                data: { status: client_1.OrderVerificationStatus.FAILED }
            });
            throw new errors_1.AppError('Maximum attempts reached. Please request a new OTP', 429, 'MAX_ATTEMPTS_REACHED');
        }
        // Increment attempts
        await prisma_service_1.prisma.orderVerification.update({
            where: { id: verification.id },
            data: { attempts: { increment: 1 } }
        });
        const key = `kiddybd:otp:order:${orderId}`;
        const storedOtp = await redis_1.redis.get(key);
        if (!storedOtp || storedOtp !== submittedOtp) {
            throw new errors_1.AppError('Invalid OTP', 400, 'INVALID_OTP');
        }
        // Success: Execute transaction
        await prisma_service_1.prisma.$transaction(async (tx) => {
            // Mark verification as verified
            await tx.orderVerification.update({
                where: { id: verification.id },
                data: {
                    status: client_1.OrderVerificationStatus.VERIFIED,
                    verifiedAt: new Date()
                }
            });
            // Update order status to CONFIRMED
            await tx.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.CONFIRMED }
            });
            // Add order history
            await tx.orderStatusHistory.create({
                data: {
                    orderId,
                    fromStatus: client_1.OrderStatus.VERIFICATION_REQUIRED,
                    toStatus: client_1.OrderStatus.CONFIRMED,
                    reason: 'OTP Verified successfully',
                    changedBy: userId
                }
            });
        });
        // Cleanup Redis
        await redis_1.redis.del(key);
        await redis_1.redis.del(`${key}:cooldown`);
    }
}
exports.VerificationService = VerificationService;
exports.verificationService = new VerificationService();
