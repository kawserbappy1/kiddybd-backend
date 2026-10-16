import { rtoService } from '../rto.service';
import { prisma } from '../../../database/prisma.service';
import { OrderStatus, ShipmentStatus, RTOReason } from '@prisma/client';
import { AppError } from '../../../common/errors';

// Mock prisma methods
jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    order: { findUnique: jest.fn(), update: jest.fn() },
    shipment: { findUnique: jest.fn(), update: jest.fn() },
    rTO: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    customerReputation: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('RTOService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordRTO', () => {
    it('should successfully record RTO and update related entities', async () => {
      const mockOrder = { id: 'order-1', status: OrderStatus.SHIPPED, customerId: 'customer-1' };
      const mockShipment = { id: 'shipment-1' };
      const mockReputation = { userId: 'customer-1', totalOrders: 5, rtoOrders: 0 };
      const mockRTO = { id: 'rto-1', orderId: 'order-1', shipmentId: 'shipment-1', reason: RTOReason.CUSTOMER_UNAVAILABLE };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.shipment.findUnique as jest.Mock).mockResolvedValue(mockShipment);
      (prisma.rTO.create as jest.Mock).mockResolvedValue(mockRTO);
      (prisma.customerReputation.findUnique as jest.Mock).mockResolvedValue(mockReputation);
      
      const result = await rtoService.recordRTO('shipment-1', 'order-1', RTOReason.CUSTOMER_UNAVAILABLE, 'Customer not found');

      expect(prisma.order.findUnique).toHaveBeenCalledWith({ where: { id: 'order-1' } });
      expect(prisma.rTO.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          reason: RTOReason.CUSTOMER_UNAVAILABLE,
          notes: 'Customer not found'
        })
      }));
      expect(prisma.shipment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: ShipmentStatus.RETURNED })
      }));
      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: OrderStatus.RTO }
      }));
      expect(prisma.customerReputation.update).toHaveBeenCalledWith({
        where: { userId: 'customer-1' },
        data: { rtoOrders: 1, rtoRate: 20 }
      });
      expect(result).toEqual(mockRTO);
    });

    it('should throw error if order is already RTO', async () => {
      const mockOrder = { id: 'order-1', status: OrderStatus.RTO, customerId: 'customer-1' };
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      await expect(rtoService.recordRTO('shipment-1', 'order-1', RTOReason.CUSTOMER_UNAVAILABLE))
        .rejects.toThrow(AppError);
    });
  });
});
