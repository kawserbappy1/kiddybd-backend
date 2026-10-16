"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = exports.ReviewController = void 0;
const review_service_1 = require("./review.service");
class ReviewController {
    async createReview(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await review_service_1.reviewService.createReview(userId, req.body);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async approveReview(req, res, next) {
        try {
            const reviewId = req.params.id;
            const result = await review_service_1.reviewService.approveReview(reviewId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async rejectReview(req, res, next) {
        try {
            const reviewId = req.params.id;
            const result = await review_service_1.reviewService.rejectReview(reviewId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getProductReviews(req, res, next) {
        try {
            const productId = req.params.id;
            const result = await review_service_1.reviewService.getProductReviews(productId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllReviewsForAdmin(req, res, next) {
        try {
            const result = await review_service_1.reviewService.getAllReviewsForAdmin();
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReviewController = ReviewController;
exports.reviewController = new ReviewController();
