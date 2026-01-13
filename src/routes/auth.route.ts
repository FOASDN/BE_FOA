import { Router } from 'express';
import {
  loginHandler,
  refreshHandler,
  registerHandler,
  resendVerifyEmailHandler,
  resetPasswordHandler,
  sendPasswordResetHandler,
  verifyEmailHandler,
} from '@/controllers/auth.controller';

const authRoutes = Router();

//prefix: /auth
authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.post('/refresh', refreshHandler);
authRoutes.post('/verify-email/:code', verifyEmailHandler);
authRoutes.post('/resend-verify-email', resendVerifyEmailHandler);
authRoutes.post('/password/forgot', sendPasswordResetHandler);
authRoutes.post('/password/reset', resetPasswordHandler);

export default authRoutes;
