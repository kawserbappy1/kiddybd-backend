"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoutes = void 0;
const express_1 = require("express");
const review_controller_1 = require("./review.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Public Routes
router.get('/products/:id/reviews', review_controller_1.reviewController.getProductReviews);
// Customer Routes
router.post('/reviews', auth_middleware_1.authenticate, review_controller_1.reviewController.createReview);
// Admin / Content Manager Routes
router.get('/admin/reviews', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), review_controller_1.reviewController.getAllReviewsForAdmin);
router.patch('/admin/reviews/:id/approve', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), review_controller_1.reviewController.approveReview);
router.patch('/admin/reviews/:id/reject', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), review_controller_1.reviewController.rejectReview);
exports.reviewRoutes = router;
