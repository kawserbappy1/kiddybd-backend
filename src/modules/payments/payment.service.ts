import { prisma } from '../../database/prisma.service';
import { AppError } from '../../common/errors';
import { PaymentStatus, OrderStatus, InventoryReservationStatus } from '@prisma/client';
import { SSLCommerzProvider } from '../../integrations/payment/providers/sslcommerz.provider';
import { PaymentProvider } from '../../integrations/payment/payment-provider.interface';
import { orderQueue } from '../orders/order.service';

export class PaymentService {
  private getProvider(name: string): PaymentProvider {
    const normalized = name.toUpperCase();
    if (normalized === 'SSLCOMMERZ' || normalized === 'BKASH' || normalized === 'NAGAD') {
      return new SSLCommerzProvider();
    }
    throw new AppError('Unsupported payment provider', 400, 'UNSUPPORTED_PROVIDER');
  }

  async initiatePayment(orderId: string, userId?: string, providerName: string = 'SSLCommerz') {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }]
      },
      include: { customer: true }
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (userId && order.customerId !== userId) {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError('Order is cancelled', 400, 'INVALID_ORDER_STATE');
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new AppError('Payment already completed for this order', 400, 'PAYMENT_ALREADY_COMPLETED');
    }

    const provider = this.getProvider(providerName);

    // Create Payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: providerName,
        status: PaymentStatus.PENDING,
        amount: order.total
      }
    });

    const shipping = (order.shippingAddressSnapshot as any) || {};

    const customerInfo = {
      name: shipping.fullName || order.customer?.name || 'Customer',
      email: order.customer?.email || 'customer@kiddybd.com',
      phone: shipping.phone || order.customer?.phone || '01700000000',
      address: shipping.streetAddress || 'Dhaka',
      city: shipping.district || shipping.division || 'Dhaka',
      postcode: shipping.thana || '1200'
    };

    const { redirectUrl, transactionId } = await provider.createPayment(
      payment.id,
      order.orderNumber,
      Number(order.total),
      customerInfo
    );

    // Create PaymentTransaction
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        provider: providerName,
        externalTransactionId: transactionId,
        status: PaymentStatus.PENDING,
        amount: order.total
      }
    });

    return { redirectUrl, transactionId };
  }

  async handleSSLCommerzCallback(payload: any, eventType: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'IPN') {
    const tranId = payload.tran_id;
    const valId = payload.val_id;
    const status = payload.status;
    const paymentId = payload.value_a;
    const orderNumber = payload.value_b;

    // Verify through SSLCommerz provider
    const sslProvider = new SSLCommerzProvider();
    let isSuccess = false;

    if (eventType === 'SUCCESS' || status === 'VALID' || status === 'VALIDATED') {
      if (valId) {
        isSuccess = await sslProvider.verifyPayment(valId);
      } else {
        isSuccess = true;
      }
    }

    // Find transaction
    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          ...(tranId ? [{ externalTransactionId: tranId }] : []),
          ...(paymentId ? [{ paymentId }] : [])
        ]
      },
      include: { payment: true }
    });

    // Find Order
    const order = await prisma.order.findFirst({
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

    const newPaymentStatus = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

    await prisma.$transaction(async (tx) => {
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
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.COMPLETED
          }
        });

        // Commit active reservations
        await tx.inventoryReservation.updateMany({
          where: { orderId: order.id, status: InventoryReservationStatus.ACTIVE },
          data: { status: InventoryReservationStatus.COMMITTED }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            toStatus: OrderStatus.CONFIRMED,
            reason: `SSLCommerz payment succeeded (tran_id: ${tranId || 'N/A'})`
          }
        });

        // Trigger Queue Job
        orderQueue.add('PaymentSuccess', { orderId: order.id, paymentId: paymentTx?.paymentId }).catch(() => {});
      } else {
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

  async handleWebhook(providerName: string, payload: any, signature: string) {
    const provider = this.getProvider(providerName);
    const webhookResult = await provider.handleWebhook(payload, signature);

    if (!webhookResult.isValid) {
      throw new AppError('Invalid signature', 401, 'INVALID_SIGNATURE');
    }

    const existingEvent = await prisma.paymentWebhookEvent.findFirst({
      where: {
        provider: providerName,
        externalEventId: webhookResult.externalEventId
      }
    });

    if (existingEvent) {
      return { message: 'Webhook already processed' };
    }

    const webhookEvent = await prisma.paymentWebhookEvent.create({
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
      const paymentTransaction = await prisma.paymentTransaction.findFirst({
        where: { externalTransactionId: webhookResult.transactionId },
        include: { payment: true }
      });

      if (!paymentTransaction) {
        throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
      }

      const orderId = paymentTransaction.payment.orderId;

      await prisma.$transaction(async (tx) => {
        const newStatus = webhookResult.status === 'SUCCESS' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

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
              status: OrderStatus.CONFIRMED,
              paymentStatus: PaymentStatus.COMPLETED
            }
          });

          await tx.inventoryReservation.updateMany({
            where: { orderId: orderId, status: InventoryReservationStatus.ACTIVE },
            data: { status: InventoryReservationStatus.COMMITTED }
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: orderId,
              toStatus: OrderStatus.CONFIRMED,
              reason: 'Payment completed successfully via webhook'
            }
          });

          await orderQueue.add('PaymentSuccess', { orderId, paymentId: paymentTransaction.payment.id });
        }

        await tx.paymentWebhookEvent.update({
          where: { id: webhookEvent.id },
          data: { processed: true, processedAt: new Date() }
        });
      });

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
