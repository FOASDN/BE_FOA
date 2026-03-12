import { Router } from 'express';
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import { Role } from '@/types/user.type';
import { createStaffHandler, getCustomersHandler, getStaffHandler, updateStaffStatusHandler, collectCashHandler, getCashControlHandler, getCustomerIncidentsHandler } from '@/controllers/admin.controller';

const adminRoutes = Router();

adminRoutes.post('/staff', authenticate, authorize(Role.ADMIN), createStaffHandler);
adminRoutes.get('/staff', authenticate, authorize(Role.ADMIN), getStaffHandler);
adminRoutes.get('/customers', authenticate, authorize(Role.ADMIN), getCustomersHandler);
adminRoutes.patch('/staff/:id', authenticate, authorize(Role.ADMIN), updateStaffStatusHandler);
adminRoutes.get('/customers/:userId/incidents', authenticate, authorize(Role.ADMIN), getCustomerIncidentsHandler);
adminRoutes.get('/cash-control', authenticate, authorize(Role.ADMIN), getCashControlHandler);
adminRoutes.post('/collect-cash', authenticate, authorize(Role.ADMIN), collectCashHandler);

export default adminRoutes;
