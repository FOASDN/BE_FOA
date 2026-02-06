import { PaymentMethod } from '@/types/order.type';
import z from 'zod';

export const voucherIdValidator = z.string().length(24, 'Voucher id không hợp lệ');

export const deliveryAddressValidator = z.object({
  label: z.string().optional(),
  receiver_name: z.string(),
  phone: z.string(),
  detail: z.string(),
  ward: z.string(),
  district: z.string(),
  city: z.string(),
});

export const orderItemValidator = z.object({
  product_id: z.string().length(24, 'Product id không hợp lệ'),
  quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
  variations: z.array(z.object({ name: z.string(), choice: z.string() })),
});

export type TOrderItem = z.infer<typeof orderItemValidator>;

export const placeOrderValidator = z.object({
  voucher: voucherIdValidator,
  payment_method: z.enum(PaymentMethod).default(PaymentMethod.CASH_ON_DELIVERY),
  items: z.array(orderItemValidator).min(1, 'Phải có ít nhất một sản phẩm'),
});

export type TPlaceOrderValidator = z.infer<typeof placeOrderValidator>;
