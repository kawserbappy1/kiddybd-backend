import { Request, Response, NextFunction } from 'express';
import { couponService } from './coupon.service';
import { promotionService } from './promotion.service';

export class CouponController {
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
