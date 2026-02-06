import { NOT_FOUND } from '@/constants/http';
import { OrderModel, ProductModel, UserModel, VoucherModel } from '@/models';
import appAssert from '@/utils/appAssert';
import withTransaction from '@/utils/withTransaction';
import { TOrderItem, TPlaceOrderValidator } from '@/validators/order.validator';
import mongoose from 'mongoose';

export const placeOrder = async (
  userId: mongoose.Types.ObjectId,
  { voucher: voucherId, payment_method, items }: TPlaceOrderValidator
) => {
  return withTransaction(async (session) => {
    const voucher = await VoucherModel.findById(voucherId).session(session);
    appAssert(voucher, NOT_FOUND, 'Không tìm thấy voucher');

    let sub_total = 0;

    for (let item of items) {
      const product = await ProductModel.findById(item.product_id).session(session);
      appAssert(product, NOT_FOUND, `Không tìm thấy sản phẩm: ${product?.name}`);

      appAssert(product.isAvailable, NOT_FOUND, `Sản phẩm: ${product?.name} hiện tại không có sẵn`);

      sub_total += product.price * item.quantity;
    }
    const discount_value = (sub_total * voucher.discount_value) / 100;
    let actual_discount = discount_value;

    if (voucher.max_discount_amount) {
      actual_discount = Math.min(actual_discount, voucher.max_discount_amount);
    }

    const total_price = sub_total - actual_discount;

    // get user
    const user = await UserModel.findById(userId).session(session);
    appAssert(user, NOT_FOUND, 'Không tìm thấy người dùng');

    // get address
    const default_address = user.addresses.find((address) => address.isDefault);
    appAssert(default_address, NOT_FOUND, 'Không tìm thấy địa chỉ');

    // create order
    const order = new OrderModel({
      user_id: userId,
      payment_method,
      items,
      voucher: voucherId,
      sub_total,
      total_price,
      delivery_address: default_address,
      delivery_info: {
        provider_id: user._id,
      },
    });

    await order.save({ session });

    return order;
  });
};
