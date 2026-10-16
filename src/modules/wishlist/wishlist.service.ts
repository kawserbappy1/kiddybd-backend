import { prisma } from '../../database/prisma.service';
import { AppError } from '../../common/errors';

export class WishlistService {
  async getWishlist(userId: string) {
    let wishlist = await prisma.wishlist.findUnique({
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
      wishlist = await prisma.wishlist.create({
        data: { userId },
        include: { items: { include: { product: { select: { id: true, name: true, slug: true, media: { where: { isPrimary: true } }, variants: { where: { isActive: true } } } } } } }
      });
    }

    return wishlist;
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      }
    });

    if (existingItem) {
      throw new AppError('Product is already in wishlist', 409, 'CONFLICT');
    }

    return prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId
      }
    });
  }

  async removeFromWishlist(userId: string, productId: string) {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      throw new AppError('Wishlist item not found', 404, 'NOT_FOUND');
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      }
    });

    if (!existingItem) {
      throw new AppError('Wishlist item not found', 404, 'NOT_FOUND');
    }

    await prisma.wishlistItem.delete({
      where: {
        id: existingItem.id
      }
    });

    return { success: true };
  }
}

export const wishlistService = new WishlistService();
