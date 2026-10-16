"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = exports.ReviewService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
const client_1 = require("@prisma/client");
class ReviewService {
    async createReview(userId, dto) {
        // Resolve product ID if slug was passed
        const isProductUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.productId);
        let resolvedProductId = dto.productId;
        if (!isProductUuid && prisma_service_1.prisma.product?.findUnique) {
            try {
                const prod = await prisma_service_1.prisma.product.findUnique({
                    where: { slug: dto.productId },
                    select: { id: true }
                });
                if (prod) {
                    resolvedProductId = prod.id;
                }
            }
            catch {
                // Fallback to dto.productId
            }
        }
        if (dto.orderId) {
            const order = await prisma_service_1.prisma.order.findUnique({
                where: { id: dto.orderId },
                include: { items: true }
            });
            if (!order) {
                throw new errors_1.AppError('Order not found', 404, 'NOT_FOUND');
            }
            if (order.customerId !== userId) {
                throw new errors_1.AppError('Unauthorized access to order', 403, 'FORBIDDEN');
            }
            if (order.status !== client_1.OrderStatus.DELIVERED) {
                throw new errors_1.AppError('Order must be delivered to leave a review', 400, 'BAD_REQUEST');
            }
            const hasProduct = order.items.some(item => item.productId === resolvedProductId);
            if (!hasProduct) {
                throw new errors_1.AppError('Product not found in this order', 403, 'FORBIDDEN');
            }
            const existing = await prisma_service_1.prisma.review.findUnique({
                where: {
                    customerId_productId_orderId: {
                        customerId: userId,
                        productId: resolvedProductId,
                        orderId: dto.orderId
                    }
                }
            });
            if (existing) {
                throw new errors_1.AppError('Review already exists for this product in this order', 409, 'CONFLICT');
            }
            return prisma_service_1.prisma.review.create({
                data: {
                    customerId: userId,
                    productId: resolvedProductId,
                    orderId: dto.orderId,
                    rating: dto.rating,
                    title: dto.title,
                    comment: dto.comment,
                    verifiedPurchase: true,
                    status: client_1.ReviewStatus.PENDING,
                    media: dto.media ? {
                        create: dto.media
                    } : undefined
                },
                include: { media: true }
            });
        }
        // Direct product review without an orderId (e.g. from product details page)
        const directReview = await prisma_service_1.prisma.review.create({
            data: {
                customerId: userId,
                productId: resolvedProductId,
                orderId: resolvedProductId, // fallback reference for unique constraint
                rating: dto.rating,
                title: dto.title,
                comment: dto.comment,
                verifiedPurchase: true,
                status: client_1.ReviewStatus.APPROVED, // Direct customer reviews show immediately
                media: dto.media ? {
                    create: dto.media
                } : undefined
            },
            include: { media: true, customer: { select: { name: true } } }
        });
        return directReview;
    }
    async approveReview(reviewId) {
        const review = await prisma_service_1.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review)
            throw new errors_1.AppError('Review not found', 404, 'NOT_FOUND');
        return prisma_service_1.prisma.review.update({
            where: { id: reviewId },
            data: { status: client_1.ReviewStatus.APPROVED }
        });
    }
    async rejectReview(reviewId) {
        const review = await prisma_service_1.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review)
            throw new errors_1.AppError('Review not found', 404, 'NOT_FOUND');
        return prisma_service_1.prisma.review.update({
            where: { id: reviewId },
            data: { status: client_1.ReviewStatus.REJECTED }
        });
    }
    async getProductReviews(productIdOrSlug) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);
        let resolvedProductId = productIdOrSlug;
        if (!isUuid) {
            const product = await prisma_service_1.prisma.product.findUnique({
                where: { slug: productIdOrSlug },
                select: { id: true }
            });
            if (!product) {
                return [];
            }
            resolvedProductId = product.id;
        }
        return prisma_service_1.prisma.review.findMany({
            where: { productId: resolvedProductId, status: client_1.ReviewStatus.APPROVED },
            include: { media: true, customer: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAllReviewsForAdmin() {
        return prisma_service_1.prisma.review.findMany({
            include: { media: true, product: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
}
exports.ReviewService = ReviewService;
exports.reviewService = new ReviewService();
