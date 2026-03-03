import { z } from 'zod';

export const productValidator = z.object({
  name: z.string().min(1, 'Dish name is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  image: z.string().optional(), // File ID as string
  price: z.number().min(0, 'Price must be a positive number'),
  category: z.string().min(1, 'Category is required').trim(),
  restaurant: z.string().min(1, 'Restaurant name is required').trim(),
  time: z.string().min(1, 'Preparation time is required').trim(),
  recipe: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.string(),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional().default([]),
  health_warning: z.string().optional(),
  health_tags: z.array(z.string()).optional().default([]),
  isAvailable: z.boolean().optional().default(true),
});

export const updateProductValidator = productValidator.partial();
