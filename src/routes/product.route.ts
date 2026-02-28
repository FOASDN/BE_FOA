import { Router } from 'express';
import {
    createProductHandler,
    deleteProductHandler,
    getAllProductsHandler,
    getProductByIdHandler,
    updateProductHandler,
} from '@/controllers/product.controller';
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import { Role } from '@/types/user.type';

const router = Router();

// Public routes
router.get('/', getAllProductsHandler);
router.get('/:id', getProductByIdHandler);

// Admin routes (should add auth/admin middleware in production)
router.post('/', authenticate, authorize(Role.ADMIN),  createProductHandler);
router.put('/:id', authenticate, authorize(Role.ADMIN), updateProductHandler);
router.delete('/:id', authenticate, authorize(Role.ADMIN), deleteProductHandler);

export default router;
