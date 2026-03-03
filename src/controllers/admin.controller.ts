import { CREATED, OK } from '@/constants/http';
import { catchErrors } from '@/utils/asyncHandler';
import { createStaffByAdmin } from '@/services/admin.service';
import { createStaffValidator } from '@/validators/admin.validator';
import { getUsersByRole } from '@/services/user.service';
import { Role } from '@/types/user.type';

export const createStaffHandler = catchErrors(async (req, res) => {
  const body = createStaffValidator.parse(req.body);

  const adminId = req.userId!;
  const staff = await createStaffByAdmin(adminId, body);

  return res.success(CREATED, {
    message: 'Tạo tài khoản staff thành công. Vui lòng kiểm tra email để thiết lập mật khẩu.',
    data: staff,
  });
});

export const getCustomersHandler = catchErrors(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await getUsersByRole(Role.CUSTOMER, page, limit);

  return res.success(OK, {
    message: 'Lấy danh sách khách hàng thành công',
    data: result,
  });
});
