"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundService = exports.RefundService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
const client_1 = require("@prisma/client");
class RefundService {
    async processRefund(refundId) {
        const refund = await prisma_service_1.prisma.refund.findUnique({
            where: { id: refundId },
            include: { order: true }
        });
        if (!refund) {
            throw new errors_1.AppError('Refund not found', 404, 'NOT_FOUND');
        }
        if (refund.status === client_1.RefundStatus.COMPLETED) {
            return refund; // Idempotent success
        }
        // Call PaymentProvider.refundPayment()
        // For now, mock the transaction ID.
        const transactionId = 'ref_tx_' + Date.now();
        const updatedRefund = await prisma_service_1.prisma.refund.update({
            where: { id: refundId },
            data: {
                status: client_1.RefundStatus.COMPLETED,
                transactionId,
                processedAt: new Date()
            }
        });
        // Emit RefundCompletedEvent
        return updatedRefund;
    }
}
exports.RefundService = RefundService;
exports.refundService = new RefundService();
