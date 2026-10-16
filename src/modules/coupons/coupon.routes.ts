import { Router } from 'express';
import { couponController } from './coupon.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Public Routes
router.get('/promotions', couponController.getActivePromotions);
router.get('/coupons/banner', couponController.getBannerCoupon);

// Customer Routes
router.post('/coupons/validate', authenticate, couponController.validateCoupon);

// Admin Routes (SUPER_ADMIN, ADMIN)
router.get(
  '/admin/coupons',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN']),
  couponController.listCoupons
);

router.post(
  '/admin/coupons',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN']),
  couponController.createCoupon
);

router.patch(
  '/admin/coupons/:id',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN']),
  couponController.updateCoupon
);

router.delete(
  '/admin/coupons/:id',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN']),
  couponController.deleteCoupon
);

router.post(
  '/admin/promotions',
  authenticate,
  authorize(['SUPER_ADMIN']),
  couponController.createPromotion
);

router.patch(
  '/admin/promotions/:id',
  authenticate,
  authorize(['SUPER_ADMIN']),
  couponController.updatePromotion
);

export const couponRoutes = router;
