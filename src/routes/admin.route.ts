import { Router } from 'express';
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import { Role } from '@/types/user.type';
import { createStaffHandler } from '@/controllers/admin.controller';

const adminRoutes = Router();

adminRoutes.post('/staff', authenticate, authorize(Role.ADMIN), createStaffHandler);

export default adminRoutes;
