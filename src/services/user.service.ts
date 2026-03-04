import mongoose from 'mongoose';
import { UserModel } from '@/models';
import { IUser } from '@/types';
import appAssert from '@/utils/appAssert';
import { CONFLICT, NOT_FOUND } from '@/constants/http';
import withTransaction from '@/utils/withTransaction';
import { auditUserUpdated } from '@/services/audit-log.service';
import { TUpdateMeParams } from '@/validators/auth.validator';

const normalizeDefaultAddress = (addresses?: any[]) => {
  if (!addresses) return addresses;
  let found = false;
  return addresses.map((a) => {
    const isDefault = Boolean(a?.isDefault);
    if (!isDefault) return { ...a, isDefault: false };
    if (found) return { ...a, isDefault: false };
    found = true;
    return { ...a, isDefault: true };
  });
};

export const updateMe = (userId: mongoose.Types.ObjectId, payload: TUpdateMeParams) =>
  withTransaction(async (session) => {
    const user = await UserModel.findById(userId).session(session);
    appAssert(user, NOT_FOUND, 'Không tìm thấy tài khoản người dùng');

    if (payload.username && payload.username !== user.username) {
      const exist = await UserModel.exists({ username: payload.username }).session(session);
      appAssert(!exist, CONFLICT, 'Tên đăng nhập đã tồn tại');
    }

    const oldData = user.omitPassword();

    const update: Partial<Record<keyof TUpdateMeParams | 'aiRecommendationsCache', any>> = {};
    if (payload.username !== undefined) update.username = payload.username;
    if (payload.phone !== undefined) update.phone = payload.phone;
    if (payload.addresses !== undefined) update.addresses = normalizeDefaultAddress(payload.addresses);

    // Handle healthProfile and cache invalidation
    if (payload.healthProfile !== undefined) {
      update.healthProfile = {
        allergies: payload.healthProfile.allergies || [],
        conditions: payload.healthProfile.conditions || [],
        dietaryGoals: payload.healthProfile.dietaryGoals || []
      };
      // Invalidate AI cache whenever health profile changes!
      update.aiRecommendationsCache = null;
    }

    const updated = await UserModel.findByIdAndUpdate(userId, update, {
      new: true,
      session,
      runValidators: true,
    });
    appAssert(updated, NOT_FOUND, 'Không tìm thấy tài khoản người dùng');

    const newData = updated.omitPassword();

    await auditUserUpdated(userId, oldData as any, newData as any, { session });

    return newData as Omit<IUser, 'password_hash'>;
  });
