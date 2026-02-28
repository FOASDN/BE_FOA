import { OK } from '@/constants/http';
import { IUser } from '@/types';
import { catchErrors } from '@/utils/asyncHandler';
import { updateMe } from '@/services/user.service';
import { updateMeValidator } from '@/validators/auth.validator';

export const updateMeHandler = catchErrors(async (req, res) => {
  const params = updateMeValidator.parse(req.body);

  const user = await updateMe(req.userId, params);

  return res.success<Omit<IUser, 'password_hash'>>(OK, {
    data: user,
    message: 'Cập nhật hồ sơ thành công',
  });
});