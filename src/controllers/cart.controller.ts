import { OK } from '@/constants/http';
import { catchErrors } from '@/utils/asyncHandler';
import { addToCart } from '@/services/cart.service';
import { addToCartValidator } from '@/validators/cart.validator';

export const addToCartHandler = catchErrors(async (req, res) => {
  const user = req.userId;
  const input = addToCartValidator.parse(req.body);

  const cart = await addToCart(user, input);

  return res.success(OK, {
    data: cart,
    message: 'Thêm vào giỏ thành công.',
  });
});