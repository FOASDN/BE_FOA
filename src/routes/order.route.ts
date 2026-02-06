import { placeOrderHandler } from '@/controllers/order.controller';
import { authenticate } from '@/middlewares';
import { Router } from 'express';

const orderRoutes = Router();

orderRoutes.post('/order', authenticate, placeOrderHandler);

export default orderRoutes;
