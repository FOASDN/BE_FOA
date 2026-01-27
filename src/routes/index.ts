import { Router } from 'express';
import authRoutes from './auth.route';
import voucherRoutes from './voucher.route';
import { uploadImage } from '@/config/multer';
import { uploadBuffer } from '@/utils/uploadFile';
import { parseFormData } from '@/utils/parseFormData';

const appRoutes = Router();

appRoutes.use('/auth', authRoutes);
appRoutes.use('/vouchers', voucherRoutes);


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
