import { EMAIL_REGEX, INTERNATIONAL_PHONE_REGEX, VIETNAM_PHONE_REGEX } from '@/constants/regex';
import { IUser } from '@/types';
import { IAddresses, IHealthProfile, Role } from '@/types/user.type';
import { compareValue, hashValue } from '@/utils/bcrypt';
import mongoose from 'mongoose';

const isValidPhone = (v: string) => VIETNAM_PHONE_REGEX.test(v) || INTERNATIONAL_PHONE_REGEX.test(v);

const AddressSchema = new mongoose.Schema<IAddresses>(
  {
    label: { type: String, required: true, trim: true },
    receiver_name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (v == null || v === '') return true;
          return isValidPhone(v);
        },
        message: 'Số điện thoại không hợp lệ',
      },
    },
    detail: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    _id: false,
  }
);

const HealthProfileSchema = new mongoose.Schema<IHealthProfile>(
  {
    allergies: [{ type: String }],
    conditions: [{ type: String }],
    dietaryGoals: [{ type: String }],
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, match: EMAIL_REGEX },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (v == null || v === '') return true;
          return isValidPhone(v);
        },
        message: 'Số điện thoại không hợp lệ',
      },
    },
    password_hash: { type: String, required: true, minLength: 6 },
    role: { type: String, required: true, enum: Role, default: Role.CUSTOMER },
    verified_at: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    addresses: [
      {
        type: AddressSchema,
        default: [],
      },
    ],
    collected_points: {
      type: Number,
      default: 0,
      min: [0, 'Collected points cannot be negative'],
    },
    healthProfile: {
      type: HealthProfileSchema,
      default: () => ({ allergies: [], conditions: [], dietaryGoals: [] }),
    },
    aiRecommendationsCache: {
      type: {
        data: { type: mongoose.Schema.Types.Mixed },
        updatedAt: { type: Date }
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

//indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

// Middleware "pre-save" trong Mongoose:
// Hàm này sẽ tự động chạy TRƯỚC KHI document được lưu (save) vào MongoDB
UserSchema.pre('save', async function (next) {
  // ✅ Kiểm tra xem field "password" có bị thay đổi không
  // Nếu KHÔNG thay đổi (ví dụ chỉ update email, name,...) thì bỏ qua việc hash lại
  if (!this.isModified('password_hash')) return next();

  // ✅ Nếu password đã thay đổi hoặc là lần đầu tạo user,
  // thì hash lại password trước khi lưu vào database
  this.password_hash = await hashValue(this.password_hash);

  // ✅ Gọi next() để cho phép Mongoose tiếp tục quá trình lưu document
  next();
});

//methods
UserSchema.methods.comparePassword = async function (value: string) {
  return await compareValue(value, this.password_hash);
};

UserSchema.methods.omitPassword = function () {
  const user = this.toObject();
  delete user.password_hash;
  return user;
};

const UserModel = mongoose.model<IUser>('User', UserSchema, 'users');

export default UserModel;
