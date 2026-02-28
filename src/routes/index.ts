import { Router } from 'express';
import authRoutes from './auth.route';
import adminRoutes from './admin.route';
import voucherRoutes from './voucher.route';
import productRoute from './product.route';
import locationRoutes from './location.route';
import orderRoutes from './order.route';
import userRoutes from './user.route';
import { uploadImage } from '@/config/multer';
import { uploadBuffer } from '@/utils/uploadFile';
import { parseFormData } from '@/utils/parseFormData';

const appRoutes = Router();

appRoutes.use('/auth', authRoutes);
appRoutes.use('/admin', adminRoutes);
appRoutes.use('/vouchers', voucherRoutes);
appRoutes.use('/products', productRoute);
appRoutes.use('/location', locationRoutes);
appRoutes.use('/orders', orderRoutes);
appRoutes.use('/users', userRoutes);
appRoutes.post('/upload', uploadImage.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Thiếu ảnh' });

  const file = req.file;
  const data = parseFormData(req.body);

  const result = await uploadBuffer({
    file: req.file,
  });

  return res.json(result);
});

export default appRoutes;
