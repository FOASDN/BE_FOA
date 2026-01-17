import mongoose from 'mongoose';

export enum DiscountType {
  NONE = 'none',
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

export default interface IVoucher extends mongoose.Document<mongoose.Types.ObjectId> {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  start_date: Date;
  end_date: Date;
}
