import { prisma } from '../../database/prisma.service';
import { AppError } from '../../common/errors';
import { OrderStatus, ReturnStatus, ReturnReason, RefundStatus } from '@prisma/client';
import { notificationService } from '../notifications/notification.service';

export interface CreateReturnItemDto {
  orderItemId: string;
  quantity: number;
  reason: ReturnReason;
}

export interface CreateReturnDto {
  orderId: string;
  reason: ReturnReason;
  description?: string;
  items: CreateReturnItemDto[];
  evidence?: { type: 'IMAGE' | 'VIDEO'; url: string }[];
}

export class ReturnService {
  async createReturn(userId: string | undefined, dto: CreateReturnDto) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.orderId);
    const orderWhere: any = isUuid
      ? {
          OR: [
            { id: dto.orderId },
            { orderNumber: dto.orderId },
          ],
        }
      : { orderNumber: dto.orderId };

    const order = await prisma.order.findFirst({
      where: orderWhere,
      include: { items: true, customer: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    const customerId = userId || order.customerId;
    if (!customerId) {
      throw new AppError('Order has no customer attached', 400, 'BAD_REQUEST');
    }

    // Validate item quantities
    for (const itemDto of dto.items) {
      const orderItem = order.items.find((i) => i.id === itemDto.orderItemId || i.skuSnapshot === itemDto.orderItemId);
      if (!orderItem) {
        throw new AppError(`Item ${itemDto.orderItemId} not found in order`, 400, 'BAD_REQUEST');
      }
      if (orderItem.returnedQuantity + itemDto.quantity > orderItem.quantity) {
        throw new AppError(`Cannot return ${itemDto.quantity} of item ${orderItem.productNameSnapshot}. Total exceeds ordered amount.`, 400, 'BAD_REQUEST');
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const returnRec = await tx.return.create({
        data: {
          orderId: order.id,
          customerId,
          reason: dto.reason,
          description: dto.description,
          status: ReturnStatus.REQUESTED,
          items: {
            create: dto.items.map((i) => {
              const matchedItem = order.items.find((oi) => oi.id === i.orderItemId || oi.skuSnapshot === i.orderItemId);
              return {
                orderItemId: matchedItem?.id || i.orderItemId,
                quantity: i.quantity,
                reason: i.reason,
              };
            }),
          },
          evidence: dto.evidence ? {
            create: dto.evidence.map(e => ({
              type: e.type,
              url: e.url
            }))
          } : undefined
        },
        include: { items: true, evidence: true }
      });
      return returnRec;
    });

    await notificationService
      .createInAppNotification({
        type: 'RETURN_REQUESTED',
        title: `Return Requested: #${order.orderNumber || order.id.slice(0, 8).toUpperCase()}`,
        body: `Customer requested return for ${dto.items.length} item(s). Reason: ${dto.reason}`,
        metadata: {
          returnId: result.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      })
      .catch(() => {});

    return result;
  }

  async approveReturn(returnId: string, adminId: string) {
    const returnRec = await prisma.return.findUnique({
      where: { id: returnId },
      include: { items: { include: { orderItem: true } } }
    });

    if (!returnRec) throw new AppError('Return not found', 404, 'NOT_FOUND');
    if (returnRec.status !== ReturnStatus.REQUESTED && returnRec.status !== ReturnStatus.UNDER_REVIEW) {
      throw new AppError('Return is not in a pending state', 400, 'BAD_REQUEST');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Return
      const updatedReturn = await tx.return.update({
        where: { id: returnId },
        data: {
          status: ReturnStatus.APPROVED,
          approvedAt: new Date()
        }
      });

      // 2. Update OrderItem.returnedQuantity & calculate total refund amount
      let refundAmount = 0;
      for (const returnItem of returnRec.items) {
        const discountPerUnit = Number(returnItem.orderItem.discount) / returnItem.orderItem.quantity;
        const itemAmount = (Number(returnItem.orderItem.unitPrice) - discountPerUnit) * returnItem.quantity;
        refundAmount += itemAmount;
        
        await tx.orderItem.update({
          where: { id: returnItem.orderItemId },
          data: {
            returnedQuantity: returnItem.orderItem.returnedQuantity + returnItem.quantity
          }
        });
      }

      // 3. Insert Refund
      const refund = await tx.refund.create({
        data: {
          returnId,
          orderId: returnRec.orderId,
          amount: refundAmount,
          method: 'ORIGINAL_PAYMENT',
          status: RefundStatus.PENDING,
          reason: 'Return Approved'
        }
      });

      // 4. Insert OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: returnRec.orderId,
          fromStatus: OrderStatus.DELIVERED,
          toStatus: OrderStatus.DELIVERED,
          reason: `Return ${returnId} approved`,
          changedBy: adminId
        }
      });

      return { updatedReturn, refund };
    });

    // TODO: Trigger refund via BullMQ (call RefundService.processRefund async)

    return result;
  }

  async rejectReturn(returnId: string, adminId: string, reason: string) {
    const returnRec = await prisma.return.findUnique({
      where: { id: returnId }
    });

    if (!returnRec) throw new AppError('Return not found', 404, 'NOT_FOUND');

    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: { status: ReturnStatus.REJECTED }
    });

    return updatedReturn;
  }

  async getAllReturns() {
    return prisma.return.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getReturnById(id: string) {
    const r = await prisma.return.findUnique({
      where: { id },
      include: { items: true, evidence: true }
    });
    if (!r) throw new AppError('Not found', 404, 'NOT_FOUND');
    return r;
  }

  async getReturnsByOrder(orderIdentifier: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdentifier);
    const where: any = isUuid
      ? {
          OR: [
            { orderId: orderIdentifier },
            { order: { orderNumber: orderIdentifier } },
          ],
        }
      : { order: { orderNumber: orderIdentifier } };

    return prisma.return.findMany({
      where,
      include: {
        items: {
          include: {
            orderItem: true,
          },
        },
        evidence: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const returnService = new ReturnService();
