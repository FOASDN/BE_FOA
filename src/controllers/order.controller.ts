import { placeOrder } from '@/services/order.service';
import { catchErrors } from '@/utils/asyncHandler';
import { placeOrderValidator } from '@/validators/order.validator';

export const placeOrderHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const input = placeOrderValidator.parse(req.body);

  const order = await placeOrder(userId, input);

  return res.success(201, {
    data: order,
    message: 'Order placed successfully',
  });
});
