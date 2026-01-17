import { IProduct } from '@/types';
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    price: {
      type: Number,
      required: true,
      validators: {
        min: [0, 'Price must be a positive number'],
      },
    },
    category: { type: String, required: true },
    recipe: [
      {
        name: { type: String, required: true },
        quantity: { type: String, required: true },
      },
    ],
    tags: [{ type: String }],
    isAvailable: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

//indexes
ProductSchema.index({ name: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isAvailable: 1 });

const ProductModel = mongoose.model<IProduct>('Product', ProductSchema, 'products');

export default ProductModel;
