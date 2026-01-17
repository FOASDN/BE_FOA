import mongoose from 'mongoose';
import IFile from './file.type';

export interface IProductIngredient {
  name: string;
  quantity: string;
}

export default interface IProduct extends mongoose.Document<mongoose.Types.ObjectId> {
  name: string;
  description: string;
  image: IFile['_id'];
  price: number;
  category: string;
  recipe: IProductIngredient[];
  tags: string[];
  isAvailable: boolean;
}
