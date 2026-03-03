import { z } from 'zod';

export const addToCartValidator = z.object({
  product_id: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});

export type AddToCartInput = z.infer<typeof addToCartValidator>;