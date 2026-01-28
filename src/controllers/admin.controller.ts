import { CREATED } from '@/constants/http';
import { catchErrors } from '@/utils/asyncHandler';
import { createStaffByAdmin } from '@/services/admin.service';
import { createStaffValidator } from '@/validators/admin.validator';

export const createStaffHandler = catchErrors(async (req, res) => {
  const body = createStaffValidator.parse(req.body);

  const adminId = req.userId!;
  const staff = await createStaffByAdmin(adminId, body);

  return res.success(CREATED, {
    message: 'Tạo tài khoản staff thành công. Vui lòng kiểm tra email để thiết lập mật khẩu.',
    data: staff,
  });
});
