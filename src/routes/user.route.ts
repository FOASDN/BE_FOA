import { Router } from 'express';
import { authenticate } from '@/middlewares';
import { getMeHandler } from '@/controllers/auth.controller';
import { updateMeHandler } from '@/controllers/user.controller';

const userRoutes = Router();

userRoutes.get('/me', authenticate, getMeHandler);
userRoutes.patch('/me', authenticate, updateMeHandler);

export default userRoutes;