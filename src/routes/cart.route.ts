import { Router } from 'express';
import { addToCartHandler } from '@/controllers/cart.controller';
import { authenticate } from '@/middlewares';

const router = Router();

router.post('/items', authenticate, addToCartHandler);

export default router;