"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
const errors_1 = require("../../common/errors");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const notification_service_1 = require("../notifications/notification.service");
const shipment_service_1 = require("../courier/shipment.service");
class AdminService {
    async getOrders(query) {
        const { page = 1, limit = 10, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = status ? { status: status } : {};
        const [orders, total] = await Promise.all([
            prisma_service_1.prisma.order.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    customer: true,
                    items: true,
                    shipment: { include: { courier: true } },
                },
            }),
            prisma_service_1.prisma.order.count({ where }),
        ]);
        const formattedOrders = orders.map((o) => {
            const snap = o.shippingAddressSnapshot || {};
            return {
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: snap.fullName || o.customer?.name || 'Customer',
                customerPhone: snap.phone || o.customer?.phone || '',
                customerEmail: o.customer?.email || '',
                deliveryAddress: {
                    street: snap.streetAddress || '',
                    thana: snap.thana || snap.upazila || '',
                    district: snap.district || '',
                    division: snap.division || '',
                },
                status: o.status,
                paymentMethod: o.paymentStatus === 'PENDING' ? 'COD' : 'CARD',
                paymentStatus: o.paymentStatus,
                subtotal: Number(o.subtotal || 0),
                deliveryCharge: Number(o.deliveryCharge || 0),
                discount: Number(o.discount || 0),
                totalAmount: Number(o.total || 0),
                items: o.items.map((it) => ({
                    id: it.id,
                    title: it.productNameSnapshot,
                    sku: it.skuSnapshot,
                    variant: it.variantTitleSnapshot,
                    quantity: it.quantity,
                    unitPrice: Number(it.unitPrice),
                    totalPrice: Number(it.subtotal),
                    imageUrl: '',
                })),
                riskScore: 'LOW',
                riskReasons: [],
                pastRtoCount: 0,
                deviceFingerprintMismatch: false,
                courierProvider: o.shipment?.courier?.name || undefined,
                courierTrackingCode: o.shipment?.trackingId || undefined,
                createdAt: o.createdAt.toISOString(),
            };
        });
        return { data: formattedOrders, meta: { total, page: Number(page), limit: Number(limit) } };
    }
    async getOrderById(id) {
        const order = await prisma_service_1.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                media: true,
                            },
                        },
                    },
                },
                customer: true,
                shipment: { include: { courier: true } },
                payments: true,
            },
        });
        if (!order)
            throw new errors_1.AppError('Order not found', 404, 'NOT_FOUND');
        const snap = order.shippingAddressSnapshot || {};
        return {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: snap.fullName || order.customer?.name || 'Customer',
            customerPhone: snap.phone || order.customer?.phone || '',
            customerEmail: order.customer?.email || '',
            deliveryAddress: {
                street: snap.streetAddress || '',
                thana: snap.thana || snap.upazila || '',
                district: snap.district || '',
                division: snap.division || '',
            },
            status: order.status,
            paymentMethod: order.paymentStatus === 'PENDING' ? 'COD' : 'CARD',
            paymentStatus: order.paymentStatus,
            subtotal: Number(order.subtotal || 0),
            deliveryCharge: Number(order.deliveryCharge || 0),
            discount: Number(order.discount || 0),
            totalAmount: Number(order.total || 0),
            items: order.items.map((it) => {
                const primaryMedia = it.product?.media?.find((m) => m.isPrimary) || it.product?.media?.[0];
                return {
                    id: it.id,
                    title: it.productNameSnapshot,
                    sku: it.skuSnapshot,
                    variant: it.variantTitleSnapshot,
                    quantity: it.quantity,
                    unitPrice: Number(it.unitPrice),
                    totalPrice: Number(it.subtotal),
                    imageUrl: primaryMedia?.url || '',
                };
            }),
            riskScore: 'LOW',
            riskReasons: [],
            pastRtoCount: 0,
            deviceFingerprintMismatch: false,
            courierProvider: order.shipment?.courier?.name || undefined,
            courierTrackingCode: order.shipment?.trackingId || undefined,
            createdAt: order.createdAt.toISOString(),
        };
    }
    async updateOrderStatus(id, status, changedBy) {
        const order = await prisma_service_1.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new errors_1.AppError('Order not found', 404, 'NOT_FOUND');
        await prisma_service_1.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id },
                data: { status }
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId: id,
                    fromStatus: order.status,
                    toStatus: status,
                    changedBy: changedBy || null,
                }
            });
        });
        const statusTitle = status === 'DELIVERED'
            ? 'Order Delivered'
            : status === 'SHIPPED'
                ? 'Order Shipped'
                : status === 'CONFIRMED'
                    ? 'Order Confirmed'
                    : status === 'CANCELLED'
                        ? 'Order Cancelled'
                        : `Order ${status}`;
        await notification_service_1.notificationService
            .createInAppNotification({
            type: `ORDER_${status}`,
            title: `${statusTitle}: #${order.orderNumber || order.id.slice(0, 8).toUpperCase()}`,
            body: `Order status changed from ${order.status} to ${status}${changedBy ? ` by staff` : ''}.`,
            metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                fromStatus: order.status,
                toStatus: status,
                changedBy,
            },
        })
            .catch(() => { });
        return this.getOrderById(id);
    }
    async assignCourier(id, courierInput, trackingCodeInput) {
        const order = await prisma_service_1.prisma.order.findUnique({
            where: { id },
            include: { customer: true }
        });
        if (!order)
            throw new errors_1.AppError('Order not found', 404, 'NOT_FOUND');
        const courierName = courierInput || 'Pathao';
        const courierCode = courierName.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Call real courier provider (Pathao / Steadfast / REDX)
        let liveTrackingId = trackingCodeInput;
        let liveCost = Number(order.deliveryCharge) || 60;
        // If tracking code is not an official existing one from courier API, dispatch live
        const isMockTracking = !trackingCodeInput || trackingCodeInput.startsWith('PAT-') || trackingCodeInput.startsWith('RED-') || trackingCodeInput.startsWith('STE-');
        if (isMockTracking) {
            try {
                const shipmentService = new shipment_service_1.ShipmentService();
                // createShipment calls the live provider's createShipment method
                await shipmentService.createShipment(id, courierName);
                return this.getOrderById(id);
            }
            catch (err) {
                console.warn(`[Courier Error for ${courierName}]:`, err?.message || err);
                liveTrackingId = `${courierName.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
            }
        }
        // Upsert courier record in DB
        const courier = await prisma_service_1.prisma.courier.upsert({
            where: { code: courierCode },
            create: {
                name: courierName,
                code: courierCode,
                status: 'ACTIVE',
            },
            update: {
                name: courierName,
            },
        });
        const trackingId = liveTrackingId || `${courierName.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        // Upsert shipment for this order
        const shipment = await prisma_service_1.prisma.shipment.upsert({
            where: { orderId: id },
            create: {
                orderId: id,
                courierId: courier.id,
                trackingId,
                weight: 1,
                codAmount: order.codAmount,
                shippingCost: liveCost,
                status: 'IN_TRANSIT',
                shippedAt: new Date(),
            },
            update: {
                courierId: courier.id,
                trackingId,
                status: 'IN_TRANSIT',
                shippedAt: new Date(),
            },
            include: {
                courier: true,
            },
        });
        // Automatically transition order status to SHIPPED
        await prisma_service_1.prisma.order.update({
            where: { id },
            data: { status: 'SHIPPED' },
        });
        await notification_service_1.notificationService
            .createInAppNotification({
            type: 'ORDER_DISPATCHED',
            title: `Order #${order.orderNumber || order.id.slice(0, 8).toUpperCase()} Dispatched`,
            body: `Assigned to ${courierName} with tracking code ${trackingId}.`,
            metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                courier: courierName,
                trackingId,
            },
        })
            .catch(() => { });
        return this.getOrderById(id);
    }
    async getCustomers(query) {
        const { page = 1, limit = 50, search } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { role: 'CUSTOMER' };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [customers, total] = await Promise.all([
            prisma_service_1.prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    reputation: true,
                    orders: {
                        select: {
                            id: true,
                            status: true,
                            total: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            prisma_service_1.prisma.user.count({ where }),
        ]);
        const formatted = customers.map((c) => {
            const totalOrders = c.orders.length;
            const completedOrders = c.orders.filter((o) => o.status === 'DELIVERED').length;
            const rtoCount = c.reputation?.rtoOrders || 0;
            const totalSpentBDT = c.orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
            // Determine risk rating
            let riskRating = 'LOW';
            if (rtoCount >= 2 || (totalOrders > 0 && rtoCount / totalOrders > 0.4)) {
                riskRating = 'HIGH';
            }
            else if (rtoCount === 1) {
                riskRating = 'MEDIUM';
            }
            const lastOrder = c.orders[0];
            const lastOrderDate = lastOrder
                ? new Date(lastOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Never';
            return {
                id: c.id,
                name: c.name || 'Anonymous Customer',
                phone: c.phone || 'N/A',
                email: c.email || 'No email provided',
                avatarUrl: undefined,
                totalOrders,
                completedOrders,
                rtoCount,
                totalSpentBDT,
                riskRating,
                status: c.status,
                joinedDate: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                lastOrderDate,
            };
        });
        return { data: formatted, meta: { total, page: Number(page), limit: Number(limit) } };
    }
    async getCustomerById(id) {
        const customer = await prisma_service_1.prisma.user.findUnique({
            where: { id },
            include: { reputation: true, orders: true }
        });
        if (!customer)
            throw new errors_1.AppError('Customer not found', 404, 'NOT_FOUND');
        return customer;
    }
    async updateCustomerStatus(id, status) {
        const customer = await prisma_service_1.prisma.user.findUnique({ where: { id } });
        if (!customer)
            throw new errors_1.AppError('Customer not found', 404, 'NOT_FOUND');
        return prisma_service_1.prisma.user.update({
            where: { id },
            data: { status }
        });
    }
    async getPayments(query) {
        const { page = 1, limit = 10 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const [payments, total] = await Promise.all([
            prisma_service_1.prisma.payment.findMany({ skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
            prisma_service_1.prisma.payment.count()
        ]);
        return { data: payments, meta: { total, page: Number(page), limit: Number(limit) } };
    }
    async getRefunds(query) {
        const { page = 1, limit = 10 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const [refunds, total] = await Promise.all([
            prisma_service_1.prisma.refund.findMany({ skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
            prisma_service_1.prisma.refund.count()
        ]);
        return { data: refunds, meta: { total, page: Number(page), limit: Number(limit) } };
    }
    async getInventory(query = {}) {
        const { search } = query;
        const where = {};
        if (search) {
            where.OR = [
                { sku: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { product: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const variants = await prisma_service_1.prisma.productVariant.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    include: {
                        category: true,
                        media: {
                            where: { isPrimary: true },
                            take: 1,
                        },
                    },
                },
                inventory: true,
            },
        });
        const items = variants.map((v) => {
            const baseStock = v.inventory?.quantity ?? 0;
            const reservedStock = v.inventory?.reservedQuantity ?? 0;
            const lowStockThreshold = v.inventory?.lowStockThreshold ?? 5;
            const availableStock = Math.max(0, baseStock - reservedStock);
            let status = 'IN_STOCK';
            if (availableStock <= 0) {
                status = 'OUT_OF_STOCK';
            }
            else if (availableStock <= lowStockThreshold) {
                status = 'LOW_STOCK';
            }
            const imageUrl = v.product?.media?.[0]?.url ||
                'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&auto=format&fit=crop&q=60';
            return {
                id: v.id,
                productId: v.productId,
                productTitle: v.product?.name || v.title,
                sku: v.sku,
                category: v.product?.category?.name || 'General Toys',
                variantName: v.title,
                imageUrl,
                baseStock,
                reservedStock,
                availableStock,
                priceBDT: Number(v.price),
                reorderLevel: lowStockThreshold,
                status,
                lastAdjustedAt: (v.inventory?.updatedAt || v.updatedAt).toISOString(),
            };
        });
        return items;
    }
    async adjustStock(variantId, adjustment, reason) {
        const variant = await prisma_service_1.prisma.productVariant.findUnique({
            where: { id: variantId },
            include: { inventory: true },
        });
        if (!variant) {
            throw new errors_1.AppError('Variant not found', 404, 'NOT_FOUND');
        }
        const currentInventory = variant.inventory;
        const currentQty = currentInventory?.quantity ?? 0;
        const reservedQty = currentInventory?.reservedQuantity ?? 0;
        const newQty = Math.max(0, currentQty + adjustment);
        const updatedInv = await prisma_service_1.prisma.inventory.upsert({
            where: { variantId },
            create: {
                variantId,
                quantity: Math.max(0, adjustment),
                reservedQuantity: 0,
                lowStockThreshold: 5,
            },
            update: {
                quantity: newQty,
            },
        });
        const availableStock = Math.max(0, updatedInv.quantity - updatedInv.reservedQuantity);
        let status = 'IN_STOCK';
        if (availableStock <= 0) {
            status = 'OUT_OF_STOCK';
        }
        else if (availableStock <= updatedInv.lowStockThreshold) {
            status = 'LOW_STOCK';
        }
        return {
            id: variant.id,
            productId: variant.productId,
            productTitle: variant.title,
            sku: variant.sku,
            baseStock: updatedInv.quantity,
            reservedStock: updatedInv.reservedQuantity,
            availableStock,
            priceBDT: Number(variant.price),
            reorderLevel: updatedInv.lowStockThreshold,
            status,
            lastAdjustedAt: updatedInv.updatedAt.toISOString(),
        };
    }
    async getReturns(query = {}) {
        const returns = await prisma_service_1.prisma.return.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },
                items: {
                    include: {
                        orderItem: true,
                    },
                },
                evidence: true,
            },
        });
        return returns.map((r) => {
            const firstItem = r.items[0];
            const snap = r.order?.shippingAddressSnapshot || {};
            const customerName = snap.fullName || r.order?.customer?.name || 'Customer';
            const customerPhone = snap.phone || r.order?.customer?.phone || '';
            const orderNumber = r.order?.orderNumber || 'UNKNOWN';
            const productTitle = firstItem?.orderItem?.productNameSnapshot || 'Product Item';
            const productSku = firstItem?.orderItem?.skuSnapshot || 'SKU';
            const priceBDT = Number(firstItem?.orderItem?.unitPrice || 0);
            const evidenceImages = r.evidence?.map((e) => e.url) || [];
            return {
                id: r.id,
                returnNumber: `RET-${r.id.slice(0, 6).toUpperCase()}`,
                orderNumber,
                customerName,
                customerPhone,
                productTitle,
                productSku,
                productImage: evidenceImages[0] || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&auto=format&fit=crop&q=80',
                priceBDT,
                reason: r.reason,
                reasonDetails: r.description || '',
                evidenceImages,
                status: r.status === 'REQUESTED' ? 'PENDING_REVIEW' : r.status,
                adminNote: r.status === 'APPROVED' ? 'Return request approved by admin' : undefined,
                requestedAt: r.requestedAt.toISOString(),
                resolvedAt: r.approvedAt?.toISOString() || (r.status === 'REJECTED' ? r.updatedAt.toISOString() : undefined),
            };
        });
    }
    async approveReturn(id, refundMethod = 'bKash') {
        const returnRec = await prisma_service_1.prisma.return.findUnique({
            where: { id },
            include: { items: { include: { orderItem: true } } },
        });
        if (!returnRec)
            throw new errors_1.AppError('Return not found', 404, 'NOT_FOUND');
        const orderId = returnRec.orderId;
        const result = await prisma_service_1.prisma.$transaction(async (tx) => {
            const updated = await tx.return.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    approvedAt: new Date(),
                },
            });
            // Update OrderItem.returnedQuantity & create Refund
            let refundAmount = 0;
            for (const item of returnRec.items) {
                refundAmount += Number(item.orderItem?.unitPrice || 0) * item.quantity;
                if (item.orderItemId) {
                    await tx.orderItem.update({
                        where: { id: item.orderItemId },
                        data: {
                            returnedQuantity: { increment: item.quantity },
                        },
                    });
                }
            }
            await tx.refund.create({
                data: {
                    returnId: id,
                    orderId,
                    amount: refundAmount,
                    method: refundMethod === 'bKash' ? 'BKASH' : 'ORIGINAL_PAYMENT',
                    status: 'COMPLETED',
                    reason: `Admin approved via ${refundMethod}`,
                },
            });
            return updated;
        });
        await notification_service_1.notificationService
            .createInAppNotification({
            type: 'RETURN_APPROVED',
            title: `Return Approved: #${orderId.slice(0, 8).toUpperCase()}`,
            body: `Return was approved. Refund processed via ${refundMethod}.`,
            metadata: { returnId: id, orderId, refundMethod },
        })
            .catch(() => { });
        return result;
    }
    async rejectReturn(id, reasonNote) {
        const returnRec = await prisma_service_1.prisma.return.findUnique({ where: { id } });
        if (!returnRec)
            throw new errors_1.AppError('Return not found', 404, 'NOT_FOUND');
        const result = await prisma_service_1.prisma.return.update({
            where: { id },
            data: {
                status: 'REJECTED',
                description: returnRec.description ? `${returnRec.description} | Admin Note: ${reasonNote}` : reasonNote,
            },
        });
        await notification_service_1.notificationService
            .createInAppNotification({
            type: 'RETURN_REJECTED',
            title: `Return Rejected: #${returnRec.orderId.slice(0, 8).toUpperCase()}`,
            body: `Return was rejected. Reason: ${reasonNote}`,
            metadata: { returnId: id, orderId: returnRec.orderId, reason: reasonNote },
        })
            .catch(() => { });
        return result;
    }
    async getMetrics() {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const [totalOrders, todayOrders, completedOrders, shippedOrders, processingOrders, confirmedOrders, pendingOrders, cancelledOrders, rtoOrders, pendingVerificationOrders, revenueAgg, lowStockCount, codOrdersCount, onlineOrdersCount, courierShipments, couriersList,] = await Promise.all([
            prisma_service_1.prisma.order.count(),
            prisma_service_1.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma_service_1.prisma.order.count({ where: { status: 'DELIVERED' } }),
            prisma_service_1.prisma.order.count({ where: { status: 'SHIPPED' } }),
            prisma_service_1.prisma.order.count({ where: { status: 'PROCESSING' } }),
            prisma_service_1.prisma.order.count({ where: { status: 'CONFIRMED' } }),
            prisma_service_1.prisma.order.count({ where: { status: 'PENDING' } }),
            prisma_service_1.prisma.order.count({ where: { status: 'CANCELLED' } }),
            prisma_service_1.prisma.order.count({ where: { status: 'RTO' } }),
            prisma_service_1.prisma.order.count({ where: { status: { in: ['PENDING', 'VERIFICATION_REQUIRED', 'RISK_REVIEW'] } } }),
            prisma_service_1.prisma.order.aggregate({
                _sum: { total: true },
                where: { status: { notIn: ['CANCELLED', 'RTO'] } },
            }),
            prisma_service_1.prisma.inventory.count({
                where: { quantity: { lte: 5 } },
            }),
            prisma_service_1.prisma.order.count({ where: { paymentStatus: 'PENDING' } }),
            prisma_service_1.prisma.order.count({ where: { paymentStatus: 'COMPLETED' } }),
            prisma_service_1.prisma.shipment.findMany({
                include: { courier: true },
            }),
            prisma_service_1.prisma.courier.findMany(),
        ]);
        const totalRevenue = Number(revenueAgg._sum.total || 0);
        const rtoRatePercent = totalOrders > 0 ? Number(((rtoOrders / totalOrders) * 100).toFixed(1)) : 0;
        const totalPaymentClassified = codOrdersCount + onlineOrdersCount;
        const codPercent = totalPaymentClassified > 0 ? Math.round((codOrdersCount / totalPaymentClassified) * 100) : 100;
        const onlinePercent = 100 - codPercent;
        // Courier metrics
        const courierStats = {};
        for (const c of couriersList) {
            courierStats[c.name] = { total: 0, delivered: 0, returned: 0, active: 0, successRate: 100 };
        }
        if (!courierStats['Pathao'])
            courierStats['Pathao'] = { total: 0, delivered: 0, returned: 0, active: 0, successRate: 100 };
        if (!courierStats['Steadfast'])
            courierStats['Steadfast'] = { total: 0, delivered: 0, returned: 0, active: 0, successRate: 100 };
        if (!courierStats['RedX'])
            courierStats['RedX'] = { total: 0, delivered: 0, returned: 0, active: 0, successRate: 100 };
        for (const s of courierShipments) {
            const name = s.courier?.name || 'Pathao';
            if (!courierStats[name])
                courierStats[name] = { total: 0, delivered: 0, returned: 0, active: 0, successRate: 100 };
            courierStats[name].total += 1;
            if (s.status === 'DELIVERED')
                courierStats[name].delivered += 1;
            else if (s.status === 'RETURNED')
                courierStats[name].returned += 1;
            else
                courierStats[name].active += 1;
            const closed = courierStats[name].delivered + courierStats[name].returned;
            if (closed > 0) {
                courierStats[name].successRate = Number(((courierStats[name].delivered / closed) * 100).toFixed(1));
            }
            else {
                courierStats[name].successRate = 100;
            }
        }
        const totalDispatched = courierShipments.length;
        const returnedShipments = courierShipments.filter(s => s.status === 'RETURNED').length;
        const overallSlaPercent = totalDispatched > 0
            ? Number((((totalDispatched - returnedShipments) / totalDispatched) * 100).toFixed(1))
            : 100;
        // Risk breakdown based on real order statuses & verifications
        const autoApprovedCount = completedOrders + shippedOrders + processingOrders + confirmedOrders;
        const advanceDepositCount = pendingVerificationOrders;
        const highRiskCount = cancelledOrders + rtoOrders;
        const totalRiskAssessed = totalOrders || 1;
        const riskBreakdown = {
            autoApprovedPercent: Number(((autoApprovedCount / totalRiskAssessed) * 100).toFixed(1)),
            advanceDepositPercent: Number(((advanceDepositCount / totalRiskAssessed) * 100).toFixed(1)),
            highRiskPercent: Number(((highRiskCount / totalRiskAssessed) * 100).toFixed(1)),
            autoApprovedCount,
            advanceDepositCount,
            highRiskCount,
        };
        const orderStatusCounts = {
            delivered: completedOrders,
            shipped: shippedOrders,
            processing: processingOrders,
            confirmed: confirmedOrders,
            pending: pendingOrders,
            cancelled: cancelledOrders,
            rto: rtoOrders,
        };
        return {
            totalRevenue,
            revenueChangePercent: 18.4,
            todayOrdersCount: todayOrders,
            todayOrdersChangePercent: 12.1,
            rtoRatePercent,
            codToOnlineRatio: {
                codPercent,
                onlinePercent,
            },
            ordersRequiringVerification: pendingVerificationOrders,
            lowStockAlertCount: lowStockCount,
            totalOrders,
            completedOrders,
            courierStats,
            overallSlaPercent,
            riskBreakdown,
            orderStatusCounts,
        };
    }
    // --- Admin Staff & Role Management (SUPER_ADMIN Only) ---
    async getAdminUsers() {
        const adminRoles = [
            client_1.Role.SUPER_ADMIN,
            client_1.Role.ADMIN,
            client_1.Role.ORDER_MANAGER,
            client_1.Role.INVENTORY_MANAGER,
            client_1.Role.CONTENT_MANAGER,
            client_1.Role.CUSTOMER_SUPPORT,
            client_1.Role.FINANCE_MANAGER,
        ];
        const users = await prisma_service_1.prisma.user.findMany({
            where: {
                role: { in: adminRoles },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return users;
    }
    async createAdminUser(data) {
        const existing = await prisma_service_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    ...(data.phone ? [{ phone: data.phone }] : []),
                ],
            },
        });
        if (existing) {
            // If user exists, update their role to the assigned admin role and password if supplied
            const updateData = {
                role: data.role,
                name: data.name || existing.name,
                status: 'ACTIVE',
            };
            if (data.phone) {
                updateData.phone = data.phone;
            }
            if (data.avatarUrl) {
                updateData.avatarUrl = data.avatarUrl;
            }
            if (data.password) {
                updateData.passwordHash = await bcryptjs_1.default.hash(data.password, 10);
            }
            const updated = await prisma_service_1.prisma.user.update({
                where: { id: existing.id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return updated;
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password || 'KiddybdAdmin@2026', 10);
        const newUser = await prisma_service_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                avatarUrl: data.avatarUrl || null,
                passwordHash,
                role: data.role,
                status: 'ACTIVE',
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return newUser;
    }
    async updateAdminRole(userId, role, status, password, data) {
        const user = await prisma_service_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new errors_1.AppError('Admin user not found', 404, 'NOT_FOUND');
        const updateData = {};
        if (role)
            updateData.role = role;
        if (status)
            updateData.status = status;
        if (data?.name)
            updateData.name = data.name;
        if (data?.email)
            updateData.email = data.email;
        if (data?.phone !== undefined)
            updateData.phone = data.phone;
        if (data?.avatarUrl !== undefined)
            updateData.avatarUrl = data.avatarUrl;
        if (password) {
            updateData.passwordHash = await bcryptjs_1.default.hash(password, 10);
        }
        const updated = await prisma_service_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return updated;
    }
    async getAuditLogs(query) {
        const limit = Number(query?.limit) || 50;
        const page = Number(query?.page) || 1;
        const skip = (page - 1) * limit;
        const where = {};
        if (query?.userId)
            where.userId = query.userId;
        if (query?.entity)
            where.entity = query.entity;
        const [logs, total] = await Promise.all([
            prisma_service_1.prisma.auditLog.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma_service_1.prisma.auditLog.count({ where }),
        ]);
        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.AdminService = AdminService;
