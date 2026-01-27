import z from 'zod';

export const createStaffValidator = z.object({
  email: z.string().email('email không hợp lệ'),
  phone: z.string().optional(),
});