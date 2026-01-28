import { APP_ORIGIN } from '@/constants/env';
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from '@/constants/http';
import { RefreshTokenModel, UserModel } from '@/models';
import VerificationCodeModel from '@/models/verificationCode.model';
import { IUser } from '@/types';
import { VerificationCodeType } from '@/types/verificationCode.type';
import appAssert from '@/utils/appAssert';
import { hashValue } from '@/utils/bcrypt';
import { fiveMinutesAgo, ONE_DAY_MS, oneHourFromNow, thirtyDaysFromNow } from '@/utils/date';
import { getPasswordResetTemplate, getVerifyEmailTemplate } from '@/utils/emailTemplates';
import { generateRefreshToken, hashToken, signToKen } from '@/utils/jwt';
import { sendMail } from '@/utils/sendMail';
import withTransaction from '@/utils/withTransaction';
import { TLoginParams, TRegisterParams, TResetPasswordParams } from '@/validators/auth.validator';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';

export const createUser = async ({ username, email, password }: TRegisterParams) => {
  return withTransaction(async (session) => {
    //check if email already exists
    const email_exist = await UserModel.exists({ email }).session(session);
    appAssert(!email_exist, CONFLICT, 'Tài khoản email đã tồn tại');

    const username_exist = await UserModel.exists({ username }).session(session);
    appAssert(!username_exist, CONFLICT, 'Tên đăng nhập đã tồn tại');

    //create user
    const user = new UserModel({
      username,
      email,
      password_hash: password,
    });

    await user.save({ session });

    //create verification code
    const verification_code = new VerificationCodeModel({
      user_id: user._id,
      type: VerificationCodeType.VERIFY_EMAIL,
      email,
      expires_at: thirtyDaysFromNow(),
    });

    await verification_code.save({ session });

    //send email
    const url = `${APP_ORIGIN}/verify-email/${verification_code._id}`;
    //send email
    const { error } = await sendMail({
      to: email,
      ...getVerifyEmailTemplate(url),
    });

    appAssert(!error, INTERNAL_SERVER_ERROR, 'Lỗi khi gửi email');

    return user.omitPassword();
  });
};

export const login = async ({ email, password, user_agent, device_id }: TLoginParams) => {
  return withTransaction(async (session) => {
    //check exist email
    const user = await UserModel.findOne({ email }).session(session);
    appAssert(user, CONFLICT, 'Thông tin đăng nhập không hợp lệ');
    appAssert(user.isActive, UNAUTHORIZED, 'Tài khoản chưa được kích hoạt. Vui lòng thiết lập mật khẩu từ email mời.');

    //check password
    const isValidatePassword = await user.comparePassword(password);
    appAssert(isValidatePassword, CONFLICT, 'Thông tin đăng nhập không hợp lệ');
    appAssert(user.verified_at, CONFLICT, 'Tài khoản chưa xác thực, vui lòng kiểm tra email');

    //check old refresh_token then revoke token
    const old_refresh_token = await RefreshTokenModel.findOne({ user_id: user._id, device_id }).session(session);
    if (old_refresh_token) {
      old_refresh_token.revoked = true;
      await old_refresh_token.save({ session });
    }

    const deviceId = device_id || randomUUID();

    const payload = {
      user_id: user._id,
      role: user.role,
      device_id: deviceId,
    };
    const access_token = signToKen(payload);
    const refresh_token = generateRefreshToken();
    const refresh = new RefreshTokenModel({
      user_id: user._id,
      token_hash: hashToken(refresh_token),
      device_id: payload.device_id,
      user_agent,
      expires_at: thirtyDaysFromNow(),
    });

    await refresh.save({ session });

    return {
      user: user.omitPassword(),
      access_token,
      refresh_token: refresh_token,
      deviceId,
    };
  });
};

export const refreshUserAccessToken = async (refresh_token: string) => {
  const token_hash = hashToken(refresh_token);

  let refreshToken = await RefreshTokenModel.findOne({
    token_hash,
    revoked: false,
    expires_at: { $gt: new Date() },
  });

  appAssert(refreshToken, UNAUTHORIZED, 'Token không hợp lệ');

  const needRefresh = refreshToken.expires_at.getTime() - Date.now() < ONE_DAY_MS;

  let newRefreshToken = refresh_token;

  if (needRefresh) {
    await refreshToken.updateOne({ revoked: true });

    newRefreshToken = generateRefreshToken();
    refreshToken = await RefreshTokenModel.create({
      user_id: refreshToken.user_id,
      device_id: refreshToken.device_id,
      user_agent: refreshToken.user_agent,
      token_hash: hashToken(newRefreshToken),
      expires_at: thirtyDaysFromNow(),
    });
  }

  const user = await UserModel.findById(refreshToken.user_id);
  appAssert(user, UNAUTHORIZED, 'User không tồn tại');

  const access_token = signToKen({
    user_id: user._id,
    role: user.role,
    device_id: refreshToken.device_id,
  });

  return {
    access_token,
    refresh_token: newRefreshToken,
  };
};

export const verifyEmail = async (verificationCodeId: string) => {
  //get the verification code from db
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCodeId,
    type: VerificationCodeType.VERIFY_EMAIL,
    expires_at: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, 'Mã code xác thực không hợp lệ');
  //get user by id
  //update user verified true
  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.user_id,
    {
      verified_at: new Date(),
    },
    { new: true }
  );
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, 'Lỗi khi xác thực tài khoản');
  //delete verification code record
  await validCode.deleteOne();
  //return user
  return {
    user: updatedUser.omitPassword(),
  };
};

export const resendVerifyEmail = async (email: string) => {
  //get user
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, 'Không tìm thấy tài khoản người dùng');
  appAssert(!user.verified_at, NOT_FOUND, 'Tài khoản đã được xác thực');

  //check email rate limit
  const fiveMinAgo = fiveMinutesAgo();
  const count = await VerificationCodeModel.countDocuments({
    user_id: user._id,
    type: VerificationCodeType.VERIFY_EMAIL,
    created_at: { $gt: fiveMinAgo },
  });
  appAssert(count <= 1, TOO_MANY_REQUESTS, 'Quá nhiều lượt xác thực, vui lòng thử lại sau 5 phút.');

  //create verification code
  const verificationCode = await VerificationCodeModel.create({
    user_id: user._id,
    type: VerificationCodeType.VERIFY_EMAIL,
    email: user.email,
    expires_at: thirtyDaysFromNow(),
  });
  //send verification email
  const url = `${APP_ORIGIN}/auth/verify-email/${verificationCode._id}`;
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });
  appAssert(!error, INTERNAL_SERVER_ERROR, `Lỗi khi gửi email`);
  //return success message
  return true;
};

export const sendPasswordResetEmail = async (email: string) => {
  //get user
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, 'Không tìm thấy tài khoản người dùng');

  //check email rate limit
  const fiveMinAgo = fiveMinutesAgo();
  const count = await VerificationCodeModel.countDocuments({
    user_id: user._id,
    type: VerificationCodeType.FORGOT_PASSWORD,
    created_at: { $gt: fiveMinAgo },
  });
  appAssert(count <= 1, TOO_MANY_REQUESTS, 'Too many requests. Please try again later.');
  //create verification code
  const verificationCode = await VerificationCodeModel.create({
    user_id: user._id,
    type: VerificationCodeType.FORGOT_PASSWORD,
    email: user.email,
    expires_at: oneHourFromNow(),
  });
  //send email with the verification code
  const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${verificationCode.expires_at.getTime()}`;
  const { error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });
  appAssert(!error, INTERNAL_SERVER_ERROR, `Lỗi khi gửi email`);
  //return success message
  return true;
};

export const resetPassword = async ({ verificationCode, password }: TResetPasswordParams) => {
  //get the verification code from db
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeType.FORGOT_PASSWORD,
    expires_at: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, 'Mã xác thực không hợp lệ');

  //get user by id
  //update user password
  const updatedUser = await UserModel.findByIdAndUpdate(validCode.user_id, {
    password_hash: await hashValue(password),
  });
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, 'Lỗi khi xác thực tài khoản');

  //delete verification code record
  await validCode.deleteOne();

  //revoke all refresh token of the user
  await RefreshTokenModel.updateMany({ user_id: validCode.user_id }, { revoked: true });

  return {
    user: updatedUser.omitPassword(),
  };
};

export const getMe = async (userId: mongoose.Types.ObjectId): Promise<Omit<IUser, 'password_hash'>> => {
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, 'Không tìm thấy tài khoản người dùng');
  return user.omitPassword();
};

export const logoutUser = async (userId: mongoose.Types.ObjectId, deviceId: string | undefined) => {
  await RefreshTokenModel.updateMany({ user_id: userId, device_id: deviceId, revoked: false }, { revoked: true });

  return true;
};
