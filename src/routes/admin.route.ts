import { Router } from 'express';
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import { Role } from '@/types/user.type';
import { createStaffHandler, getCustomersHandler, getStaffHandler, updateStaffStatusHandler } from '@/controllers/admin.controller';

const adminRoutes = Router();

adminRoutes.post('/staff', authenticate, authorize(Role.ADMIN), createStaffHandler);
adminRoutes.get('/staff', authenticate, authorize(Role.ADMIN), getStaffHandler);
adminRoutes.get('/customers', authenticate, authorize(Role.ADMIN), getCustomersHandler);
adminRoutes.patch('/staff/:id', authenticate, authorize(Role.ADMIN), updateStaffStatusHandler);

export default adminRoutes;
