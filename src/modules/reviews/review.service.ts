import { prisma } from '../../database/prisma.service';
import { AppError } from '../../common/errors';
import { OrderStatus, ReviewStatus, MediaType } from '@prisma/client';

export interface CreateReviewDto {
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  media?: { type: MediaType; url: string }[];
}

export class ReviewService {
  async createReview(userId: string, dto: CreateReviewDto) {
    // Resolve product ID if slug was passed
    const isProductUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.productId);
    let resolvedProductId = dto.productId;
    if (!isProductUuid && prisma.product?.findUnique) {
      try {
        const prod = await prisma.product.findUnique({
          where: { slug: dto.productId },
          select: { id: true }
        });
        if (prod) {
          resolvedProductId = prod.id;
        }
      } catch {
        // Fallback to dto.productId
      }
    }

    if (dto.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: dto.orderId },
        include: { items: true }
      });

      if (!order) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
      }

      if (order.customerId !== userId) {
        throw new AppError('Unauthorized access to order', 403, 'FORBIDDEN');
      }

      if (order.status !== OrderStatus.DELIVERED) {
        throw new AppError('Order must be delivered to leave a review', 400, 'BAD_REQUEST');
      }

      const hasProduct = order.items.some(item => item.productId === resolvedProductId);
      if (!hasProduct) {
        throw new AppError('Product not found in this order', 403, 'FORBIDDEN');
      }

      const existing = await prisma.review.findUnique({
        where: {
          customerId_productId_orderId: {
            customerId: userId,
            productId: resolvedProductId,
            orderId: dto.orderId
          }
        }
      });

      if (existing) {
        throw new AppError('Review already exists for this product in this order', 409, 'CONFLICT');
      }

      return prisma.review.create({
        data: {
          customerId: userId,
          productId: resolvedProductId,
          orderId: dto.orderId,
          rating: dto.rating,
          title: dto.title,
          comment: dto.comment,
          verifiedPurchase: true,
          status: ReviewStatus.PENDING,
          media: dto.media ? {
            create: dto.media
          } : undefined
        },
        include: { media: true }
      });
    }

    // Direct product review without an orderId (e.g. from product details page)
    const directReview = await prisma.review.create({
      data: {
        customerId: userId,
        productId: resolvedProductId,
        orderId: resolvedProductId, // fallback reference for unique constraint
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        verifiedPurchase: true,
        status: ReviewStatus.APPROVED, // Direct customer reviews show immediately
        media: dto.media ? {
          create: dto.media
        } : undefined
      },
      include: { media: true, customer: { select: { name: true } } }
    });

    return directReview;
  }

  async approveReview(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');

    return prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.APPROVED }
    });
  }

  async rejectReview(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');

    return prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.REJECTED }
    });
  }

  async getProductReviews(productIdOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);
    let resolvedProductId = productIdOrSlug;

    if (!isUuid) {
      const product = await prisma.product.findUnique({
        where: { slug: productIdOrSlug },
        select: { id: true }
      });
      if (!product) {
        return [];
      }
      resolvedProductId = product.id;
    }

    return prisma.review.findMany({
      where: { productId: resolvedProductId, status: ReviewStatus.APPROVED },
      include: { media: true, customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllReviewsForAdmin() {
    return prisma.review.findMany({
      include: { media: true, product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const reviewService = new ReviewService();
