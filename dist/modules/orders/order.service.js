"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = exports.orderQueue = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
const client_1 = require("@prisma/client");
const order_state_machine_1 = require("./domain/order-state-machine");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const risk_service_1 = require("../risk/risk.service");
const verification_service_1 = require("../verification/verification.service");
const notification_service_1 = require("../notifications/notification.service");
const redisConnection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
exports.orderQueue = new bullmq_1.Queue('order-events', { connection: redisConnection });
class OrderService {
    async createOrder(userId, dto, idempotencyKey) {
        // Step 1: Check IdempotencyKey
        const existingKey = await prisma_service_1.prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
        if (existingKey) {
            if (existingKey.responseStatus) {
                return existingKey.responseBody;
            }
            throw new errors_1.ConflictError('Request is already processing');
        }
        // Step 2: Validate cartId belongs to userId
        const cart = await prisma_service_1.prisma.cart.findUnique({
            where: { id: dto.cartId, userId },
            include: { items: { include: { product: true, variant: true } } }
        });
        if (!cart || cart.items.length === 0) {
            throw new errors_1.ValidationError('Cart is empty or invalid');
        }
        // Step 3: Fetch current DB prices for all cart items (already included in cart query)
        // Step 4: Validate address belongs to userId
        const address = await prisma_service_1.prisma.address.findUnique({ where: { id: dto.addressId, userId } });
        if (!address) {
            throw new errors_1.ValidationError('Address not found');
        }
        // Step 5: Validate coupon server-side
        let coupon = null;
        if (dto.couponCode) {
            coupon = await prisma_service_1.prisma.coupon.findUnique({ where: { code: dto.couponCode } });
            if (!coupon || !coupon.isActive || coupon.endDate < new Date() || coupon.startDate > new Date()) {
                throw new errors_1.ValidationError('Invalid or expired coupon');
            }
        }
        let subtotal = 0;
        cart.items.forEach(item => {
            subtotal += Number(item.variant.price) * item.quantity;
        });
        let discount = coupon ? Number(coupon.value) : 0;
        let deliveryCharge = 50;
        let total = Math.max(0, subtotal - discount) + deliveryCharge;
        // Step 6: Check stock
        for (const item of cart.items) {
            const inventory = await prisma_service_1.prisma.inventory.findUnique({ where: { variantId: item.variantId } });
            if (!inventory)
                throw new errors_1.ValidationError(`Inventory not found for variant ${item.variantId}`);
            const available = inventory.quantity - inventory.reservedQuantity;
            if (available < item.quantity) {
                throw new errors_1.ValidationError(`Insufficient stock for ${item.product.name}`);
            }
        }
        // Step 7: Risk Assessment
        const riskResult = await risk_service_1.riskService.assessOrder(userId, total);
        // Step 8: COD validation
        if (dto.paymentMethod === 'COD') {
            const codCheck = await risk_service_1.riskService.isCODAllowed(riskResult.level, total);
            if (!codCheck.allowed) {
                throw new errors_1.ValidationError(codCheck.reason || 'COD not allowed for this order');
            }
        }
        // Step 9: BEGIN TRANSACTION
        const result = await prisma_service_1.prisma.$transaction(async (tx) => {
            const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            let initialStatus = client_1.OrderStatus.PENDING;
            if (riskResult.level === 'MEDIUM') {
                initialStatus = client_1.OrderStatus.VERIFICATION_REQUIRED;
            }
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerId: userId,
                    status: initialStatus,
                    paymentStatus: 'PENDING',
                    fulfillmentStatus: 'UNFULFILLED',
                    couponId: coupon?.id,
                    subtotal,
                    discount,
                    deliveryCharge,
                    total,
                    codAmount: dto.paymentMethod === 'COD' ? total : 0,
                    shippingAddressSnapshot: address,
                    billingAddressSnapshot: address,
                }
            });
            for (const item of cart.items) {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        productNameSnapshot: item.product.name,
                        variantTitleSnapshot: item.variant.title || '',
                        skuSnapshot: item.variant.sku,
                        unitPrice: item.variant.price,
                        quantity: item.quantity,
                        subtotal: Number(item.variant.price) * item.quantity,
                    }
                });
                await tx.inventory.update({
                    where: { variantId: item.variantId },
                    data: { reservedQuantity: { increment: item.quantity } }
                });
                await tx.inventoryReservation.create({
                    data: {
                        variantId: item.variantId,
                        orderId: order.id,
                        quantity: item.quantity,
                        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
                        status: client_1.InventoryReservationStatus.ACTIVE
                    }
                });
            }
            if (coupon) {
                await tx.couponUsage.create({
                    data: {
                        couponId: coupon.id,
                        userId,
                        orderId: order.id,
                        discountAmount: discount
                    }
                });
            }
            await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    toStatus: initialStatus,
                    reason: 'Order created',
                    changedBy: userId
                }
            });
            await risk_service_1.riskService.saveRiskAssessment(order.id, riskResult, tx);
            // Step 10: Store idempotency key
            await tx.idempotencyKey.create({
                data: {
                    key: idempotencyKey,
                    userId,
                    endpoint: '/api/v1/orders',
                    requestHash: 'hash',
                    responseStatus: 201,
                    responseBody: order,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            return order;
        });
        if (result.status === client_1.OrderStatus.VERIFICATION_REQUIRED) {
            await verification_service_1.verificationService.createVerification(result.id, 'OTP');
        }
        // Step 11: Emit OrderCreatedEvent
        await exports.orderQueue.add('OrderCreated', { orderId: result.id });
        await notification_service_1.notificationService
            .createInAppNotification({
            type: 'NEW_ORDER',
            title: `New Order: #${result.orderNumber}`,
            body: `Customer placed order #${result.orderNumber} for ৳${Number(result.total).toLocaleString()} (${result.paymentStatus}).`,
            metadata: {
                orderId: result.id,
                orderNumber: result.orderNumber,
                total: Number(result.total),
            },
        })
            .catch(() => { });
        return result;
    }
    async getOrders(userId) {
        return prisma_service_1.prisma.order.findMany({ where: { customerId: userId } });
    }
    async getOrderById(userId, orderId) {
        const order = await prisma_service_1.prisma.order.findUnique({ where: { id: orderId, customerId: userId }, include: { items: true } });
        if (!order)
            throw new errors_1.NotFoundError('Order not found');
        return order;
    }
    async getOrderByOrderNumber(orderNumber) {
        const order = await prisma_service_1.prisma.order.findUnique({
            where: { orderNumber },
            include: {
                items: {
                    include: {
                        product: {
                            include: { media: true },
                        },
                    },
                },
                shipment: {
                    include: { courier: true },
                },
            },
        });
        return order;
    }
    async cancelOrder(userId, orderId) {
        const order = await prisma_service_1.prisma.order.findUnique({ where: { id: orderId, customerId: userId } });
        if (!order)
            throw new errors_1.NotFoundError('Order not found');
        order_state_machine_1.OrderStateMachine.validateTransition(order.status, client_1.OrderStatus.CANCELLED);
        return prisma_service_1.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.CANCELLED }
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId,
                    fromStatus: order.status,
                    toStatus: client_1.OrderStatus.CANCELLED,
                    reason: 'Customer cancelled',
                    changedBy: userId
                }
            });
            const reservations = await tx.inventoryReservation.findMany({ where: { orderId } });
            for (const res of reservations) {
                if (res.status === client_1.InventoryReservationStatus.ACTIVE) {
                    await tx.inventoryReservation.update({
                        where: { id: res.id },
                        data: { status: client_1.InventoryReservationStatus.EXPIRED }
                    });
                    await tx.inventory.update({
                        where: { variantId: res.variantId },
                        data: { reservedQuantity: { decrement: res.quantity } }
                    });
                }
            }
            return updatedOrder;
        });
    }
    async createDirectOrder(dto, idempotencyKey) {
        const { recipientName, phone, division, district, thana, streetAddress, deliveryNotes, paymentMethod = 'COD', items = [], subtotal = 0, deliveryFee = 60, couponCode, discountAmount = 0, total = 0, } = dto;
        if (!recipientName || !phone || !streetAddress) {
            throw new errors_1.ValidationError('Recipient name, phone, and street address are required');
        }
        // 1. Identify or Auto-Create User by Phone (Shadow Account for repeat customer identification)
        let user = await prisma_service_1.prisma.user.findUnique({
            where: { phone: phone.trim() },
        });
        if (!user) {
            user = await prisma_service_1.prisma.user.create({
                data: {
                    phone: phone.trim(),
                    name: recipientName.trim(),
                    role: 'CUSTOMER',
                    status: 'ACTIVE',
                },
            });
        }
        else if (user.name !== recipientName.trim()) {
            // Update name if customer updated it
            user = await prisma_service_1.prisma.user.update({
                where: { id: user.id },
                data: { name: recipientName.trim() },
            });
        }
        // 2. Upsert Address for this user
        let address = await prisma_service_1.prisma.address.findFirst({
            where: {
                userId: user.id,
                phone: phone.trim(),
                division,
                district,
            },
        });
        if (!address) {
            address = await prisma_service_1.prisma.address.create({
                data: {
                    userId: user.id,
                    name: recipientName.trim(),
                    phone: phone.trim(),
                    division,
                    district,
                    upazila: thana || district,
                    area: thana || district,
                    addressLine: streetAddress.trim(),
                    isDefault: true,
                },
            });
        }
        // 3. Coupon lookup if provided
        let coupon = null;
        if (couponCode) {
            coupon = await prisma_service_1.prisma.coupon.findUnique({ where: { code: couponCode } });
        }
        // 4. Create Order Transaction
        const orderNumber = `KBD-${Date.now().toString().slice(-6)}`;
        const calcSubtotal = Number(subtotal);
        const calcDiscount = Number(discountAmount);
        const calcDelivery = Number(deliveryFee);
        const calcTotal = Number(total) || Math.max(0, calcSubtotal - calcDiscount + calcDelivery);
        const order = await prisma_service_1.prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    customerId: user.id,
                    status: client_1.OrderStatus.CONFIRMED,
                    paymentStatus: client_1.PaymentStatus.PENDING,
                    fulfillmentStatus: 'UNFULFILLED',
                    couponId: coupon?.id || null,
                    subtotal: calcSubtotal,
                    discount: calcDiscount,
                    deliveryCharge: calcDelivery,
                    total: calcTotal,
                    codAmount: paymentMethod === 'COD' ? calcTotal : 0,
                    shippingAddressSnapshot: {
                        fullName: recipientName,
                        phone,
                        division,
                        district,
                        thana,
                        streetAddress,
                        deliveryNotes,
                    },
                    billingAddressSnapshot: {
                        fullName: recipientName,
                        phone,
                        division,
                        district,
                        thana,
                        streetAddress,
                    },
                },
            });
            // Create Order Items
            for (const item of items) {
                // Try to find variant if productId passed
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: { variants: true },
                });
                const primaryVariant = product?.variants?.[0];
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: item.productId,
                        variantId: primaryVariant ? primaryVariant.id : item.productId,
                        productNameSnapshot: item.title || product?.name || 'Product',
                        variantTitleSnapshot: primaryVariant?.title || 'Standard',
                        skuSnapshot: primaryVariant?.sku || `SKU-${Date.now().toString().slice(-4)}`,
                        unitPrice: Number(item.price || 0),
                        quantity: Number(item.quantity || 1),
                        subtotal: Number(item.price || 0) * Number(item.quantity || 1),
                    },
                });
                // Decrement inventory if variant exists
                if (primaryVariant) {
                    await tx.inventory.updateMany({
                        where: { variantId: primaryVariant.id },
                        data: {
                            quantity: { decrement: Number(item.quantity || 1) },
                        },
                    });
                }
            }
            // Record Order Status History
            await tx.orderStatusHistory.create({
                data: {
                    orderId: newOrder.id,
                    toStatus: client_1.OrderStatus.CONFIRMED,
                    reason: 'Direct order placed by customer',
                    changedBy: user.id,
                },
            });
            // Save idempotency key if provided
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: {
                        key: idempotencyKey,
                        userId: user.id,
                        endpoint: '/api/v1/orders/direct',
                        requestHash: 'hash',
                        responseStatus: 201,
                        responseBody: newOrder,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                });
            }
            return newOrder;
        });
        return order;
    }
}
exports.OrderService = OrderService;
exports.orderService = new OrderService();
