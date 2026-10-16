import { Request, Response, NextFunction } from 'express';
import { reviewService } from './review.service';

export class ReviewController {
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await reviewService.createReview(userId, req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async approveReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = req.params.id as string;
      const result = await reviewService.approveReview(reviewId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = req.params.id as string;
      const result = await reviewService.rejectReview(reviewId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.id as string;
      const result = await reviewService.getProductReviews(productId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllReviewsForAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.getAllReviewsForAdmin();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
