import { APP_ORIGIN, NODE_ENV } from '@/constants/env';
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND } from '@/constants/http';
import { OrderModel, UserModel } from '@/models';
import VerificationCodeModel from '@/models/verificationCode.model';
import { Role } from '@/types/user.type';
import { OrderStatus, PaymentMethod } from '@/types/order.type';
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

export const createStaffByAdmin = async (adminId: mongoose.Types.ObjectId | string, { email, phone }: { email: string; phone?: string }) => {
  return withTransaction(async (session) => {
    const normalizedEmail = email.trim().toLowerCase();

    const emailExist = await UserModel.exists({ email: normalizedEmail }).session(session);
    appAssert(!emailExist, CONFLICT, 'Tài khoản email đã tồn tại');

    const username = await generateUsernameFromEmail(normalizedEmail, session);

    const staff = new UserModel({
      username,
      email: normalizedEmail,
      phone,
      role: Role.STAFF,
      password_hash: randomUUID(),
      isActive: false,
    });

    await staff.save({ session });

    const verificationCode = new VerificationCodeModel({
      user_id: staff._id,
      type: VerificationCodeType.STAFF_INVITE,
      email: staff.email,
      expires_at: oneHourFromNow(),
    });

    await verificationCode.save({ session });

    const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${verificationCode.expires_at.getTime()}`;

    const { error } = await sendMail({
      to: staff.email,
      ...getStaffInviteTemplate(url),
    });

    if (error) {
      if (NODE_ENV === 'development') {
        console.warn('⚠ [DEV] Gửi email mời staff thất bại. URL:', url);
        console.warn('⚠ [DEV] Lỗi:', (error as Error)?.message);
      } else {
        appAssert(!error, INTERNAL_SERVER_ERROR, 'Lỗi khi gửi email mời staff thiết lập mật khẩu');
      }
    }

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

/**
 * Get total COD cash held by each staff member (uncollected)
 */
export const getCashControl = async () => {
  const result = await OrderModel.aggregate([
    {
      $match: {
        status: OrderStatus.COMPLETED,
        'payment.method': PaymentMethod.CASH_ON_DELIVERY,
        'payment.cash_collected_at': null,
        'delivery_info.driver_id': { $ne: null },
      },
    },
    {
      $group: {
        _id: '$delivery_info.driver_id',
        total_amount: { $sum: '$total_price' },
        order_count: { $sum: 1 },
        order_ids: { $push: '$_id' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'driver',
      },
    },
    {
      $unwind: '$driver',
    },
    {
      $project: {
        _id: 1,
        total_amount: 1,
        order_count: 1,
        order_ids: 1,
        driver_name: '$driver.username',
        driver_email: '$driver.email',
      },
    },
  ]);

  return result;
};

/**
 * Mark all uncollected COD orders for a driver as collected
 */
export const collectCashFromDriver = async (adminId: string, driverId: string) => {
  const driverExists = await UserModel.exists({ _id: driverId, role: Role.STAFF });
  appAssert(driverExists, NOT_FOUND, 'Không tìm thấy nhân viên giao hàng');

  const result = await OrderModel.updateMany(
    {
      'delivery_info.driver_id': new mongoose.Types.ObjectId(driverId),
      status: OrderStatus.COMPLETED,
      'payment.method': PaymentMethod.CASH_ON_DELIVERY,
      'payment.cash_collected_at': null,
    },
    {
      $set: {
        'payment.cash_collected_at': new Date(),
        'payment.cash_collected_by': new mongoose.Types.ObjectId(adminId),
      },
    }
  );

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

/**
 * Get customers with order statistics (cancellation rate, etc.)
 */
export const getCustomersWithStats = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const users = await UserModel.aggregate([
    { $match: { role: Role.CUSTOMER } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user_id',
        as: 'orders',
      },
    },
    {
      $addFields: {
        total_orders: { $size: '$orders' },
        cancelled_orders: {
          $size: {
            $filter: {
              input: '$orders',
              as: 'order',
              cond: { $eq: ['$$order.status', OrderStatus.CANCELLED] },
            },
          },
        },
        cancellation_rate: {
          $cond: [
            { $gt: [{ $size: '$orders' }, 0] },
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$orders',
                          as: 'order',
                          cond: { $eq: ['$$order.status', OrderStatus.CANCELLED] },
                        },
                      },
                    },
                    { $size: '$orders' },
                  ],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        password_hash: 0,
        orders: 0,
      },
    },
  ]);

  const total = await UserModel.countDocuments({ role: Role.CUSTOMER });

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get detailed history of cancelled/rejected orders for a customer
 */
export const getCustomerCancelledOrders = async (userId: string) => {
  return await OrderModel.find({
    user_id: new mongoose.Types.ObjectId(userId),
    status: OrderStatus.CANCELLED,
  })
    .sort({ createdAt: -1 })
    .lean();
};
