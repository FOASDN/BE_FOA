import { APP_ORIGIN } from '@/constants/env';
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND } from '@/constants/http';
import { UserModel } from '@/models';
import VerificationCodeModel from '@/models/verificationCode.model';
import { Role } from '@/types/user.type';
import { VerificationCodeType } from '@/types/verificationCode.type';
import appAssert from '@/utils/appAssert';
import { oneHourFromNow } from '@/utils/date';
import { sendMail } from '@/utils/sendMail';
import withTransaction from '@/utils/withTransaction';
import { randomUUID } from 'crypto';
import AuditLogModel from '@/models/audit-log.model';
import { AuditEntityType, AuditLogAction } from '@/types/audit-log.type';
import { generateUsernameFromEmail } from '@/utils/generateUsername';
import { getStaffInviteTemplate } from '@/utils/emailTemplates';
import mongoose from 'mongoose';

export const createStaffByAdmin = async (adminId: mongoose.Types.ObjectId | string, { name, email, phone }: { name: string; email: string; phone?: string }) => {
  return withTransaction(async (session) => {
    const normalizedEmail = email.trim().toLowerCase();

    const emailExist = await UserModel.exists({ email: normalizedEmail }).session(session);
    appAssert(!emailExist, CONFLICT, 'Tài khoản email đã tồn tại');

    const username = await generateUsernameFromEmail(normalizedEmail, session);

    const staff = new UserModel({
      fullName: name,
      username,
      email: normalizedEmail,
      phone,
      role: Role.STAFF,
      password_hash: randomUUID(),
      isActive: false,
    });

    await staff.save({ session });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const verificationCode = new VerificationCodeModel({
      user_id: staff._id,
      type: VerificationCodeType.STAFF_INVITE,
      email: staff.email,
      code,
      expires_at: oneHourFromNow(),
    });

    await verificationCode.save({ session });

    const url = `${APP_ORIGIN}/reset-password?code=${code}&email=${staff.email}&type=invite`;

    const { error } = await sendMail({
      to: staff.email,
      ...getStaffInviteTemplate(url),
    });
    appAssert(!error, INTERNAL_SERVER_ERROR, 'Lỗi khi gửi email mời staff thiết lập mật khẩu');

    const actorId = typeof adminId === 'string' ? new mongoose.Types.ObjectId(adminId) : adminId;

    await AuditLogModel.create(
      [
        {
          user_id: actorId,
          entity_type: AuditEntityType.USER,
          action: AuditLogAction.CREATE,
          old_data: null,
          new_data: {
            id: staff._id,
            username: staff.username,
            email: staff.email,
            phone: staff.phone,
            role: staff.role,
            isActive: staff.isActive,
          },
          created_at: new Date(),
        },
      ],
      { session }
    );

    return staff.omitPassword();
  });
};

export const updateStaffStatus = async (
  adminId: mongoose.Types.ObjectId | string,
  staffId: string,
  isActive: boolean
) => {
  return withTransaction(async (session) => {
    const staff = await UserModel.findOne({ _id: staffId, role: Role.STAFF }).session(session);
    appAssert(staff, NOT_FOUND, 'Không tìm thấy nhân viên');

    const oldData = {
      id: staff._id,
      isActive: staff.isActive,
    };

    staff.isActive = isActive;
    await staff.save({ session });

    const actorId = typeof adminId === 'string' ? new mongoose.Types.ObjectId(adminId) : adminId;

    await AuditLogModel.create(
      [
        {
          user_id: actorId,
          entity_type: AuditEntityType.USER,
          action: AuditLogAction.UPDATE,
          old_data: oldData,
          new_data: {
            id: staff._id,
            isActive: staff.isActive,
          },
          created_at: new Date(),
        },
      ],
      { session }
    );

    return staff.omitPassword();
  });
};
