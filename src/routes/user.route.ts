import { Router } from 'express';
import { authenticate } from '@/middlewares';
import { getMeHandler } from '@/controllers/auth.controller';
import { updateMeHandler, changePasswordHandler, updateMyAvatarHandler } from '@/controllers/user.controller';
import { uploadImage } from "@/config/multer";

const userRoutes = Router();

userRoutes.get('/me', authenticate, getMeHandler);
userRoutes.patch('/me', authenticate, updateMeHandler);
userRoutes.patch('/me/password', authenticate, changePasswordHandler);
userRoutes.patch("/me/avatar", authenticate, uploadImage.single("file"), updateMyAvatarHandler);

export default userRoutes;