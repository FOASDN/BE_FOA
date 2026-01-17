import mongoose from 'mongoose';
import { ICartItem, ICartVariation } from './cart.type';
import IVoucher from './voucher.type';
import IUser, { IAddresses } from './user.type';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPING = 'shipping',
  completed = 'completed',
  CANCELLED = 'cancelled',
}

export interface IOrderItemVariation extends Omit<ICartVariation, 'extra_price'> {}

export interface IOrderItem extends Omit<ICartItem, 'price' | 'variations'> {
  sub_total: number;
  variations: IOrderItemVariation[];
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export interface IDeliveryAddress extends Omit<IAddresses, 'isDefault'> {}

export default interface IOrder extends mongoose.Document<mongoose.Types.ObjectId> {
  user_id: IUser['_id'];
  code: string;
  status: OrderStatus;
  items: IOrderItem[];
  voucher: IVoucher['_id'] | null;
  shipping_fee: number;
  sub_total: number;
  total_price: number;
  payment: {
    method: PaymentMethod;
    paid_at: Date | null;
  };
  delivery_address: IDeliveryAddress;
  delivery_info: {
    provider: IUser['_id'] | null;
    driver: IUser['_id'] | null;
    shipped_at: Date | null;
    delivered_at: Date | null;
  };
}
