"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("../../config/redis");
const prisma = new client_1.PrismaClient();
class AnalyticsService {
    async getOrdersAnalytics() {
        const cacheKey = 'analytics:orders';
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.calculateOrdersAnalytics();
        await redis_1.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
        return result;
    }
    async calculateOrdersAnalytics() {
        const total = await prisma.order.count();
        const completed = await prisma.order.count({ where: { status: 'DELIVERED' } });
        const cancelled = await prisma.order.count({ where: { status: 'CANCELLED' } });
        const rto = await prisma.order.count({ where: { status: 'RTO' } });
        const totalRevenueResult = await prisma.order.aggregate({
            _sum: { total: true },
            where: { status: { notIn: ['CANCELLED', 'RTO'] } },
        });
        const totalRevenue = Number(totalRevenueResult._sum.total || 0);
        const aov = total > 0 ? totalRevenue / total : 0;
        const rtoRate = total > 0 ? (rto / total) * 100 : 0;
        return { total, completed, cancelled, rto, rtoRate, aov, totalRevenue };
    }
    async getCustomersAnalytics() {
        const cacheKey = 'analytics:customers';
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.calculateCustomersAnalytics();
        await redis_1.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
        return result;
    }
    async calculateCustomersAnalytics() {
        const total = await prisma.user.count({ where: { role: 'CUSTOMER' } });
        // Repeat customers: users who have > 1 order
        const repeatCustomersResult = await prisma.user.count({
            where: {
                role: 'CUSTOMER',
                orders: {
                /* Prisma doesn't support count filter in where directly for aggregation count without group by easily,
                   so we might need a different approach or just fetch users with at least 2 orders */
                }
            }
        });
        // Alternatively, group by customerId in orders
        const orderCounts = await prisma.order.groupBy({
            by: ['customerId'],
            _count: { id: true },
            having: {
                id: {
                    _count: { gt: 1 }
                }
            }
        });
        const repeat = orderCounts.length;
        const newCustomers = total - repeat;
        const completedOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });
        const shippedOrders = await prisma.order.count({ where: { status: { in: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO'] } } });
        const deliverySuccessRate = shippedOrders > 0 ? (completedOrders / shippedOrders) * 100 : 0;
        return { total, new: newCustomers, repeat, deliverySuccessRate };
    }
    async getProductsAnalytics() {
        const cacheKey = 'analytics:products';
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.calculateProductsAnalytics();
        await redis_1.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
        return result;
    }
    async calculateProductsAnalytics() {
        // Sales, returns, RTO per product
        // For MVP, just get top 10 products
        const items = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true, returnedQuantity: true },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 20
        });
        // We can map these to include product names and RTO
        const productStats = await Promise.all(items.map(async (item) => {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            // Calculate RTO for this product
            // RTO orders containing this product
            const rtoItems = await prisma.orderItem.aggregate({
                where: {
                    productId: item.productId,
                    order: { status: 'RTO' }
                },
                _sum: { quantity: true }
            });
            return {
                productId: item.productId,
                name: product?.name || 'Unknown',
                sales: item._sum.quantity || 0,
                returns: item._sum.returnedQuantity || 0,
                rto: rtoItems._sum.quantity || 0
            };
        }));
        return productStats;
    }
    async getCouriersAnalytics() {
        const cacheKey = 'analytics:couriers';
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.calculateCouriersAnalytics();
        await redis_1.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
        return result;
    }
    async calculateCouriersAnalytics() {
        const couriers = await prisma.courier.findMany();
        const stats = await Promise.all(couriers.map(async (courier) => {
            const totalShipments = await prisma.shipment.count({ where: { courierId: courier.id } });
            const delivered = await prisma.shipment.count({ where: { courierId: courier.id, status: 'DELIVERED' } });
            const returned = await prisma.shipment.count({ where: { courierId: courier.id, status: 'RETURNED' } });
            const deliveryRate = totalShipments > 0 ? (delivered / totalShipments) * 100 : 0;
            const rtoRate = totalShipments > 0 ? (returned / totalShipments) * 100 : 0;
            // Avg delivery time
            const deliveredShipments = await prisma.shipment.findMany({
                where: { courierId: courier.id, status: 'DELIVERED', shippedAt: { not: null }, deliveredAt: { not: null } },
                select: { shippedAt: true, deliveredAt: true }
            });
            let totalDays = 0;
            deliveredShipments.forEach(s => {
                const diff = (s.deliveredAt.getTime() - s.shippedAt.getTime()) / (1000 * 3600 * 24);
                totalDays += diff;
            });
            const avgDeliveryTimeDays = deliveredShipments.length > 0 ? totalDays / deliveredShipments.length : 0;
            return {
                courierId: courier.id,
                name: courier.name,
                totalShipments,
                deliveryRate,
                rtoRate,
                avgDeliveryTimeDays
            };
        }));
        return stats;
    }
    async getSettlementAnalytics() {
        const cacheKey = 'analytics:settlement';
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.calculateSettlementAnalytics();
        await redis_1.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
        return result;
    }
    async calculateSettlementAnalytics() {
        // Expected vs actual COD settlement
        const shipments = await prisma.shipment.aggregate({
            where: {
                status: 'DELIVERED'
            },
            _sum: {
                codAmount: true,
                shippingCost: true
            }
        });
        const expectedCod = shipments._sum.codAmount || 0;
        const shippingCost = shipments._sum.shippingCost || 0;
        const expectedSettlement = Number(expectedCod) - Number(shippingCost);
        // Assuming actual settlement is somewhat tracked via payments or just mocked for MVP if not tracked
        // We can just return the expected for now
        return {
            expectedCod: Number(expectedCod),
            totalShippingCost: Number(shippingCost),
            expectedSettlement,
            actualSettlement: expectedSettlement // Placeholder for MVP
        };
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
