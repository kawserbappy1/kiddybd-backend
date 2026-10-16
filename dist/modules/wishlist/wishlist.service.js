"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistService = exports.WishlistService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
class WishlistService {
    async getWishlist(userId) {
        let wishlist = await prisma_service_1.prisma.wishlist.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                media: { where: { isPrimary: true } },
                                variants: { where: { isActive: true } }
                            }
                        }
                    },
                    orderBy: { addedAt: 'desc' }
                }
            }
        });
        if (!wishlist) {
            wishlist = await prisma_service_1.prisma.wishlist.create({
                data: { userId },
                include: { items: { include: { product: { select: { id: true, name: true, slug: true, media: { where: { isPrimary: true } }, variants: { where: { isActive: true } } } } } } }
            });
        }
        return wishlist;
    }
    async addToWishlist(userId, productId) {
        const product = await prisma_service_1.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new errors_1.AppError('Product not found', 404, 'NOT_FOUND');
        }
        let wishlist = await prisma_service_1.prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
            wishlist = await prisma_service_1.prisma.wishlist.create({ data: { userId } });
        }
        const existingItem = await prisma_service_1.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId
                }
            }
        });
        if (existingItem) {
            throw new errors_1.AppError('Product is already in wishlist', 409, 'CONFLICT');
        }
        return prisma_service_1.prisma.wishlistItem.create({
            data: {
                wishlistId: wishlist.id,
                productId
            }
        });
    }
    async removeFromWishlist(userId, productId) {
        const wishlist = await prisma_service_1.prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
            throw new errors_1.AppError('Wishlist item not found', 404, 'NOT_FOUND');
        }
        const existingItem = await prisma_service_1.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId
                }
            }
        });
        if (!existingItem) {
            throw new errors_1.AppError('Wishlist item not found', 404, 'NOT_FOUND');
        }
        await prisma_service_1.prisma.wishlistItem.delete({
            where: {
                id: existingItem.id
            }
        });
        return { success: true };
    }
}
exports.WishlistService = WishlistService;
exports.wishlistService = new WishlistService();
