import { Router } from 'express';
import authRoutes from './auth.route';
import adminRoutes from './admin.route';
import voucherRoutes from './voucher.route';
import productRoute from './product.route';
import locationRoutes from './location.route';
import orderRoutes from './order.route';
import fileRoutes from './file.route';

const appRoutes = Router();

appRoutes.use('/auth', authRoutes);
appRoutes.use('/admin', adminRoutes);
appRoutes.use('/vouchers', voucherRoutes);
appRoutes.use('/products', productRoute);
appRoutes.use('/location', locationRoutes);
appRoutes.use('/orders', orderRoutes);
// File upload / management — bảo vệ bằng auth trong file.route.ts
appRoutes.use('/files', fileRoutes);

export default appRoutes;
