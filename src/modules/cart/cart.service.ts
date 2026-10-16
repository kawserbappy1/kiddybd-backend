import { prisma } from '../../database/prisma.service';
import { NotFoundError, ValidationError } from '../../common/errors';

export class CartService {
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
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
      cart = await prisma.cart.create({
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

  async addItem(userId: string, variantId: string, quantity: string | number) {
    const qty = Number(quantity);
    
    // Check if variant exists and is active
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundError('Variant not found');
    }
    if (!variant.isActive) {
      throw new ValidationError('Variant is not active');
    }
    if (variant.product.status !== 'ACTIVE') {
      throw new ValidationError('Product is not active');
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId },
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + qty },
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: variant.productId,
        variantId,
        quantity: qty,
      },
    });
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundError('Cart item not found');

    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundError('Cart item not found');

    return prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    return prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}

export const cartService = new CartService();
