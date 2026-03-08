import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import UserModel from './src/models/users.model';
import ProductModel from './src/models/product.model';

dotenv.config();

async function testFilter() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  
  const user = await UserModel.findOne({ email: 'customer01@foodiedash.vn' }); // Maybe the user is testing on customer01 or diet or allergy? 
  // Let's just fetch all users and check their allergies
  const users = await UserModel.find({});
  for (const u of users) {
    if (u.preferences && u.preferences.allergies && u.preferences.allergies.length > 0) {
      console.log(`User: ${u.email}, Allergies: ${JSON.stringify(u.preferences.allergies)}`);
    }
  }

  const salmon = await ProductModel.findOne({ name: { $regex: /Cơm Gạo Lứt Cá Hồi/i } });
  console.log(`\nSalmon ingredients: ${JSON.stringify(salmon?.recipe)}`);

  process.exit(0);
}

testFilter();
