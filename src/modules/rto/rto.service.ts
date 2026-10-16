import { prisma } from '../../database/prisma.service';
import { AppError } from '../../common/errors';
import { OrderStatus, ShipmentStatus, RTOReason } from '@prisma/client';

export class RTOService {
  async recordRTO(shipmentId: string, orderId: string, reason: RTOReason, notes?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status === OrderStatus.RTO) {
      throw new AppError('Order already marked as RTO', 400, 'ALREADY_RTO');
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    });

    if (!shipment) {
      throw new AppError('Shipment not found', 404, 'SHIPMENT_NOT_FOUND');
    }

    const result = await prisma.$transaction(async (tx) => {
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
          status: ShipmentStatus.RETURNED,
          returnedAt: new Date()
        }
      });

      // 3. Update Order
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.RTO }
      });

      // 4. Insert OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.RTO,
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
    return prisma.rTO.findMany({
      include: { order: true, shipment: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getRTOByOrderId(orderId: string) {
    const rto = await prisma.rTO.findFirst({
      where: { orderId },
      include: { order: true, shipment: true }
    });
    if (!rto) throw new AppError('RTO not found', 404, 'NOT_FOUND');
    return rto;
  }
}

export const rtoService = new RTOService();
