import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    cartId: z.string().uuid(),
    addressId: z.string().uuid(),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(['COD', 'ONLINE']),
  }),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>['body'];
