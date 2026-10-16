import { Router } from 'express';
import { reviewController } from './review.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Public Routes
router.get('/products/:id/reviews', reviewController.getProductReviews);

// Customer Routes
router.post('/reviews', authenticate, reviewController.createReview);

// Admin / Content Manager Routes
router.get(
  '/admin/reviews',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  reviewController.getAllReviewsForAdmin
);

router.patch(
  '/admin/reviews/:id/approve',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  reviewController.approveReview
);

router.patch(
  '/admin/reviews/:id/reject',
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  reviewController.rejectReview
);

export const reviewRoutes = router;
