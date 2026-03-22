import { OK } from '@/constants/http';
import { catchErrors } from '@/utils/asyncHandler';
import { addToCart, getCart } from '@/services/cart.service';
import { addToCartValidator } from '@/validators/cart.validator';

export const getCartHandler = catchErrors(async (req, res) => {
  const user = req.userId;
  const cart = await getCart(user);

  return res.success(OK, {
    data: cart,
  });
});

export const addToCartHandler = catchErrors(async (req, res) => {
  const user = req.userId;
  const input = addToCartValidator.parse(req.body);

  const cart = await addToCart(user, input);

  return res.success(OK, {
    data: cart,
    message: 'Thêm vào giỏ thành công.',
  });
});