import { Router } from 'express';
import { addToCartHandler, getCartHandler } from '@/controllers/cart.controller';
import { authenticate } from '@/middlewares';

const router = Router();

router.get('/', authenticate, getCartHandler);
router.post('/items', authenticate, addToCartHandler);

export default router;