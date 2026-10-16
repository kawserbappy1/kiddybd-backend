import { prisma } from '../../database/prisma.service';
import { AppError } from '../../common/errors';
import { OrderStatus, ShipmentStatus } from '@prisma/client';
import { CourierProvider } from '../../integrations/courier/courier-provider.interface';
import { MockCourierProvider } from '../../integrations/courier/providers/mock.provider';
import { SteadfastProvider } from '../../integrations/courier/providers/steadfast.provider';
import { PathaoProvider } from '../../integrations/courier/providers/pathao.provider';
import { RedxProvider } from '../../integrations/courier/providers/redx.provider';

export class ShipmentService {
  private getProvider(name: string): CourierProvider {
    if (name.toLowerCase() === 'steadfast') return new SteadfastProvider();
    if (name.toLowerCase() === 'pathao') return new PathaoProvider();
    if (name.toLowerCase() === 'redx') return new RedxProvider();
    if (name.toLowerCase() === 'mock') return new MockCourierProvider();
    return new MockCourierProvider(); // Default fallback for now
  }

  async createShipment(orderId: string, providerName: string = 'Mock') {
    // 1. Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new AppError('Cannot create shipment for cancelled or delivered order', 400, 'INVALID_ORDER_STATE');
    }

    // Parse shipping address cleanly
    const shippingAddress: any = order.shippingAddressSnapshot || {};
    const addressStr = [
      shippingAddress.streetAddress || shippingAddress.addressLine,
      shippingAddress.thana || shippingAddress.upazila || shippingAddress.area,
      shippingAddress.district,
      shippingAddress.division,
    ]
      .filter(Boolean)
      .join(', ') || 'Dhaka, Bangladesh';

    // 2. Call provider
    const provider = this.getProvider(providerName);
    const shipmentResponse = await provider.createShipment({
      orderId: order.orderNumber || order.id,
      customerName: shippingAddress.fullName || order.customer.name,
      customerPhone: shippingAddress.phone || order.customer.phone || '01700000000',
      customerAddress: addressStr,
      weight: 1, // default weight
      codAmount: Number(order.codAmount),
    });

    // 3. Upsert Courier just in case
    const courier = await prisma.courier.upsert({
      where: { code: providerName },
      update: {},
      create: {
        name: providerName,
        code: providerName,
        status: 'ACTIVE'
      }
    });

    // 4. Save shipment and update order in transaction
    const result = await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId: order.id,
          courierId: courier.id,
          trackingId: shipmentResponse.trackingId,
          status: ShipmentStatus.PENDING,
          weight: 1,
          codAmount: order.codAmount,
          shippingCost: shipmentResponse.shippingCost
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PROCESSING }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.PROCESSING,
          reason: 'Shipment created'
        }
      });

      return shipment;
    });

    return result;
  }

  async handleCourierWebhook(providerName: string, payload: any, signature: string) {
    const provider = this.getProvider(providerName);
    
    // 1. Verify and map
    const webhookResult = await provider.handleWebhook(payload, signature);
    if (!webhookResult.isValid) {
      throw new AppError('Invalid signature', 401, 'INVALID_SIGNATURE');
    }

    // 2. Find shipment
    const shipment = await prisma.shipment.findUnique({
      where: { trackingId: webhookResult.trackingId },
      include: { order: true }
    });

    if (!shipment) {
      throw new AppError('Shipment not found', 404, 'SHIPMENT_NOT_FOUND');
    }

    // 3. Idempotency check using ShipmentEvent.externalStatus (or we can use a separate event ID)
    const existingEvent = await prisma.shipmentEvent.findFirst({
      where: {
        shipmentId: shipment.id,
        externalStatus: webhookResult.externalEventId // Store eventId in externalStatus for uniqueness or similar logic
      }
    });

    if (existingEvent) {
      return { message: 'Webhook already processed' }; // Idempotent
    }

    // 4. Determine new OrderStatus based on ShipmentStatus
    let newOrderStatus: OrderStatus | undefined;
    if (webhookResult.status === ShipmentStatus.PICKED_UP) newOrderStatus = OrderStatus.SHIPPED;
    if (webhookResult.status === ShipmentStatus.OUT_FOR_DELIVERY) newOrderStatus = OrderStatus.OUT_FOR_DELIVERY;
    if (webhookResult.status === ShipmentStatus.DELIVERED) newOrderStatus = OrderStatus.DELIVERED;
    if (webhookResult.status === ShipmentStatus.RETURNED) newOrderStatus = OrderStatus.RTO;

    // 5. Transaction
    await prisma.$transaction(async (tx) => {
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
          ...(webhookResult.status === ShipmentStatus.DELIVERED ? { deliveredAt: webhookResult.occurredAt } : {}),
          ...(webhookResult.status === ShipmentStatus.RETURNED ? { returnedAt: webhookResult.occurredAt } : {})
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
  
  async getShipmentById(id: string, customerId: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: { select: { customerId: true } },
        events: { orderBy: { occurredAt: 'desc' } },
        courier: { select: { name: true } }
      }
    });
    
    if (!shipment) {
      throw new AppError('Shipment not found', 404, 'NOT_FOUND');
    }
    
    if (shipment.order.customerId !== customerId) {
      throw new AppError('Unauthorized access to shipment', 403, 'UNAUTHORIZED');
    }
    
    return shipment;
  }
}

export const shipmentService = new ShipmentService();
