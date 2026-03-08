import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import ProductModel from './src/models/product.model';

dotenv.config();

async function getProduct() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const product = await ProductModel.findOne({});
  console.log('PRODUCT_ID=' + product?._id);
  process.exit(0);
}

getProduct();
