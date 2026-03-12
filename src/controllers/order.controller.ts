import { CREATED, OK } from '@/constants/http';
import {
  getOrderById,
  getOrders,
  getUserOrders,
  placeOrder,
  updateOrderStatus,
  getWeeklyRevenue,
  getDashboardStats,
  getRecentOrders,
} from '@/services/order.service';
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
      _id: order._id,
      code: order.code,
      status: order.status,
      items: order.items,
      sub_total: order.sub_total,
      total_price: order.total_price,
      note: order.note,
      staff_note_items: order.staff_note_items,
      payment: order.payment,
      delivery_address: order.delivery_address,
      voucher: order.voucher,
      checkoutUrl: (order as any).checkoutUrl,
      createdAt: (order as any).createdAt,
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

export const getWeeklyRevenueHandler = catchErrors(async (_req, res) => {
  const revenue = await getWeeklyRevenue();
  return res.success(OK, { data: revenue });
});

export const getDashboardStatsHandler = catchErrors(async (_req, res) => {
  const stats = await getDashboardStats();
  return res.success(OK, { data: stats });
});

export const getRecentOrdersHandler = catchErrors(async (_req, res) => {
  const orders = await getRecentOrders();
  return res.success(OK, { data: orders });
});
