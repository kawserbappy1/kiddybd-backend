"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistController = exports.WishlistController = void 0;
const wishlist_service_1 = require("./wishlist.service");
class WishlistController {
    async getWishlist(req, res, next) {
        try {
            const userId = req.user.id;
            const wishlist = await wishlist_service_1.wishlistService.getWishlist(userId);
            res.status(200).json({
                success: true,
                data: wishlist
            });
        }
        catch (error) {
            next(error);
        }
    }
    async addToWishlist(req, res, next) {
        try {
            const userId = req.user.id;
            const productId = req.params.productId;
            const result = await wishlist_service_1.wishlistService.addToWishlist(userId, productId);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async removeFromWishlist(req, res, next) {
        try {
            const userId = req.user.id;
            const productId = req.params.productId;
            await wishlist_service_1.wishlistService.removeFromWishlist(userId, productId);
            res.status(200).json({
                success: true,
                message: 'Removed from wishlist'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WishlistController = WishlistController;
exports.wishlistController = new WishlistController();
