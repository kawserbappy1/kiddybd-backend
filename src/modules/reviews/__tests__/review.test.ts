import { reviewService } from '../review.service';
import { prisma } from '../../../database/prisma.service';
import { OrderStatus, ReviewStatus } from '@prisma/client';

// Mock prisma methods
jest.mock('../../../database/prisma.service', () => ({
  prisma: {
    order: { findUnique: jest.fn() },
    product: { findUnique: jest.fn() },
    review: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  },
}));

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const validDto = {
      orderId: 'order-1',
      productId: 'prod-1',
      rating: 5,
      comment: 'Great product!'
    };

    it('should successfully create a review if order is delivered and valid', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: OrderStatus.DELIVERED,
        items: [{ productId: 'prod-1' }]
      };
      
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.review.create as jest.Mock).mockResolvedValue({ id: 'review-1', status: ReviewStatus.PENDING });

      const result = await reviewService.createReview('user-1', validDto);

      expect(prisma.review.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'user-1',
          productId: 'prod-1',
          rating: 5,
          status: ReviewStatus.PENDING
        })
      }));
      expect(result.id).toBe('review-1');
    });

    it('should throw error if non-purchaser attempts to review', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-2', // Different user
        status: OrderStatus.DELIVERED,
        items: [{ productId: 'prod-1' }]
      };
      
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      await expect(reviewService.createReview('user-1', validDto))
        .rejects.toThrow(/Unauthorized access/);
    });

    it('should throw error if order is undelivered', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: OrderStatus.SHIPPED, // Not delivered
        items: [{ productId: 'prod-1' }]
      };
      
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      await expect(reviewService.createReview('user-1', validDto))
        .rejects.toThrow(/must be delivered/);
    });

    it('should throw error if review is duplicate', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: OrderStatus.DELIVERED,
        items: [{ productId: 'prod-1' }]
      };
      
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.review.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-review' });

      await expect(reviewService.createReview('user-1', validDto))
        .rejects.toThrow(/already exists/);
    });
  });
});
