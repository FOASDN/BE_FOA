import { CREATED, OK } from '@/constants/http';
import { catchErrors } from '@/utils/asyncHandler';
import { createStaffByAdmin, updateStaffStatus } from '@/services/admin.service';
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
export const getStaffHandler = catchErrors(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await getUsersByRole(Role.STAFF, page, limit);

  return res.success(OK, {
    message: 'Lấy danh sách nhân viên thành công',
    data: result,
  });
});

export const updateStaffStatusHandler = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const adminId = req.userId!;
  const staff = await updateStaffStatus(adminId, id, isActive);

  return res.success(OK, {
    message: `Đã ${isActive ? 'kích hoạt' : 'ngưng kích hoạt'} nhân viên thành công`,
    data: staff,
  });
});
