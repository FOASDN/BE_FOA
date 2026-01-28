import { IDeliveryAddress, IOrderItem, IOrderItemVariation, OrderStatus, PaymentMethod } from '@/types/order.type';
import { IOrder } from '@/types';
import mongoose from 'mongoose';

const OrderItemVariationSchema = new mongoose.Schema<IOrderItemVariation>(
  {
    name: { type: String, required: true },
    choice: { type: String, required: true },
  },
  {
    _id: false,
  }
);

const OrderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    variations: [{ type: OrderItemVariationSchema, required: true }],
    sub_total: { type: Number, validators: { min: [0, 'Sub total must be a positive number'] } },
  },
  {
    _id: false,
  }
);

const DeliveryAddressSchema = new mongoose.Schema<IDeliveryAddress>(
  {
    label: { type: String },
    receiver_name: { type: String },
    phone: { type: String },
    detail: { type: String },
    ward: { type: String },
    district: { type: String },
    city: { type: String },
  },
  {
    _id: false,
  }
);

const DeliveryInfoSchema = new mongoose.Schema(
  {
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    shipped_at: { type: Date },
    delivered_at: { type: Date },
  },
  {
    _id: false,
  }
);

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: OrderStatus,
      default: OrderStatus.PENDING,
    },
    items: [{ type: OrderItemSchema, required: true }],
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
    shipping_fee: { type: Number, validators: { min: [0, 'Shipping fee must be a positive number'] } },
    sub_total: { type: Number, validators: { min: [0, 'Sub total must be a positive number'] } },
    total_price: { type: Number, validators: { min: [0, 'Total price must be a positive number'] } },
    payment: {
      method: { type: String, required: true, enum: PaymentMethod, default: PaymentMethod.CASH_ON_DELIVERY },
      paid_at: { type: Date },
    },
    delivery_address: { type: DeliveryAddressSchema, required: true },
    delivery_info: { type: DeliveryInfoSchema, required: true },
  },
  {
    timestamps: true,
  }
);

//indexes
OrderSchema.index({ user_id: 1 });
OrderSchema.index({ code: 1 }, { unique: true });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'payment.method': 1 });
OrderSchema.index({ 'delivery_info.shipped_at': 1 });
OrderSchema.index({ 'delivery_info.delivered_at': 1 });

const OrderModel = mongoose.model<IOrder>('Order', OrderSchema, 'orders');

export default OrderModel;
