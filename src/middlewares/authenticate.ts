import { RequestHandler } from 'express';
import appAssert from '../utils/appAssert';
import { catchErrors } from '../utils/asyncHandler';
import AppErrorCode from '@/constants/appErrorCode';
import { UNAUTHORIZED } from '@/constants/http';
import { verifyToken } from '@/utils/jwt';
import { UserModel } from '@/models';

const authenticate: RequestHandler = catchErrors(async (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  appAssert(accessToken, UNAUTHORIZED, 'Not authorized', AppErrorCode.InvalidAccessToken);

  const { error, payload } = verifyToken(accessToken);
  appAssert(
    payload,
    UNAUTHORIZED,
    error === 'jwt expired' ? 'Token expired' : 'Invalid token',
    AppErrorCode.InvalidAccessToken
  );

  // Check if user is valid
  const user = await UserModel.findById(payload.userId);
  appAssert(user, UNAUTHORIZED, 'User not found', AppErrorCode.InvalidAccessToken);

  req.userId = payload.userId;
  req.role = payload.role;
  next();
});

export default authenticate;
