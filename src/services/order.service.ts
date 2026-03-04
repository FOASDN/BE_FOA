import { BAD_REQUEST, NOT_FOUND } from '@/constants/http';
import { CartModel, OrderModel, ProductModel, UserModel } from '@/models';
import { DiscountType } from '@/types/voucher.type';
import appAssert from '@/utils/appAssert';
import withTransaction from '@/utils/withTransaction';
import { validateVoucher } from './voucher.service';
import { TPlaceOrderValidator } from '@/validators/order.validator';
import mongoose from 'mongoose';
import { PaymentMethod, OrderStatus } from '@/types/order.type';

// ────────────────────────────────────────────────────────────────────────────
// Helper: Calculate item-level sub_total
// ────────────────────────────────────────────────────────────────────────────

interface ResolvedItem {
  product_id: mongoose.Types.ObjectId;
  quantity: number;
  variations: { name: string; choice: string }[];
  sub_total: number;
}

const resolveOrderItems = async (
  rawItems: TPlaceOrderValidator['items'],
  session: mongoose.ClientSession
): Promise<{ resolvedItems: ResolvedItem[]; sub_total: number }> => {
  let sub_total = 0;
  const resolvedItems: ResolvedItem[] = [];

  for (const item of rawItems) {
    const product = await ProductModel.findById(item.product_id).session(session);

    appAssert(product, NOT_FOUND, `Không tìm thấy sản phẩm với id: ${item.product_id}`);
    appAssert(product.isAvailable, BAD_REQUEST, `Sản phẩm "${product.name}" hiện không có sẵn`);

    const itemSubTotal = product.price * item.quantity;
    sub_total += itemSubTotal;

    resolvedItems.push({
      product_id: new mongoose.Types.ObjectId(item.product_id),
      quantity: item.quantity,
      variations: item.variations ?? [],
      sub_total: itemSubTotal,
    });
  }

  return { resolvedItems, sub_total };
};

// ────────────────────────────────────────────────────────────────────────────
// Helper: Calculate discount from voucher (reuses voucher.service logic)
// ────────────────────────────────────────────────────────────────────────────

const calcDiscount = (
  discountType: string,
  discountValue: number,
  maxDiscountAmount: number | null,
  sub_total: number
): number => {
  if (discountType === DiscountType.FIXED_AMOUNT) {
    return Math.min(discountValue, sub_total);
  }

  if (discountType === DiscountType.PERCENTAGE) {
    const raw = (sub_total * discountValue) / 100;
    return maxDiscountAmount !== null ? Math.min(raw, maxDiscountAmount) : raw;
  }

  // DiscountType.NONE or unknown
  return 0;
};

// ────────────────────────────────────────────────────────────────────────────
// Main service — Place Order
// ────────────────────────────────────────────────────────────────────────────

export const placeOrder = async (userId: mongoose.Types.ObjectId, input: TPlaceOrderValidator) => {
  const { voucher: voucherId, payment_method, items, delivery_address, shipping_fee } = input;

  return withTransaction(async (session) => {
    // ── 1. Resolve & validate all items ──────────────────────────────────────
    const { resolvedItems, sub_total } = await resolveOrderItems(items, session);

    // ── 2. Apply voucher (optional) ──────────────────────────────────────────
    let actualDiscount = 0;
    let voucherObjectId: mongoose.Types.ObjectId | undefined;

    if (voucherId) {
      // Re-use the full validation logic from voucher.service
      // (checks active, dates, usage limits, min_order_amount)
      const { voucher, discountAmount } = await validateVoucher(
        // We validate by ID lookup — look up code from id first, or pass id directly
        // validateVoucher takes code, so find and pass code
        await (async () => {
          const v = await mongoose.model('Voucher').findById(voucherId).session(session);
          appAssert(v, NOT_FOUND, 'Không tìm thấy voucher');
          return v.code as string;
        })(),
        sub_total
      );

      actualDiscount = discountAmount;
      voucherObjectId = voucher._id as mongoose.Types.ObjectId;

      // Increment usage count atomically within the same transaction
      await mongoose
        .model('Voucher')
        .findByIdAndUpdate(voucherObjectId, { $inc: { current_usage_count: 1 } }, { session });
    }

    const total_price = Math.max(0, sub_total - actualDiscount + shipping_fee);

    // ── 3. Resolve delivery address ───────────────────────────────────────────
    const user = await UserModel.findById(userId).session(session);
    appAssert(user, NOT_FOUND, 'Không tìm thấy người dùng');

    // Use explicitly provided address, or fall back to user's default
    const resolvedAddress = delivery_address ?? user.addresses.find((a) => a.isDefault);
    appAssert(resolvedAddress, BAD_REQUEST, 'Không tìm thấy địa chỉ giao hàng. Vui lòng thêm địa chỉ mặc định.');

    // ── 4. Create the order ───────────────────────────────────────────────────
    const [order] = await OrderModel.create(
      [
        {
          user_id: userId,
          payment: {
            method: payment_method ?? PaymentMethod.CASH_ON_DELIVERY,
            paid_at: null,
          },
          items: resolvedItems,
          voucher: voucherObjectId ?? null,
          sub_total,
          shipping_fee,
          total_price,
          delivery_address: {
            label: resolvedAddress.label,
            receiver_name: resolvedAddress.receiver_name,
            phone: resolvedAddress.phone,
            detail: resolvedAddress.detail,
            ward: resolvedAddress.ward,
            district: resolvedAddress.district,
            city: resolvedAddress.city,
          },
          delivery_info: {
            provider_id: null,
            driver_id: null,
            shipped_at: null,
            delivered_at: null,
          },
        },
      ],
      { session }
    );

    // ── 5. Optionally clear BE cart ───────────────────────────────────────────
    // Soft-clear: remove items that were ordered (non-blocking)
    await CartModel.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } }, { session }).catch(() => {
      // Cart clear is best-effort; do not fail the order
    });

    return order;
  });
};

/**
 * Get orders for the logged-in user
 */
export const getUserOrders = async (userId: mongoose.Types.ObjectId) => {
  return OrderModel.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'items.product_id',
      select: 'name image price',
      populate: { path: 'image', select: 'secure_url' },
    });
};

/**
 * Get all orders (for Admin/Staff)
 */
export const getOrders = async (filters: any = {}) => {
  return OrderModel.find(filters)
    .sort({ createdAt: -1 })
    .populate('user_id', 'username email phone')
    .populate({
      path: 'items.product_id',
      select: 'name image price',
      populate: { path: 'image', select: 'secure_url' },
    });
};

/**
 * Get order detail by ID or Code
 */
export const getOrderById = async (idOrCode: string) => {
  const query = mongoose.Types.ObjectId.isValid(idOrCode) ? { _id: idOrCode } : { code: idOrCode };

  const order = await OrderModel.findOne(query)
    .populate('user_id', 'username email phone')
    .populate({
      path: 'items.product_id',
      select: 'name image price',
      populate: { path: 'image', select: 'secure_url' },
    });

  appAssert(order, NOT_FOUND, 'Không tìm thấy đơn hàng');
  return order;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (idOrCode: string, status: string) => {
  const order = await getOrderById(idOrCode);

  // Basic guard: once completed or cancelled, cannot change status further?
  // Depends on business logic, but usually yes.
  if (order.status === OrderStatus.completed || order.status === OrderStatus.CANCELLED) {
    appAssert(false, BAD_REQUEST, 'Không thể thay đổi trạng thái đơn hàng đã hoàn thành hoặc đã hủy');
  }

  order.status = status as any;
  await order.save();
  return order;
};
