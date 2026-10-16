"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rtoService = exports.RTOService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
const client_1 = require("@prisma/client");
class RTOService {
    async recordRTO(shipmentId, orderId, reason, notes) {
        const order = await prisma_service_1.prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }
        if (order.status === client_1.OrderStatus.RTO) {
            throw new errors_1.AppError('Order already marked as RTO', 400, 'ALREADY_RTO');
        }
        const shipment = await prisma_service_1.prisma.shipment.findUnique({
            where: { id: shipmentId }
        });
        if (!shipment) {
            throw new errors_1.AppError('Shipment not found', 404, 'SHIPMENT_NOT_FOUND');
        }
        const result = await prisma_service_1.prisma.$transaction(async (tx) => {
            // 1. Create RTO record
            const rto = await tx.rTO.create({
                data: {
                    shipmentId,
                    orderId,
                    reason,
                    notes
                }
            });
            // 2. Update Shipment
            await tx.shipment.update({
                where: { id: shipmentId },
                data: {
                    status: client_1.ShipmentStatus.RETURNED,
                    returnedAt: new Date()
                }
            });
            // 3. Update Order
            await tx.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.RTO }
            });
            // 4. Insert OrderStatusHistory
            await tx.orderStatusHistory.create({
                data: {
                    orderId,
                    fromStatus: order.status,
                    toStatus: client_1.OrderStatus.RTO,
                    reason: `RTO recorded: ${reason}`
                }
            });
            // 5. Update CustomerReputation
            const rep = await tx.customerReputation.findUnique({
                where: { userId: order.customerId }
            });
            if (rep) {
                const rtoOrders = rep.rtoOrders + 1;
                const totalOrders = rep.totalOrders;
                const rtoRate = totalOrders > 0 ? (rtoOrders / totalOrders) * 100 : 0;
                await tx.customerReputation.update({
                    where: { userId: order.customerId },
                    data: {
                        rtoOrders,
                        rtoRate
                    }
                });
            }
            return rto;
        });
        // TODO: Emit OrderRTOEvent
        return result;
    }
    async getAllRTOs() {
        return prisma_service_1.prisma.rTO.findMany({
            include: { order: true, shipment: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getRTOByOrderId(orderId) {
        const rto = await prisma_service_1.prisma.rTO.findFirst({
            where: { orderId },
            include: { order: true, shipment: true }
        });
        if (!rto)
            throw new errors_1.AppError('RTO not found', 404, 'NOT_FOUND');
        return rto;
    }
}
exports.RTOService = RTOService;
exports.rtoService = new RTOService();
