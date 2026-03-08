import { CREATED, OK } from '@/constants/http';
import { getOrderById, getOrders, getUserOrders, placeOrder, updateOrderStatus } from '@/services/order.service';
import { OrderStatus } from '@/types/order.type';
import { catchErrors } from '@/utils/asyncHandler';
import { placeOrderValidator } from '@/validators/order.validator';

/**
 * POST /api/order
 * Authenticated — Customer places a new order.
 * Returns the created order (including `code` for display on success page).
 */
export const placeOrderHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const input = placeOrderValidator.parse(req.body);

  const order = await placeOrder(userId, input);

  return res.success(CREATED, {
    data: {
      _id: (order as any)._id,
      code: (order as any).code,
      status: (order as any).status || 'pending',
      items: (order as any).items || [],
      sub_total: (order as any).sub_total || 0,
      total_price: (order as any).total_price,
      payment: (order as any).payment || { method: input.payment_method },
      delivery_address: (order as any).delivery_address,
      voucher: (order as any).voucher,
      checkoutUrl: (order as any).checkoutUrl,
      createdAt: (order as any).createdAt || new Date(),
    },
    message: 'Đặt hàng thành công',
  });
});

/**
 * GET /api/orders/me
 * Get all orders for the current user.
 */
export const getMyOrdersHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const orders = await getUserOrders(userId);
  return res.success(OK, { data: orders });
});

/**
 * GET /api/orders
 * Get all orders in the system (Admin/Staff only)
 */
export const getAllOrdersHandler = catchErrors(async (req, res) => {
  const orders = await getOrders(req.query);
  return res.success(OK, { data: orders });
});

/**
 * GET /api/orders/:idOrCode
 */
export const getOrderDetailHandler = catchErrors(async (req, res) => {
  const order = await getOrderById(req.params.idOrCode);
  return res.success(OK, { data: order });
});

/**
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatusHandler = catchErrors(async (req, res) => {
  const { status } = req.body;
  const order = await updateOrderStatus(req.params.id, status);
  return res.success(OK, { data: order });
});

/**
 * PATCH /api/orders/:id/cancel
 */
export const cancelOrderHandler = catchErrors(async (req, res) => {
  const order = await updateOrderStatus(req.params.id, OrderStatus.CANCELLED);
  return res.success(OK, { data: order, message: 'Đã hủy đơn hàng' });
});
