import { Router } from 'express';
import {
  createProductHandler,
  deleteProductHandler,
  getAllProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  getUniqueIngredientsHandler,
} from '@/controllers/product.controller';
import { getRecommendationsHandler, getSafeFoodsHandler } from '@/controllers/recommendation.controller';
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import { Role } from '@/types/user.type';

const router = Router();

// Public routes
router.get('/', getAllProductsHandler);

// AI-powered routes (authenticated)
router.get('/recommendations', authenticate, getRecommendationsHandler);
router.get('/safe-foods', authenticate, getSafeFoodsHandler);

router.get('/ingredients', getUniqueIngredientsHandler);

router.get('/:id', getProductByIdHandler);

// Admin routes
router.post('/', authenticate, authorize(Role.ADMIN), createProductHandler);
router.put('/:id', authenticate, authorize(Role.ADMIN), updateProductHandler);
router.delete('/:id', authenticate, authorize(Role.ADMIN), deleteProductHandler);

export default router;
