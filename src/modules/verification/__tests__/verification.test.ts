import { verificationService } from '../verification.service';
import { prisma } from '../../../database/prisma.service';
import { redis } from '../../../config/redis';
import { OrderVerificationType, OrderVerificationStatus, OrderStatus } from '@prisma/client';
import { AppError } from '../../../common/errors';

jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    order: { findUnique: jest.fn(), update: jest.fn() },
    orderVerification: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    $transaction: jest.fn((callback) => callback(prisma)),
  }
}));

jest.mock('../../../config/redis', () => ({
  redis: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

describe('VerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createVerification', () => {
    it('should create a new verification and send OTP', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 'order-1', status: OrderStatus.VERIFICATION_REQUIRED });
      (prisma.orderVerification.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.orderVerification.create as jest.Mock).mockResolvedValue({ id: 'ver-1' });

      const result = await verificationService.createVerification('order-1', OrderVerificationType.OTP);
      
      expect(result.verificationId).toBe('ver-1');
      expect(result.otp).toBeDefined();
      expect(redis.set).toHaveBeenCalledTimes(2); // otp and cooldown
    });

    it('should fail if order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(verificationService.createVerification('order-1', OrderVerificationType.OTP))
        .rejects.toThrow(AppError);
    });

    it('should fail if order does not require verification', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 'order-1', status: OrderStatus.CONFIRMED });
      
      await expect(verificationService.createVerification('order-1', OrderVerificationType.OTP))
        .rejects.toThrow(AppError);
    });
  });

  describe('verifyOrder', () => {
    it('should successfully verify OTP and update order to CONFIRMED', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 'order-1', customerId: 'user-1', status: OrderStatus.VERIFICATION_REQUIRED });
      (prisma.orderVerification.findFirst as jest.Mock).mockResolvedValue({ 
        id: 'ver-1', 
        status: OrderVerificationStatus.PENDING,
        attempts: 0,
        expiresAt: new Date(Date.now() + 50000) 
      });
      (redis.get as jest.Mock).mockResolvedValue('123456');

      await verificationService.verifyOrder('order-1', 'user-1', '123456');

      expect(prisma.orderVerification.update).toHaveBeenCalledWith(expect.objectContaining({ data: { attempts: { increment: 1 } } }));
      expect(prisma.orderVerification.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: OrderVerificationStatus.VERIFIED, verifiedAt: expect.any(Date) } }));
      expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order-1' }, data: { status: OrderStatus.CONFIRMED } });
      expect(redis.del).toHaveBeenCalled();
    });

    it('should fail if OTP is expired', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 'order-1', customerId: 'user-1', status: OrderStatus.VERIFICATION_REQUIRED });
      (prisma.orderVerification.findFirst as jest.Mock).mockResolvedValue({ 
        id: 'ver-1', 
        status: OrderVerificationStatus.PENDING,
        attempts: 0,
        expiresAt: new Date(Date.now() - 50000) // Expired
      });

      await expect(verificationService.verifyOrder('order-1', 'user-1', '123456'))
        .rejects.toThrow('Verification expired');
      
      expect(prisma.orderVerification.update).toHaveBeenCalledWith({ where: { id: 'ver-1' }, data: { status: OrderVerificationStatus.EXPIRED } });
    });

    it('should fail if max attempts reached', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 'order-1', customerId: 'user-1', status: OrderStatus.VERIFICATION_REQUIRED });
      (prisma.orderVerification.findFirst as jest.Mock).mockResolvedValue({ 
        id: 'ver-1', 
        status: OrderVerificationStatus.PENDING,
        attempts: 5,
        expiresAt: new Date(Date.now() + 50000) 
      });

      await expect(verificationService.verifyOrder('order-1', 'user-1', '123456'))
        .rejects.toThrow('Maximum attempts reached. Please request a new OTP');
      
      expect(prisma.orderVerification.update).toHaveBeenCalledWith({ where: { id: 'ver-1' }, data: { status: OrderVerificationStatus.FAILED } });
    });

    it('should fail for invalid OTP', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 'order-1', customerId: 'user-1', status: OrderStatus.VERIFICATION_REQUIRED });
      (prisma.orderVerification.findFirst as jest.Mock).mockResolvedValue({ 
        id: 'ver-1', 
        status: OrderVerificationStatus.PENDING,
        attempts: 0,
        expiresAt: new Date(Date.now() + 50000) 
      });
      (redis.get as jest.Mock).mockResolvedValue('123456');

      await expect(verificationService.verifyOrder('order-1', 'user-1', '000000'))
        .rejects.toThrow('Invalid OTP');
    });
  });
});
