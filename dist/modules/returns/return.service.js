"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnService = exports.ReturnService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
const client_1 = require("@prisma/client");
const notification_service_1 = require("../notifications/notification.service");
class ReturnService {
    async createReturn(userId, dto) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.orderId);
        const orderWhere = isUuid
            ? {
                OR: [
                    { id: dto.orderId },
                    { orderNumber: dto.orderId },
                ],
            }
            : { orderNumber: dto.orderId };
        const order = await prisma_service_1.prisma.order.findFirst({
            where: orderWhere,
            include: { items: true, customer: true },
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, 'NOT_FOUND');
        }
        const customerId = userId || order.customerId;
        if (!customerId) {
            throw new errors_1.AppError('Order has no customer attached', 400, 'BAD_REQUEST');
        }
        // Validate item quantities
        for (const itemDto of dto.items) {
            const orderItem = order.items.find((i) => i.id === itemDto.orderItemId || i.skuSnapshot === itemDto.orderItemId);
            if (!orderItem) {
                throw new errors_1.AppError(`Item ${itemDto.orderItemId} not found in order`, 400, 'BAD_REQUEST');
            }
            if (orderItem.returnedQuantity + itemDto.quantity > orderItem.quantity) {
                throw new errors_1.AppError(`Cannot return ${itemDto.quantity} of item ${orderItem.productNameSnapshot}. Total exceeds ordered amount.`, 400, 'BAD_REQUEST');
            }
        }
        const result = await prisma_service_1.prisma.$transaction(async (tx) => {
            const returnRec = await tx.return.create({
                data: {
                    orderId: order.id,
                    customerId,
                    reason: dto.reason,
                    description: dto.description,
                    status: client_1.ReturnStatus.REQUESTED,
                    items: {
                        create: dto.items.map((i) => {
                            const matchedItem = order.items.find((oi) => oi.id === i.orderItemId || oi.skuSnapshot === i.orderItemId);
                            return {
                                orderItemId: matchedItem?.id || i.orderItemId,
                                quantity: i.quantity,
                                reason: i.reason,
                            };
                        }),
                    },
                    evidence: dto.evidence ? {
                        create: dto.evidence.map(e => ({
                            type: e.type,
                            url: e.url
                        }))
                    } : undefined
                },
                include: { items: true, evidence: true }
            });
            return returnRec;
        });
        await notification_service_1.notificationService
            .createInAppNotification({
            type: 'RETURN_REQUESTED',
            title: `Return Requested: #${order.orderNumber || order.id.slice(0, 8).toUpperCase()}`,
            body: `Customer requested return for ${dto.items.length} item(s). Reason: ${dto.reason}`,
            metadata: {
                returnId: result.id,
                orderId: order.id,
                orderNumber: order.orderNumber,
            },
        })
            .catch(() => { });
        return result;
    }
    async approveReturn(returnId, adminId) {
        const returnRec = await prisma_service_1.prisma.return.findUnique({
            where: { id: returnId },
            include: { items: { include: { orderItem: true } } }
        });
        if (!returnRec)
            throw new errors_1.AppError('Return not found', 404, 'NOT_FOUND');
        if (returnRec.status !== client_1.ReturnStatus.REQUESTED && returnRec.status !== client_1.ReturnStatus.UNDER_REVIEW) {
            throw new errors_1.AppError('Return is not in a pending state', 400, 'BAD_REQUEST');
        }
        const result = await prisma_service_1.prisma.$transaction(async (tx) => {
            // 1. Update Return
            const updatedReturn = await tx.return.update({
                where: { id: returnId },
                data: {
                    status: client_1.ReturnStatus.APPROVED,
                    approvedAt: new Date()
                }
            });
            // 2. Update OrderItem.returnedQuantity & calculate total refund amount
            let refundAmount = 0;
            for (const returnItem of returnRec.items) {
                const discountPerUnit = Number(returnItem.orderItem.discount) / returnItem.orderItem.quantity;
                const itemAmount = (Number(returnItem.orderItem.unitPrice) - discountPerUnit) * returnItem.quantity;
                refundAmount += itemAmount;
                await tx.orderItem.update({
                    where: { id: returnItem.orderItemId },
                    data: {
                        returnedQuantity: returnItem.orderItem.returnedQuantity + returnItem.quantity
                    }
                });
            }
            // 3. Insert Refund
            const refund = await tx.refund.create({
                data: {
                    returnId,
                    orderId: returnRec.orderId,
                    amount: refundAmount,
                    method: 'ORIGINAL_PAYMENT',
                    status: client_1.RefundStatus.PENDING,
                    reason: 'Return Approved'
                }
            });
            // 4. Insert OrderStatusHistory
            await tx.orderStatusHistory.create({
                data: {
                    orderId: returnRec.orderId,
                    fromStatus: client_1.OrderStatus.DELIVERED,
                    toStatus: client_1.OrderStatus.DELIVERED,
                    reason: `Return ${returnId} approved`,
                    changedBy: adminId
                }
            });
            return { updatedReturn, refund };
        });
        // TODO: Trigger refund via BullMQ (call RefundService.processRefund async)
        return result;
    }
    async rejectReturn(returnId, adminId, reason) {
        const returnRec = await prisma_service_1.prisma.return.findUnique({
            where: { id: returnId }
        });
        if (!returnRec)
            throw new errors_1.AppError('Return not found', 404, 'NOT_FOUND');
        const updatedReturn = await prisma_service_1.prisma.return.update({
            where: { id: returnId },
            data: { status: client_1.ReturnStatus.REJECTED }
        });
        return updatedReturn;
    }
    async getAllReturns() {
        return prisma_service_1.prisma.return.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getReturnById(id) {
        const r = await prisma_service_1.prisma.return.findUnique({
            where: { id },
            include: { items: true, evidence: true }
        });
        if (!r)
            throw new errors_1.AppError('Not found', 404, 'NOT_FOUND');
        return r;
    }
    async getReturnsByOrder(orderIdentifier) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdentifier);
        const where = isUuid
            ? {
                OR: [
                    { orderId: orderIdentifier },
                    { order: { orderNumber: orderIdentifier } },
                ],
            }
            : { order: { orderNumber: orderIdentifier } };
        return prisma_service_1.prisma.return.findMany({
            where,
            include: {
                items: {
                    include: {
                        orderItem: true,
                    },
                },
                evidence: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
exports.ReturnService = ReturnService;
exports.returnService = new ReturnService();
