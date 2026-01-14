import { Router } from 'express';
import authRoutes from './auth.route';
import { uploadImage } from '@/config/multer';
import { uploadBuffer } from '@/utils/uploadFile';

const appRoutes = Router();

appRoutes.use('/auth', authRoutes);
appRoutes.post('/upload', uploadImage.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Thiếu ảnh' });

  const result = await uploadBuffer({
    file: req.file,
  });

  return res.json(result);
});

export default appRoutes;
