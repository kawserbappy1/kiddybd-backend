import { z } from 'zod';

export const addItemSchema = z.object({
  body: z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().positive(),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    quantity: z.number().int().positive(),
  }),
});

export const itemIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
