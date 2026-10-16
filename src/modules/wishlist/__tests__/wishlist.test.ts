import { wishlistService } from '../wishlist.service';
import { prisma } from '../../../database/prisma.service';
import { AppError } from '../../../common/errors';

// Mock prisma methods
jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    product: { findUnique: jest.fn() },
    wishlist: { findUnique: jest.fn(), create: jest.fn() },
    wishlistItem: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  },
}));

describe('WishlistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToWishlist', () => {
    it('should successfully add a product to wishlist', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1' });
      (prisma.wishlist.findUnique as jest.Mock).mockResolvedValue({ id: 'wishlist-1', userId: 'user-1' });
      (prisma.wishlistItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.wishlistItem.create as jest.Mock).mockResolvedValue({ id: 'item-1', wishlistId: 'wishlist-1', productId: 'prod-1' });

      const result = await wishlistService.addToWishlist('user-1', 'prod-1');

      expect(prisma.wishlistItem.create).toHaveBeenCalledWith({
        data: {
          wishlistId: 'wishlist-1',
          productId: 'prod-1'
        }
      });
      expect(result.id).toBe('item-1');
    });

    it('should throw 409 CONFLICT if duplicate add', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1' });
      (prisma.wishlist.findUnique as jest.Mock).mockResolvedValue({ id: 'wishlist-1', userId: 'user-1' });
      (prisma.wishlistItem.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-item' });

      await expect(wishlistService.addToWishlist('user-1', 'prod-1'))
        .rejects.toThrow(/already in wishlist/);
    });
  });

  describe('removeFromWishlist', () => {
    it('should throw 404 if item does not exist', async () => {
      (prisma.wishlist.findUnique as jest.Mock).mockResolvedValue({ id: 'wishlist-1', userId: 'user-1' });
      (prisma.wishlistItem.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(wishlistService.removeFromWishlist('user-1', 'non-existent-prod'))
        .rejects.toThrow(/Wishlist item not found/);
    });
  });
});
