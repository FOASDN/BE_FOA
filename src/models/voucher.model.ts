import { IVoucher } from '@/types';
import { DiscountType } from '@/types/voucher.type';
import mongoose from 'mongoose';

const VoucherSchema = new mongoose.Schema<IVoucher>(
  {
    code: { type: String, required: true, unique: true },
    discount_type: { type: String, required: true, enum: DiscountType, default: DiscountType.NONE },
    discount_value: { type: Number, required: true },
    max_discount_amount: { type: Number, default: null },
    min_order_amount: { type: Number, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

//indexes
VoucherSchema.index({ code: 1 }, { unique: true });
VoucherSchema.index({ discount_type: 1 });
VoucherSchema.index({ start_date: 1 });
VoucherSchema.index({ end_date: 1 });

const VoucherModel = mongoose.model<IVoucher>('Voucher', VoucherSchema, 'vouchers');

export default VoucherModel;
