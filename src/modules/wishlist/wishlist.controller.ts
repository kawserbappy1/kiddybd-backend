import { Request, Response, NextFunction } from 'express';
import { wishlistService } from './wishlist.service';

export class WishlistController {
  async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const wishlist = await wishlistService.getWishlist(userId);
      res.status(200).json({
        success: true,
        data: wishlist
      });
    } catch (error) {
      next(error);
    }
  }

  async addToWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = req.params.productId as string;
      const result = await wishlistService.addToWishlist(userId, productId);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFromWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = req.params.productId as string;
      await wishlistService.removeFromWishlist(userId, productId);
      res.status(200).json({
        success: true,
        message: 'Removed from wishlist'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const wishlistController = new WishlistController();
