import { paymentService } from '../payment.service';
import { prisma } from '../../../database/prisma.service';
import { PaymentStatus, OrderStatus, InventoryReservationStatus } from '@prisma/client';
import { AppError } from '../../../common/errors';

jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    order: { findUnique: jest.fn(), update: jest.fn() },
    payment: { create: jest.fn(), update: jest.fn() },
    paymentTransaction: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    paymentWebhookEvent: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    inventoryReservation: { updateMany: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    $transaction: jest.fn((callback) => callback(prisma)),
  }
}));

// Mock the orderQueue to prevent actual Redis connections during tests
jest.mock('../../orders/order.service', () => ({
  orderQueue: {
    add: jest.fn()
  }
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('should throw error for invalid signature', async () => {
      await expect(paymentService.handleWebhook('SSLCommerz', {}, 'invalid_signature'))
        .rejects.toThrow('Invalid signature');
    });

    it('should ignore duplicate externalEventId (idempotency)', async () => {
      (prisma.paymentWebhookEvent.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-event' });

      const result = await paymentService.handleWebhook('SSLCommerz', { tran_id: 'tx1', status: 'VALID', val_id: 'ev1' }, 'valid_signature');
      
      expect(result.message).toBe('Webhook already processed');
      expect(prisma.paymentWebhookEvent.create).not.toHaveBeenCalled();
    });

    it('should process SUCCESS webhook and update order to CONFIRMED and inventory to COMMITTED', async () => {
      (prisma.paymentWebhookEvent.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.paymentWebhookEvent.create as jest.Mock).mockResolvedValue({ id: 'webhook-event-1' });
      (prisma.paymentTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'tx1',
        payment: { id: 'payment-1', orderId: 'order-1' }
      });

      await paymentService.handleWebhook('SSLCommerz', { tran_id: 'tx1', status: 'VALID', val_id: 'ev1' }, 'valid_signature');

      expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: PaymentStatus.COMPLETED } }));
      expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: PaymentStatus.COMPLETED } }));
      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.COMPLETED } }));
      expect(prisma.inventoryReservation.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: InventoryReservationStatus.COMMITTED } }));
      expect(prisma.orderStatusHistory.create).toHaveBeenCalled();
      expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: { processed: true, processedAt: expect.any(Date) } }));
    });

    it('should process FAILURE webhook without confirming order', async () => {
      (prisma.paymentWebhookEvent.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.paymentWebhookEvent.create as jest.Mock).mockResolvedValue({ id: 'webhook-event-2' });
      (prisma.paymentTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'tx2',
        payment: { id: 'payment-2', orderId: 'order-2' }
      });

      await paymentService.handleWebhook('SSLCommerz', { tran_id: 'tx2', status: 'FAILED', val_id: 'ev2' }, 'valid_signature');

      expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: PaymentStatus.FAILED } }));
      expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: PaymentStatus.FAILED } }));
      
      // Should NOT update order to CONFIRMED
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.inventoryReservation.updateMany).not.toHaveBeenCalled();
      
      expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: { processed: true, processedAt: expect.any(Date) } }));
    });
  });
});
