"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponController = exports.CouponController = void 0;
const coupon_service_1 = require("./coupon.service");
const promotion_service_1 = require("./promotion.service");
class CouponController {
    async validateCoupon(req, res, next) {
        try {
            const userId = req.user.id;
            const { code, cartItems, orderTotal } = req.body;
            const result = await coupon_service_1.couponService.validateCoupon(code, userId, cartItems, orderTotal);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getActivePromotions(req, res, next) {
        try {
            const result = await promotion_service_1.promotionService.getActivePromotions();
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getBannerCoupon(req, res, next) {
        try {
            const result = await coupon_service_1.couponService.getBannerCoupon();
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async listCoupons(req, res, next) {
        try {
            const result = await coupon_service_1.couponService.getAllCoupons();
            res.status(200).json({
                success: true,
                data: { coupons: result },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createCoupon(req, res, next) {
        try {
            const result = await coupon_service_1.couponService.createCoupon(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCoupon(req, res, next) {
        try {
            const result = await coupon_service_1.couponService.updateCoupon(req.params.id, req.body);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCoupon(req, res, next) {
        try {
            await coupon_service_1.couponService.deleteCoupon(req.params.id);
            res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    async createPromotion(req, res, next) {
        try {
            const result = await promotion_service_1.promotionService.createPromotion(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async updatePromotion(req, res, next) {
        try {
            const result = await promotion_service_1.promotionService.updatePromotion(req.params.id, req.body);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CouponController = CouponController;
exports.couponController = new CouponController();
