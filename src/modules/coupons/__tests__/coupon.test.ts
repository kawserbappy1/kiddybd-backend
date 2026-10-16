import { couponService } from '../coupon.service';
import { prisma } from '../../../database/prisma.service';
import { CouponType } from '@prisma/client';
import { AppError } from '../../../common/errors';

// Mock prisma methods
jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    coupon: { findUnique: jest.fn() },
    couponUsage: { count: jest.fn(), create: jest.fn() },
  },
}));

describe('CouponService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCoupon', () => {
    const validBaseCoupon = {
      id: 'coupon-1',
      code: 'TEST10',
      type: CouponType.FIXED,
      value: 100,
      isActive: true,
      startDate: new Date(Date.now() - 10000),
      endDate: new Date(Date.now() + 100000),
      minimumOrderAmount: null,
      maximumDiscount: null,
      usageLimit: null,
      perUserLimit: null,
      products: [],
      categories: []
    };

    const cartItems = [
      { productId: 'prod-1', categoryId: 'cat-1', price: 500, quantity: 1 }
    ];

    it('should validate a simple valid coupon', async () => {
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(validBaseCoupon);

      const result = await couponService.validateCoupon('TEST10', 'user-1', cartItems, 500);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(100);
      expect(result.finalTotal).toBe(400);
    });

    it('should throw if expired', async () => {
      const expiredCoupon = { ...validBaseCoupon, endDate: new Date(Date.now() - 1000) };
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(expiredCoupon);

      await expect(couponService.validateCoupon('TEST10', 'user-1', cartItems, 500))
        .rejects.toThrow(/expired/);
    });

    it('should throw if usageLimit exceeded', async () => {
      const limitedCoupon = { ...validBaseCoupon, usageLimit: 5 };
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(limitedCoupon);
      (prisma.couponUsage.count as jest.Mock).mockResolvedValue(5);

      await expect(couponService.validateCoupon('TEST10', 'user-1', cartItems, 500))
        .rejects.toThrow(/usage limit exceeded/);
    });

    it('should throw if perUserLimit exceeded', async () => {
      const limitedCoupon = { ...validBaseCoupon, perUserLimit: 1 };
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(limitedCoupon);
      (prisma.couponUsage.count as jest.Mock).mockResolvedValue(1);

      await expect(couponService.validateCoupon('TEST10', 'user-1', cartItems, 500))
        .rejects.toThrow(/Per user limit exceeded/);
    });

    it('should throw if category restriction mismatch', async () => {
      const restrictedCoupon = { 
        ...validBaseCoupon, 
        categories: [{ categoryId: 'cat-2' }] // Cart item is cat-1
      };
      (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(restrictedCoupon);

      await expect(couponService.validateCoupon('TEST10', 'user-1', cartItems, 500))
        .rejects.toThrow(/not applicable to any items in the cart/);
    });
  });
});
