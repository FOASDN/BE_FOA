import {
  cancelOrderHandler,
  getAllOrdersHandler,
  getMyOrdersHandler,
  getOrderDetailHandler,
  placeOrderHandler,
  updateOrderStatusHandler,
} from '@/controllers/order.controller';
import { authenticate, authorize } from '@/middlewares';
import { Role } from '@/types/user.type';
import { Router } from 'express';

const orderRoutes = Router();

// POST /api/orders — Place a new order (authenticated)
orderRoutes.post('/', authenticate, placeOrderHandler);

// GET /api/orders/me — Get current user's order history
orderRoutes.get('/me', authenticate, getMyOrdersHandler);

// GET /api/orders/:idOrCode — Get detail of a specific order
orderRoutes.get('/:idOrCode', authenticate, getOrderDetailHandler);

// GET /api/orders — Get all orders (Admin/Staff only)
orderRoutes.get('/', authenticate, authorize(Role.ADMIN, Role.STAFF), getAllOrdersHandler);

// PATCH /api/orders/:id/status — Update order status (Admin/Staff only)
orderRoutes.patch('/:id/status', authenticate, authorize(Role.ADMIN, Role.STAFF), updateOrderStatusHandler);

// PATCH /api/orders/:id/cancel — Cancel an order
orderRoutes.patch('/:id/cancel', authenticate, cancelOrderHandler);

export default orderRoutes;
