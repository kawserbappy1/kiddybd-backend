import { prisma } from '../../database/prisma.service';
import { AppError } from '../../common/errors';
import { CouponType, Prisma } from '@prisma/client';

export class CouponService {
  async validateCoupon(code: string, userId: string, cartItems: any[], orderTotal: number) {
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: {
        products: true,
        categories: true
      }
    });

    if (!coupon) throw new AppError('Invalid coupon', 400, 'BAD_REQUEST');
    if (!coupon.isActive) throw new AppError('Coupon is inactive', 400, 'BAD_REQUEST');

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new AppError('Coupon is expired or not yet active', 400, 'BAD_REQUEST');
    }

    if (coupon.minimumOrderAmount && orderTotal < Number(coupon.minimumOrderAmount)) {
      throw new AppError(`Minimum order amount is ${coupon.minimumOrderAmount}`, 400, 'BAD_REQUEST');
    }

    // Check limits using atomic constraints when possible, or check count for now
    if (coupon.usageLimit !== null) {
      const totalUsage = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
      if (totalUsage >= coupon.usageLimit) {
        throw new AppError('Coupon usage limit exceeded', 400, 'BAD_REQUEST');
      }
    }

    if (coupon.perUserLimit !== null) {
      const userUsage = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
      if (userUsage >= coupon.perUserLimit) {
        throw new AppError('Per user limit exceeded', 400, 'BAD_REQUEST');
      }
    }

    // Calculate applicable total based on category/product restrictions
    let applicableItems = cartItems;
    if (coupon.products.length > 0 || coupon.categories.length > 0) {
      const allowedProductIds = new Set(coupon.products.map(p => p.productId));
      const allowedCategoryIds = new Set(coupon.categories.map(c => c.categoryId));
      
      // Assume cartItems have product object with categoryId inside.
      applicableItems = cartItems.filter(item => {
        const pId = item.productId || item.product?.id;
        const cId = item.categoryId || item.product?.categoryId;
        return allowedProductIds.has(pId) || allowedCategoryIds.has(cId);
      });

      if (applicableItems.length === 0) {
        throw new AppError('Coupon is not applicable to any items in the cart', 400, 'BAD_REQUEST');
      }
    }

    let discount = 0;
    const applicableTotal = applicableItems.reduce((acc, item) => acc + (Number(item.price || item.unitPrice || 0) * item.quantity), 0);

    if (coupon.type === CouponType.FIXED) {
      discount = Number(coupon.value);
    } else if (coupon.type === CouponType.PERCENTAGE) {
      discount = applicableTotal * (Number(coupon.value) / 100);
      if (coupon.maximumDiscount && discount > Number(coupon.maximumDiscount)) {
        discount = Number(coupon.maximumDiscount);
      }
    } else if (coupon.type === CouponType.FREE_DELIVERY) {
      discount = 0; // Discount calculation for delivery charge happens elsewhere or returned separately
    }

    if (discount > orderTotal) discount = orderTotal;

    return {
      valid: true,
      discount,
      finalTotal: orderTotal - discount,
      type: coupon.type,
      couponId: coupon.id
    };
  }

  async applyCoupon(tx: Prisma.TransactionClient, couponId: string, userId: string, orderId: string, discountAmount: number) {
    // Should be executed inside an order creation transaction
    return tx.couponUsage.create({
      data: {
        couponId,
        userId,
        orderId,
        discountAmount
      }
    });
  }

  async getAllCoupons() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });
  }

  async getBannerCoupon() {
    const now = new Date();
    const coupon = await prisma.coupon.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!coupon) return null;

    let displayText = '';
    if (coupon.type === 'PERCENTAGE') {
      displayText = `Extra ${Number(coupon.value)}% OFF code: ${coupon.code}`;
    } else if (coupon.type === 'FIXED') {
      displayText = `Flat ৳${Number(coupon.value)} OFF code: ${coupon.code}`;
    } else {
      displayText = `Free Delivery code: ${coupon.code}`;
    }

    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minimumOrderAmount: coupon.minimumOrderAmount ? Number(coupon.minimumOrderAmount) : null,
      displayText,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
    };
  }

  async createCoupon(dto: any) {
    const code = String(dto.code || '').trim().toUpperCase();
    if (!code) {
      throw new AppError('Coupon code is required', 400, 'BAD_REQUEST');
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new AppError('Coupon code already exists', 400, 'BAD_REQUEST');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return prisma.coupon.create({
      data: {
        code,
        type: dto.type || 'PERCENTAGE',
        value: Number(dto.value || 0),
        minimumOrderAmount: dto.minimumOrderAmount ? Number(dto.minimumOrderAmount) : null,
        maximumDiscount: dto.maximumDiscount ? Number(dto.maximumDiscount) : null,
        usageLimit: dto.usageLimit ? Number(dto.usageLimit) : null,
        perUserLimit: dto.perUserLimit ? Number(dto.perUserLimit) : null,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
        startDate,
        endDate,
      },
    });
  }

  async updateCoupon(id: string, dto: any) {
    const data: any = {};
    if (dto.code) data.code = String(dto.code).trim().toUpperCase();
    if (dto.type) data.type = dto.type;
    if (dto.value !== undefined) data.value = Number(dto.value);
    if (dto.minimumOrderAmount !== undefined) {
      data.minimumOrderAmount = dto.minimumOrderAmount ? Number(dto.minimumOrderAmount) : null;
    }
    if (dto.maximumDiscount !== undefined) {
      data.maximumDiscount = dto.maximumDiscount ? Number(dto.maximumDiscount) : null;
    }
    if (dto.usageLimit !== undefined) {
      data.usageLimit = dto.usageLimit ? Number(dto.usageLimit) : null;
    }
    if (dto.perUserLimit !== undefined) {
      data.perUserLimit = dto.perUserLimit ? Number(dto.perUserLimit) : null;
    }
    if (dto.isActive !== undefined) data.isActive = Boolean(dto.isActive);
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return prisma.coupon.update({
      where: { id },
      data,
    });
  }

  async deleteCoupon(id: string) {
    return prisma.coupon.delete({ where: { id } });
  }
}

export const couponService = new CouponService();
