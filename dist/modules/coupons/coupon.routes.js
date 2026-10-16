"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponRoutes = void 0;
const express_1 = require("express");
const coupon_controller_1 = require("./coupon.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Public Routes
router.get('/promotions', coupon_controller_1.couponController.getActivePromotions);
router.get('/coupons/banner', coupon_controller_1.couponController.getBannerCoupon);
// Customer Routes
router.post('/coupons/validate', auth_middleware_1.authenticate, coupon_controller_1.couponController.validateCoupon);
// Admin Routes (SUPER_ADMIN, ADMIN)
router.get('/admin/coupons', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN']), coupon_controller_1.couponController.listCoupons);
router.post('/admin/coupons', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN']), coupon_controller_1.couponController.createCoupon);
router.patch('/admin/coupons/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN']), coupon_controller_1.couponController.updateCoupon);
router.delete('/admin/coupons/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN']), coupon_controller_1.couponController.deleteCoupon);
router.post('/admin/promotions', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN']), coupon_controller_1.couponController.createPromotion);
router.patch('/admin/promotions/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN']), coupon_controller_1.couponController.updatePromotion);
exports.couponRoutes = router;
