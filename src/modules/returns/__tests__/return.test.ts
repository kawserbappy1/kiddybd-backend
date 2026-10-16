import { returnService } from '../return.service';
import { prisma } from '../../../database/prisma.service';
import { OrderStatus, ReturnStatus, ReturnReason, RefundStatus } from '@prisma/client';
import { AppError } from '../../../common/errors';

// Mock prisma methods
jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    order: { findUnique: jest.fn(), findFirst: jest.fn() },
    orderItem: { update: jest.fn() },
    return: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    refund: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('Returns & Refunds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReturn', () => {
    it('should successfully create a partial return (1 of 3 items)', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: OrderStatus.DELIVERED,
        items: [
          { id: 'item-1', quantity: 3, returnedQuantity: 0, productNameSnapshot: 'Toy A' }
        ]
      };
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.return.create as jest.Mock).mockResolvedValue({ id: 'return-1' });

      const dto = {
        orderId: 'order-1',
        reason: ReturnReason.DAMAGED,
        items: [{ orderItemId: 'item-1', quantity: 1, reason: ReturnReason.DAMAGED }]
      };

      const result = await returnService.createReturn('user-1', dto);

      expect(prisma.return.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-1',
          items: expect.objectContaining({
            create: [{ orderItemId: 'item-1', quantity: 1, reason: ReturnReason.DAMAGED }]
          })
        })
      }));
      expect(result).toEqual({ id: 'return-1' });
    });

    it('should throw error if return qty > original', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: OrderStatus.DELIVERED,
        items: [
          { id: 'item-1', quantity: 2, returnedQuantity: 1, productNameSnapshot: 'Toy A' } // Only 1 left to return
        ]
      };
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      const dto = {
        orderId: 'order-1',
        reason: ReturnReason.DAMAGED,
        items: [{ orderItemId: 'item-1', quantity: 2, reason: ReturnReason.DAMAGED }] // Requesting 2
      };

      await expect(returnService.createReturn('user-1', dto))
        .rejects.toThrow(/Total exceeds ordered amount/);
    });
  });

  describe('approveReturn', () => {
    it('should update return to APPROVED and create a PENDING refund', async () => {
      const mockReturn = {
        id: 'return-1',
        orderId: 'order-1',
        status: ReturnStatus.REQUESTED,
        items: [
          { quantity: 1, orderItemId: 'item-1', orderItem: { id: 'item-1', unitPrice: 100, discount: 0, quantity: 1, returnedQuantity: 0 } }
        ]
      };
      (prisma.return.findUnique as jest.Mock).mockResolvedValue(mockReturn);
      (prisma.return.update as jest.Mock).mockResolvedValue({ ...mockReturn, status: ReturnStatus.APPROVED });
      (prisma.refund.create as jest.Mock).mockResolvedValue({ id: 'refund-1' });

      await returnService.approveReturn('return-1', 'admin-1');

      expect(prisma.return.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'return-1' },
        data: expect.objectContaining({ status: ReturnStatus.APPROVED })
      }));
      expect(prisma.refund.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          returnId: 'return-1',
          amount: 100,
          status: RefundStatus.PENDING
        })
      }));
    });
  });
});
