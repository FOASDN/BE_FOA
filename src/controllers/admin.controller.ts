import { CREATED, OK } from '@/constants/http';
import { catchErrors } from '@/utils/asyncHandler';
import { collectCashFromDriver, createStaffByAdmin, getCashControl, getCustomerCancelledOrders, getCustomersWithStats } from '@/services/admin.service';
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

  const result = await getCustomersWithStats(page, limit);

  return res.success(OK, {
    message: 'Lấy danh sách khách hàng thành công',
    data: result,
  });
});

export const getCashControlHandler = catchErrors(async (req, res) => {
  const result = await getCashControl();

  return res.success(OK, {
    message: 'Lấy dữ liệu công nợ nhân viên thành công',
    data: result,
  });
});

export const collectCashHandler = catchErrors(async (req, res) => {
  const adminId = req.userId!;
  const { driver_id } = req.body;

  const result = await collectCashFromDriver(adminId.toString(), driver_id);

  return res.success(OK, {
    message: `Đã thu tiền thành công (${result.modifiedCount} đơn hàng)`,
    data: result,
  });
});

export const getCustomerIncidentsHandler = catchErrors(async (req, res) => {
  const { userId } = req.params;

  const result = await getCustomerCancelledOrders(userId);

  return res.success(OK, {
    message: 'Lấy lịch sử sự cố khách hàng thành công',
    data: result,
  });
});
