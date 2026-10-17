import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/prisma.service';
import { couponService } from './coupon.service';
import { promotionService } from './promotion.service';

export class CouponController {
  async applyCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, subtotal } = req.body;
      const numSubtotal = Number(subtotal || 0);
      const cleanCode = String(code || '').trim().toUpperCase();

      if (!cleanCode) {
        return res.status(200).json({
          success: true,
          data: {
            valid: false,
            code: cleanCode,
            discountPercent: 0,
            discountAmount: 0,
            message: 'Please enter a coupon code.',
          },
        });
      }

      const now = new Date();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (!coupon || !coupon.isActive) {
        return res.status(200).json({
          success: true,
          data: {
            valid: false,
            code: cleanCode,
            discountPercent: 0,
            discountAmount: 0,
            message: 'Invalid or inactive coupon code.',
          },
        });
      }

      if (now < coupon.startDate || now > coupon.endDate) {
        return res.status(200).json({
          success: true,
          data: {
            valid: false,
            code: cleanCode,
            discountPercent: 0,
            discountAmount: 0,
            message: 'This coupon has expired or is not yet active.',
          },
        });
      }

      if (coupon.minimumOrderAmount && numSubtotal < Number(coupon.minimumOrderAmount)) {
        return res.status(200).json({
          success: true,
          data: {
            valid: false,
            code: cleanCode,
            discountPercent: 0,
            discountAmount: 0,
            message: `Minimum order amount for this coupon is ৳${Number(coupon.minimumOrderAmount).toLocaleString()}.`,
          },
        });
      }

      let discountAmount = 0;
      let discountPercent = 0;

      if (coupon.type === 'PERCENTAGE') {
        discountPercent = Number(coupon.value);
        discountAmount = Math.round((numSubtotal * discountPercent) / 100);
        if (coupon.maximumDiscount && discountAmount > Number(coupon.maximumDiscount)) {
          discountAmount = Number(coupon.maximumDiscount);
        }
      } else if (coupon.type === 'FIXED') {
        discountAmount = Number(coupon.value);
        discountPercent = numSubtotal > 0 ? Math.round((discountAmount / numSubtotal) * 100) : 0;
      } else {
        // Free delivery type
        discountAmount = 60; // Standard shipping waiver
        discountPercent = 100;
      }

      if (discountAmount > numSubtotal) discountAmount = numSubtotal;

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          code: coupon.code,
          discountPercent,
          discountAmount,
          message: `Coupon "${coupon.code}" applied successfully!`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async validateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { code, cartItems, orderTotal } = req.body;

      const result = await couponService.validateCoupon(code, userId, cartItems, orderTotal);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivePromotions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await promotionService.getActivePromotions();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getBannerCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await couponService.getBannerCoupon();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkActiveCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const hasActive = await couponService.hasActiveCoupons();
      res.status(200).json({
        success: true,
        data: { hasActive },
      });
    } catch (error) {
      next(error);
    }
  }

  async listCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await couponService.getAllCoupons();
      res.status(200).json({
        success: true,
        data: { coupons: result },
      });
    } catch (error) {
      next(error);
    }
  }

  async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await couponService.createCoupon(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await couponService.updateCoupon(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      await couponService.deleteCoupon(req.params.id as string);
      res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async createPromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await promotionService.createPromotion(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updatePromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await promotionService.updatePromotion(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const couponController = new CouponController();
