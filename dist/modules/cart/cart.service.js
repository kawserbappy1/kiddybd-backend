"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = exports.CartService = void 0;
const prisma_service_1 = require("../../database/prisma.service");
const errors_1 = require("../../common/errors");
class CartService {
    async getCart(userId) {
        let cart = await prisma_service_1.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                status: true,
                            },
                        },
                        variant: {
                            select: {
                                id: true,
                                sku: true,
                                title: true,
                                price: true,
                                isActive: true,
                                inventory: {
                                    select: {
                                        quantity: true,
                                        reservedQuantity: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!cart) {
            cart = await prisma_service_1.prisma.cart.create({
                data: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    status: true,
                                },
                            },
                            variant: {
                                select: {
                                    id: true,
                                    sku: true,
                                    title: true,
                                    price: true,
                                    isActive: true,
                                    inventory: {
                                        select: {
                                            quantity: true,
                                            reservedQuantity: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        return cart;
    }
    async addItem(userId, variantId, quantity) {
        const qty = Number(quantity);
        // Check if variant exists and is active
        const variant = await prisma_service_1.prisma.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true },
        });
        if (!variant) {
            throw new errors_1.NotFoundError('Variant not found');
        }
        if (!variant.isActive) {
            throw new errors_1.ValidationError('Variant is not active');
        }
        if (variant.product.status !== 'ACTIVE') {
            throw new errors_1.ValidationError('Product is not active');
        }
        let cart = await prisma_service_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma_service_1.prisma.cart.create({ data: { userId } });
        }
        // Check if item already in cart
        const existingItem = await prisma_service_1.prisma.cartItem.findFirst({
            where: { cartId: cart.id, variantId },
        });
        if (existingItem) {
            return prisma_service_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + qty },
            });
        }
        return prisma_service_1.prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId: variant.productId,
                variantId,
                quantity: qty,
            },
        });
    }
    async updateItem(userId, itemId, quantity) {
        const cart = await prisma_service_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart)
            throw new errors_1.NotFoundError('Cart not found');
        const item = await prisma_service_1.prisma.cartItem.findFirst({
            where: { id: itemId, cartId: cart.id },
        });
        if (!item)
            throw new errors_1.NotFoundError('Cart item not found');
        return prisma_service_1.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
        });
    }
    async removeItem(userId, itemId) {
        const cart = await prisma_service_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart)
            throw new errors_1.NotFoundError('Cart not found');
        const item = await prisma_service_1.prisma.cartItem.findFirst({
            where: { id: itemId, cartId: cart.id },
        });
        if (!item)
            throw new errors_1.NotFoundError('Cart item not found');
        return prisma_service_1.prisma.cartItem.delete({
            where: { id: itemId },
        });
    }
    async clearCart(userId) {
        const cart = await prisma_service_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart)
            return;
        return prisma_service_1.prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
    }
}
exports.CartService = CartService;
exports.cartService = new CartService();
