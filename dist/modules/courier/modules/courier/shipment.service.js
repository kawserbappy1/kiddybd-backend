"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentService = exports.ShipmentService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
const client_1 = require("@prisma/client");
const mock_provider_1 = require("../../integrations/courier/providers/mock.provider");
const steadfast_provider_1 = require("../../integrations/courier/providers/steadfast.provider");
const pathao_provider_1 = require("../../integrations/courier/providers/pathao.provider");
class ShipmentService {
    getProvider(name) {
        if (name.toLowerCase() === 'steadfast')
            return new steadfast_provider_1.SteadfastProvider();
        if (name.toLowerCase() === 'pathao')
            return new pathao_provider_1.PathaoProvider();
        if (name.toLowerCase() === 'mock')
            return new mock_provider_1.MockCourierProvider();
        return new mock_provider_1.MockCourierProvider(); // Default fallback for now
    }
    async createShipment(orderId, providerName = 'Mock') {
        // 1. Get order details
        const order = await prisma_service_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true }
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }
        if (order.status !== client_1.OrderStatus.CONFIRMED && order.status !== client_1.OrderStatus.PENDING) {
            throw new errors_1.AppError('Order must be CONFIRMED or PENDING to create shipment', 400, 'INVALID_ORDER_STATE');
        }
        // Parse shipping address
        const shippingAddress = order.shippingAddressSnapshot;
        const addressStr = `${shippingAddress.addressLine}, ${shippingAddress.area}, ${shippingAddress.upazila}, ${shippingAddress.district}, ${shippingAddress.division}`;
        // 2. Call provider
        const provider = this.getProvider(providerName);
        const shipmentResponse = await provider.createShipment({
            orderId: order.id,
            customerName: order.customer.name,
            customerPhone: shippingAddress.phone || order.customer.phone || '01700000000',
            customerAddress: addressStr,
            weight: 1, // default weight
            codAmount: Number(order.codAmount)
        });
        // 3. Upsert Courier just in case
        const courier = await prisma_service_1.prisma.courier.upsert({
            where: { code: providerName },
            update: {},
            create: {
                name: providerName,
                code: providerName,
                status: 'ACTIVE'
            }
        });
        // 4. Save shipment and update order in transaction
        const result = await prisma_service_1.prisma.$transaction(async (tx) => {
            const shipment = await tx.shipment.create({
                data: {
                    orderId: order.id,
                    courierId: courier.id,
                    trackingId: shipmentResponse.trackingId,
                    status: client_1.ShipmentStatus.PENDING,
                    weight: 1,
                    codAmount: order.codAmount,
                    shippingCost: shipmentResponse.shippingCost
                }
            });
            await tx.order.update({
                where: { id: order.id },
                data: { status: client_1.OrderStatus.PROCESSING }
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    fromStatus: order.status,
                    toStatus: client_1.OrderStatus.PROCESSING,
                    reason: 'Shipment created'
                }
            });
            return shipment;
        });
        return result;
    }
    async handleCourierWebhook(providerName, payload, signature) {
        const provider = this.getProvider(providerName);
        // 1. Verify and map
        const webhookResult = await provider.handleWebhook(payload, signature);
        if (!webhookResult.isValid) {
            throw new errors_1.AppError('Invalid signature', 401, 'INVALID_SIGNATURE');
        }
        // 2. Find shipment
        const shipment = await prisma_service_1.prisma.shipment.findUnique({
            where: { trackingId: webhookResult.trackingId },
            include: { order: true }
        });
        if (!shipment) {
            throw new errors_1.AppError('Shipment not found', 404, 'SHIPMENT_NOT_FOUND');
        }
        // 3. Idempotency check using ShipmentEvent.externalStatus (or we can use a separate event ID)
        const existingEvent = await prisma_service_1.prisma.shipmentEvent.findFirst({
            where: {
                shipmentId: shipment.id,
                externalStatus: webhookResult.externalEventId // Store eventId in externalStatus for uniqueness or similar logic
            }
        });
        if (existingEvent) {
            return { message: 'Webhook already processed' }; // Idempotent
        }
        // 4. Determine new OrderStatus based on ShipmentStatus
        let newOrderStatus;
        if (webhookResult.status === client_1.ShipmentStatus.PICKED_UP)
            newOrderStatus = client_1.OrderStatus.SHIPPED;
        if (webhookResult.status === client_1.ShipmentStatus.OUT_FOR_DELIVERY)
            newOrderStatus = client_1.OrderStatus.OUT_FOR_DELIVERY;
        if (webhookResult.status === client_1.ShipmentStatus.DELIVERED)
            newOrderStatus = client_1.OrderStatus.DELIVERED;
        if (webhookResult.status === client_1.ShipmentStatus.RETURNED)
            newOrderStatus = client_1.OrderStatus.RTO;
        // 5. Transaction
        await prisma_service_1.prisma.$transaction(async (tx) => {
            await tx.shipmentEvent.create({
                data: {
                    shipmentId: shipment.id,
                    status: webhookResult.status,
                    externalStatus: webhookResult.externalEventId, // Use as unique ID for idempotency here
                    location: webhookResult.location,
                    description: webhookResult.description || webhookResult.externalStatus,
                    occurredAt: webhookResult.occurredAt
                }
            });
            await tx.shipment.update({
                where: { id: shipment.id },
                data: {
                    status: webhookResult.status,
                    ...(webhookResult.status === client_1.ShipmentStatus.DELIVERED ? { deliveredAt: webhookResult.occurredAt } : {}),
                    ...(webhookResult.status === client_1.ShipmentStatus.RETURNED ? { returnedAt: webhookResult.occurredAt } : {})
                }
            });
            if (newOrderStatus && newOrderStatus !== shipment.order.status) {
                await tx.order.update({
                    where: { id: shipment.order.id },
                    data: { status: newOrderStatus }
                });
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: shipment.order.id,
                        fromStatus: shipment.order.status,
                        toStatus: newOrderStatus,
                        reason: `Shipment status updated to ${webhookResult.status}`
                    }
                });
            }
        });
        // TODO: Emit ShipmentEvent (notify customer via BullMQ) - out of scope for pure unit tests
        return { success: true };
    }
    async getShipmentById(id, customerId) {
        const shipment = await prisma_service_1.prisma.shipment.findUnique({
            where: { id },
            include: {
                order: { select: { customerId: true } },
                events: { orderBy: { occurredAt: 'desc' } },
                courier: { select: { name: true } }
            }
        });
        if (!shipment) {
            throw new errors_1.AppError('Shipment not found', 404, 'NOT_FOUND');
        }
        if (shipment.order.customerId !== customerId) {
            throw new errors_1.AppError('Unauthorized access to shipment', 403, 'UNAUTHORIZED');
        }
        return shipment;
    }
}
exports.ShipmentService = ShipmentService;
exports.shipmentService = new ShipmentService();
