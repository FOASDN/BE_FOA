import { Router } from 'express';
import {
    createProductHandler,
    deleteProductHandler,
    getAllProductsHandler,
    getProductByIdHandler,
    updateProductHandler,
} from '@/controllers/product.controller';

const router = Router();

// Public routes
router.get('/', getAllProductsHandler);
router.get('/:id', getProductByIdHandler);

// Admin routes (should add auth/admin middleware in production)
router.post('/', createProductHandler);
router.put('/:id', updateProductHandler);
router.delete('/:id', deleteProductHandler);

export default router;
