"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const order_service_1 = require("./order.service");
const payment_service_1 = require("../payments/payment.service");
exports.orderController = {
    async createOrder(req, res) {
        const userId = req.user.id;
        const idempotencyKey = req.headers['idempotency-key'];
        if (!idempotencyKey) {
            return res.status(400).json({ error: 'Idempotency-Key header is required' });
        }
        const dto = req.body;
        const order = await order_service_1.orderService.createOrder(userId, dto, idempotencyKey);
        // If it's a restored response, we might just return it. For now, always 201.
        res.status(201).json({ success: true, data: order });
    },
    async createDirectOrder(req, res) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        const order = await order_service_1.orderService.createDirectOrder(req.body, idempotencyKey);
        const paymentMethod = req.body.paymentMethod || 'COD';
        let gatewayUrl = undefined;
        // If online payment (SSLCommerz, BKASH, NAGAD), initiate payment gateway session
        if (paymentMethod !== 'COD') {
            try {
                const paymentResult = await payment_service_1.paymentService.initiatePayment(order.id, order.customerId, paymentMethod === 'SSLCOMMERZ' ? 'SSLCommerz' : paymentMethod);
                gatewayUrl = paymentResult.redirectUrl;
            }
            catch (paymentErr) {
                console.error('Failed to auto-initiate online payment gateway:', paymentErr);
            }
        }
        res.status(201).json({
            success: true,
            data: {
                id: order.id,
                orderNumber: order.orderNumber,
                subtotal: Number(order.subtotal),
                deliveryFee: Number(order.deliveryCharge),
                discountAmount: Number(order.discount),
                total: Number(order.total),
                paymentMethod: paymentMethod,
                paymentStatus: order.paymentStatus,
                orderStatus: order.status,
                recipientName: order.shippingAddressSnapshot?.fullName || '',
                phone: order.shippingAddressSnapshot?.phone || '',
                deliveryAddress: `${order.shippingAddressSnapshot?.streetAddress || ''}, ${order.shippingAddressSnapshot?.thana || ''}, ${order.shippingAddressSnapshot?.district || ''}`,
                deliveryNotes: order.shippingAddressSnapshot?.deliveryNotes || '',
                createdAt: order.createdAt.toISOString(),
                gatewayUrl,
            },
        });
    },
    async getOrderByOrderNumber(req, res) {
        const orderNumber = req.params.orderNumber;
        const order = await order_service_1.orderService.getOrderByOrderNumber(orderNumber);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const shipping = order.shippingAddressSnapshot;
        res.json({
            success: true,
            data: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentStatus === 'PENDING' ? 'COD' : 'ONLINE',
                recipientName: shipping?.fullName || '',
                phone: shipping?.phone || '',
                deliveryAddress: `${shipping?.streetAddress || ''}, ${shipping?.thana || ''}, ${shipping?.district || ''}`,
                deliveryNotes: shipping?.deliveryNotes || '',
                subtotal: Number(order.subtotal),
                deliveryFee: Number(order.deliveryCharge),
                discountAmount: Number(order.discount),
                total: Number(order.total),
                createdAt: order.createdAt.toISOString(),
                items: order.items.map((it) => ({
                    id: it.id,
                    productId: it.productId,
                    title: it.productNameSnapshot,
                    slug: it.productNameSnapshot.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    price: Number(it.unitPrice),
                    quantity: it.quantity,
                    imageUrl: it.product?.media?.[0]?.url || undefined,
                })),
                courierPartner: {
                    name: order.shipment?.courier?.name || 'Pathao',
                    trackingCode: order.shipment?.trackingId || `PTH-${order.orderNumber.replace(/\D/g, '') || '882910'}`,
                    trackingUrl: order.shipment?.courier?.name?.toLowerCase() === 'pathao'
                        ? `https://pathao.com/courier/tracking?tracking_id=${order.shipment?.trackingId || order.orderNumber}`
                        : order.shipment?.courier?.name?.toLowerCase() === 'redx'
                            ? `https://redx.com.bd/track?tracking_id=${order.shipment?.trackingId || order.orderNumber}`
                            : `https://steadfast.com.bd/t/${order.shipment?.trackingId || order.orderNumber.replace(/\D/g, '') || '882910'}`,
                },
            },
        });
    },
    async getOrders(req, res) {
        const userId = req.user?.userId || req.user?.id;
        const orders = await order_service_1.orderService.getOrders(userId);
        res.json({ success: true, data: orders });
    },
    async getOrderById(req, res) {
        const userId = req.user?.userId || req.user?.id;
        const orderId = req.params.id;
        const order = await order_service_1.orderService.getOrderById(userId, orderId);
        res.json({ success: true, data: order });
    },
    async cancelOrder(req, res) {
        const userId = req.user?.userId || req.user?.id;
        const orderId = req.params.id;
        const result = await order_service_1.orderService.cancelOrder(userId, orderId);
        res.json({ success: true, data: result });
    }
};
