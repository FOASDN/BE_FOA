import CartModel from '@/models/cart.model';
import ProductModel from '@/models/product.model';
import mongoose from 'mongoose';
import { AddToCartInput } from '@/validators/cart.validator';

export const addToCart = async (userId: mongoose.Types.ObjectId, input: AddToCartInput) => {
  const { product_id, quantity } = input;

  if (!userId) throw new Error('Unauthorized');

  if (!mongoose.Types.ObjectId.isValid(product_id)) {
    throw new Error('Invalid product_id');
  }

  const product: any = await ProductModel.findById(product_id).lean();
  if (!product) throw new Error('Product not found');
  if (product.isAvailable === false) throw new Error('Product is not available');

  const unitPrice = Number(product.price ?? 0);

  const cart =
    (await CartModel.findOne({ user_id: userId })) ??
    (await CartModel.create({ user_id: userId, items: [] }));

  const existed = cart.items.find((it: any) => {
    const sameProduct = String(it.product_id) === String(product_id);
    const noVariations = !it.variations || it.variations.length === 0;
    return sameProduct && noVariations;
  });

  if (existed) {
    existed.quantity += quantity;
    existed.price = unitPrice;
    existed.variations = [];
  } else {
    cart.items.push({
      product_id,
      quantity,
      price: unitPrice,
      variations: [],
    } as any);
  }

  await cart.save();
  return cart;
};