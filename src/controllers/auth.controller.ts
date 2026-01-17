import { CREATED, OK, UNAUTHORIZED } from '@/constants/http';
import {
  createUser,
  getMe,
  login,
  refreshUserAccessToken,
  resendVerifyEmail,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from '@/services/auth.service';
import { IUser } from '@/types';
import appAssert from '@/utils/appAssert';
import { catchErrors } from '@/utils/asyncHandler';
import { clearAuthCookies, setAuthCookies } from '@/utils/cookies';
import {
  emailValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  verificationCodeValidator,
} from '@/validators/auth.validator';

export const registerHandler = catchErrors(async (req, res) => {
  const params = registerValidator.parse({
    ...req.body,
    user_agent: req.headers['user-agent'],
  });

  const user = await createUser(params);
  return res.success<Omit<IUser, 'password_hash'>>(CREATED, { data: user, message: 'Tài khoản đăng ký thành công' });
});

export const loginHandler = catchErrors(async (req, res) => {
  const params = loginValidator.parse(req.body);
  const { user, refresh_token, access_token } = await login(params);

  return setAuthCookies({
    res,
    accessToken: access_token,
    refreshToken: refresh_token,
    deviceId: params.device_id,
  }).success<Omit<IUser, 'password_hash'>>(OK, { data: user, message: 'Đăng nhập thành công' });
});

export const refreshHandler = catchErrors(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAssert(refreshToken, UNAUTHORIZED, 'Token không hợp lệ');

  const { access_token, refresh_token } = await refreshUserAccessToken(refreshToken);

  return setAuthCookies({
    res,
    accessToken: access_token,
    refreshToken: refresh_token,
  }).success(OK, { message: 'Làm mới token thành công' });
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCodeId = verificationCodeValidator.parse(req.params.code);

  await verifyEmail(verificationCodeId);

  return res.success(OK, { message: 'Xác thức email thành công' });
});

export const resendVerifyEmailHandler = catchErrors(async (req, res) => {
  const email = emailValidator.parse(req.body.email);
  await resendVerifyEmail(email);

  return res.success(OK, {
    message: 'Email xác thực đã gửi thành công',
    info: 'Vui lòng kiểm tra email của bạn',
  });
});

export const sendPasswordResetHandler = catchErrors(async (req, res) => {
  const email = emailValidator.parse(req.body.email);
  await sendPasswordResetEmail(email);

  return res.success(OK, {
    message: 'Yêu cầu thay đổi mật khẩu gửi thành công.',
    info: 'Vui lòng kiểm tra email của bạn.',
  });
});

export const resetPasswordHandler = catchErrors(async (req, res) => {
  const { verificationCode, password, confirm_password } = req.body;
  const request = resetPasswordValidator.parse({ verificationCode, password, confirm_password });

  await resetPassword(request);

  return clearAuthCookies(res).success(OK, {
    message: 'Password reset successfully',
  });
});

export const getMeHandler = catchErrors(async (req, res) => {
  const user = await getMe(req.userId);

  return res.success<Omit<IUser, 'password_hash'>>(OK, { data: user });
});
