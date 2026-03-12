import { Router } from 'express';
import authenticate from '@/middlewares/authenticate';
import authorize from '@/middlewares/authorize';
import { Role } from '@/types/user.type';
import { collectCashHandler, createStaffHandler, getCashControlHandler, getCustomerIncidentsHandler, getCustomersHandler } from '@/controllers/admin.controller';

const adminRoutes = Router();

adminRoutes.post('/staff', authenticate, authorize(Role.ADMIN), createStaffHandler);
adminRoutes.get('/customers', authenticate, authorize(Role.ADMIN), getCustomersHandler);
adminRoutes.get('/customers/:userId/incidents', authenticate, authorize(Role.ADMIN), getCustomerIncidentsHandler);
adminRoutes.get('/cash-control', authenticate, authorize(Role.ADMIN), getCashControlHandler);
adminRoutes.post('/collect-cash', authenticate, authorize(Role.ADMIN), collectCashHandler);

export default adminRoutes;
