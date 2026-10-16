"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerReputationService = exports.CustomerReputationService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
class CustomerReputationService {
    async recalculateReputation(userId) {
        // We count the orders for this user based on status
        const orders = await prisma_service_1.prisma.order.findMany({
            where: { customerId: userId },
            select: { status: true, total: true }
        });
        const totalOrders = orders.length;
        let completedOrders = 0;
        let cancelledOrders = 0;
        let rtoOrders = 0;
        let totalSpent = 0;
        for (const order of orders) {
            if (order.status === client_1.OrderStatus.DELIVERED) {
                completedOrders++;
                totalSpent += Number(order.total);
            }
            else if (order.status === client_1.OrderStatus.CANCELLED) {
                cancelledOrders++;
            }
            else if (order.status === client_1.OrderStatus.RTO) {
                rtoOrders++;
            }
        }
        const deliverySuccessRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        const rtoRate = totalOrders > 0 ? (rtoOrders / totalOrders) * 100 : 0;
        const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
        const upsertData = {
            totalOrders,
            completedOrders,
            cancelledOrders,
            rtoOrders,
            returnedOrders: 0, // Would be updated by returns module
            totalSpent,
            deliverySuccessRate,
            rtoRate,
            cancelRate,
            returnRate: 0,
            lastOrderAt: new Date()
        };
        return prisma_service_1.prisma.customerReputation.upsert({
            where: { userId },
            update: upsertData,
            create: {
                userId,
                ...upsertData
            }
        });
    }
}
exports.CustomerReputationService = CustomerReputationService;
exports.customerReputationService = new CustomerReputationService();
