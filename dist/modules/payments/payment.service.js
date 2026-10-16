"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
const client_1 = require("@prisma/client");
const sslcommerz_provider_1 = require("../../integrations/payment/providers/sslcommerz.provider");
const order_service_1 = require("../orders/order.service");
class PaymentService {
    getProvider(name) {
        const normalized = name.toUpperCase();
        if (normalized === 'SSLCOMMERZ' || normalized === 'BKASH' || normalized === 'NAGAD') {
            return new sslcommerz_provider_1.SSLCommerzProvider();
        }
        throw new errors_1.AppError('Unsupported payment provider', 400, 'UNSUPPORTED_PROVIDER');
    }
    async initiatePayment(orderId, userId, providerName = 'SSLCommerz') {
        const order = await prisma_service_1.prisma.order.findFirst({
            where: {
                OR: [{ id: orderId }, { orderNumber: orderId }]
            },
            include: { customer: true }
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }
        if (userId && order.customerId !== userId) {
            throw new errors_1.AppError('Unauthorized', 403, 'UNAUTHORIZED');
        }
        if (order.status === client_1.OrderStatus.CANCELLED) {
            throw new errors_1.AppError('Order is cancelled', 400, 'INVALID_ORDER_STATE');
        }
        if (order.paymentStatus === client_1.PaymentStatus.COMPLETED) {
            throw new errors_1.AppError('Payment already completed for this order', 400, 'PAYMENT_ALREADY_COMPLETED');
        }
        const provider = this.getProvider(providerName);
        // Create Payment record
        const payment = await prisma_service_1.prisma.payment.create({
            data: {
                orderId: order.id,
                provider: providerName,
                status: client_1.PaymentStatus.PENDING,
                amount: order.total
            }
        });
        const shipping = order.shippingAddressSnapshot || {};
        const customerInfo = {
            name: shipping.fullName || order.customer?.name || 'Customer',
            email: order.customer?.email || 'customer@kiddybd.com',
            phone: shipping.phone || order.customer?.phone || '01700000000',
            address: shipping.streetAddress || 'Dhaka',
            city: shipping.district || shipping.division || 'Dhaka',
            postcode: shipping.thana || '1200'
        };
        const { redirectUrl, transactionId } = await provider.createPayment(payment.id, order.orderNumber, Number(order.total), customerInfo);
        // Create PaymentTransaction
        await prisma_service_1.prisma.paymentTransaction.create({
            data: {
                paymentId: payment.id,
                provider: providerName,
                externalTransactionId: transactionId,
                status: client_1.PaymentStatus.PENDING,
                amount: order.total
            }
        });
        return { redirectUrl, transactionId };
    }
    async handleSSLCommerzCallback(payload, eventType) {
        const tranId = payload.tran_id;
        const valId = payload.val_id;
        const status = payload.status;
        const paymentId = payload.value_a;
        const orderNumber = payload.value_b;
        // Verify through SSLCommerz provider
        const sslProvider = new sslcommerz_provider_1.SSLCommerzProvider();
        let isSuccess = false;
        if (eventType === 'SUCCESS' || status === 'VALID' || status === 'VALIDATED') {
            if (valId) {
                isSuccess = await sslProvider.verifyPayment(valId);
            }
            else {
                isSuccess = true;
            }
        }
        // Find transaction
        const paymentTx = await prisma_service_1.prisma.paymentTransaction.findFirst({
            where: {
                OR: [
                    ...(tranId ? [{ externalTransactionId: tranId }] : []),
                    ...(paymentId ? [{ paymentId }] : [])
                ]
            },
            include: { payment: true }
        });
        // Find Order
        const order = await prisma_service_1.prisma.order.findFirst({
            where: {
                OR: [
                    ...(orderNumber ? [{ orderNumber }] : []),
                    ...(paymentTx?.payment?.orderId ? [{ id: paymentTx.payment.orderId }] : [])
                ]
            }
        });
        if (!order) {
            console.warn('SSLCommerz callback received but order was not found for tranId:', tranId);
            return;
        }
        const newPaymentStatus = isSuccess ? client_1.PaymentStatus.COMPLETED : client_1.PaymentStatus.FAILED;
        await prisma_service_1.prisma.$transaction(async (tx) => {
            // Update Payment & Transaction if exists
            if (paymentTx) {
                await tx.paymentTransaction.update({
                    where: { id: paymentTx.id },
                    data: {
                        status: newPaymentStatus,
                        rawReference: payload
                    }
                });
                await tx.payment.update({
                    where: { id: paymentTx.paymentId },
                    data: { status: newPaymentStatus }
                });
            }
            // Update Order
            if (isSuccess) {
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        status: client_1.OrderStatus.CONFIRMED,
                        paymentStatus: client_1.PaymentStatus.COMPLETED
                    }
                });
                // Commit active reservations
                await tx.inventoryReservation.updateMany({
                    where: { orderId: order.id, status: client_1.InventoryReservationStatus.ACTIVE },
                    data: { status: client_1.InventoryReservationStatus.COMMITTED }
                });
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: order.id,
                        toStatus: client_1.OrderStatus.CONFIRMED,
                        reason: `SSLCommerz payment succeeded (tran_id: ${tranId || 'N/A'})`
                    }
                });
                // Trigger Queue Job
                order_service_1.orderQueue.add('PaymentSuccess', { orderId: order.id, paymentId: paymentTx?.paymentId }).catch(() => { });
            }
            else {
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: order.id,
                        toStatus: order.status,
                        reason: `SSLCommerz payment ${eventType.toLowerCase()} (status: ${status || 'FAILED'})`
                    }
                });
            }
        });
    }
    async handleWebhook(providerName, payload, signature) {
        const provider = this.getProvider(providerName);
        const webhookResult = await provider.handleWebhook(payload, signature);
        if (!webhookResult.isValid) {
            throw new errors_1.AppError('Invalid signature', 401, 'INVALID_SIGNATURE');
        }
        const existingEvent = await prisma_service_1.prisma.paymentWebhookEvent.findFirst({
            where: {
                provider: providerName,
                externalEventId: webhookResult.externalEventId
            }
        });
        if (existingEvent) {
            return { message: 'Webhook already processed' };
        }
        const webhookEvent = await prisma_service_1.prisma.paymentWebhookEvent.create({
            data: {
                provider: providerName,
                externalEventId: webhookResult.externalEventId,
                eventType: webhookResult.status,
                payload,
                signature: signature || '',
                processed: false
            }
        });
        try {
            const paymentTransaction = await prisma_service_1.prisma.paymentTransaction.findFirst({
                where: { externalTransactionId: webhookResult.transactionId },
                include: { payment: true }
            });
            if (!paymentTransaction) {
                throw new errors_1.AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
            }
            const orderId = paymentTransaction.payment.orderId;
            await prisma_service_1.prisma.$transaction(async (tx) => {
                const newStatus = webhookResult.status === 'SUCCESS' ? client_1.PaymentStatus.COMPLETED : client_1.PaymentStatus.FAILED;
                await tx.paymentTransaction.update({
                    where: { id: paymentTransaction.id },
                    data: { status: newStatus }
                });
                await tx.payment.update({
                    where: { id: paymentTransaction.payment.id },
                    data: { status: newStatus }
                });
                if (webhookResult.status === 'SUCCESS') {
                    await tx.order.update({
                        where: { id: orderId },
                        data: {
                            status: client_1.OrderStatus.CONFIRMED,
                            paymentStatus: client_1.PaymentStatus.COMPLETED
                        }
                    });
                    await tx.inventoryReservation.updateMany({
                        where: { orderId: orderId, status: client_1.InventoryReservationStatus.ACTIVE },
                        data: { status: client_1.InventoryReservationStatus.COMMITTED }
                    });
                    await tx.orderStatusHistory.create({
                        data: {
                            orderId: orderId,
                            toStatus: client_1.OrderStatus.CONFIRMED,
                            reason: 'Payment completed successfully via webhook'
                        }
                    });
                    await order_service_1.orderQueue.add('PaymentSuccess', { orderId, paymentId: paymentTransaction.payment.id });
                }
                await tx.paymentWebhookEvent.update({
                    where: { id: webhookEvent.id },
                    data: { processed: true, processedAt: new Date() }
                });
            });
            return { message: 'Webhook processed successfully' };
        }
        catch (error) {
            console.error('Webhook processing failed:', error);
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
