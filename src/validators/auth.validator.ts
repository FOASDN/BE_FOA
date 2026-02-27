import { EMAIL_REGEX } from '@/constants/regex';
import z from 'zod';

export const emailValidator = z.string().min(1).max(255).regex(EMAIL_REGEX, 'Invalid email format');
const passwordValidator = z
  .string()
  .trim()
  .regex(/^\S+$/, 'Password must not contain spaces')
  .min(6, 'Password must be at least 6 characters')
  .max(255, 'Password must be at most 255 characters');
const usernameValidator = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .regex(
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/,
    'Username can only contain letters, numbers and spaces'
  );

export const loginValidator = z.object({
  email: emailValidator,
  password: passwordValidator,
  user_agent: z.string().optional(),
  device_id: z.string().optional(),
});

export type TLoginParams = z.infer<typeof loginValidator>;

export const registerValidator = loginValidator
  .extend({
    username: usernameValidator,
    confirm_password: passwordValidator,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Mật khẩu không khớp nhau',
    path: ['confirmPassword'],
  });

export type TRegisterParams = z.infer<typeof registerValidator>;

export const verificationCodeValidator = z.string().length(6, 'Mã xác thực phải có 6 chữ số');

export const verifyEmailValidator = z.object({
  email: emailValidator,
  code: verificationCodeValidator,
});

export type TVerifyEmailParams = z.infer<typeof verifyEmailValidator>;

export const resetPasswordValidator = z.object({
  verificationCode: z.string().length(24),
  password: passwordValidator,
  confirm_password: passwordValidator,
});

export type TResetPasswordParams = z.infer<typeof resetPasswordValidator>;
