import { shipmentService } from '../shipment.service';
import { prisma } from '../../../database/prisma.service';
import { OrderStatus, ShipmentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    courier: {
      upsert: jest.fn(),
    },
    shipment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    shipmentEvent: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('ShipmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createShipment', () => {
    it('should create shipment and update order status', async () => {
      const orderId = randomUUID();
      const mockOrder = {
        id: orderId,
        status: OrderStatus.CONFIRMED,
        codAmount: 100,
        customer: { name: 'Test User', phone: '01711111111' },
        shippingAddressSnapshot: {
          addressLine: 'House 1',
          area: 'Dhanmondi',
          upazila: 'Dhanmondi',
          district: 'Dhaka',
          division: 'Dhaka',
        },
      };

      const mockCourier = { id: randomUUID() };
      const mockShipment = { id: randomUUID(), trackingId: 'MOCK-123' };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.courier.upsert as jest.Mock).mockResolvedValue(mockCourier);
      (prisma.shipment.create as jest.Mock).mockResolvedValue(mockShipment);

      const result = await shipmentService.createShipment(orderId, 'Mock');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING },
      });
      expect(prisma.shipment.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('handleCourierWebhook', () => {
    it('should update shipment and order status based on webhook (idempotent)', async () => {
      const trackingId = 'MOCK-123';
      const mockShipment = {
        id: randomUUID(),
        trackingId,
        order: { id: randomUUID(), status: OrderStatus.PROCESSING },
      };

      (prisma.shipment.findUnique as jest.Mock).mockResolvedValue(mockShipment);
      (prisma.shipmentEvent.findFirst as jest.Mock).mockResolvedValue(null); // No existing event

      const payload = { trackingId, status: 'delivered', eventId: 'event-1' };
      
      const result = await shipmentService.handleCourierWebhook('Mock', payload, 'valid');

      expect(result.success).toBe(true);
      expect(prisma.shipmentEvent.create).toHaveBeenCalled();
      expect(prisma.shipment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockShipment.id },
        data: expect.objectContaining({ status: ShipmentStatus.DELIVERED }),
      }));
      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockShipment.order.id },
        data: { status: OrderStatus.DELIVERED },
      }));
    });

    it('should ignore duplicate webhooks', async () => {
      const trackingId = 'MOCK-123';
      const mockShipment = {
        id: randomUUID(),
        trackingId,
        order: { id: randomUUID(), status: OrderStatus.PROCESSING },
      };

      (prisma.shipment.findUnique as jest.Mock).mockResolvedValue(mockShipment);
      (prisma.shipmentEvent.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-event' }); // Event exists

      const payload = { trackingId, status: 'delivered', eventId: 'event-1' };
      
      const result = await shipmentService.handleCourierWebhook('Mock', payload, 'valid');

      expect(result.message).toBe('Webhook already processed');
      expect(prisma.shipment.update).not.toHaveBeenCalled();
    });
  });
});
