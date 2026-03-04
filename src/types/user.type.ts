import mongoose from 'mongoose';

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export interface IHealthProfile {
  allergies: string[];       // e.g. ['hải sản', 'đậu phộng', 'gluten']
  conditions: string[];      // e.g. ['tiểu đường', 'cao huyết áp']
  dietaryGoals: string[];    // e.g. ['low-carb', 'high-protein', 'ăn chay']
}

export interface IAddresses {
  label: string;
  receiver_name: string;
  phone: string;
  detail: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export default interface IUser extends mongoose.Document<mongoose.Types.ObjectId> {
  username: string;
  email: string;
  phone: string;
  password_hash: string;
  role: Role;
  addresses: IAddresses[];
  verified_at: Date;
  isActive: boolean;
  collected_points: number;
  healthProfile: IHealthProfile;
  aiRecommendationsCache?: {
    data: any;
    updatedAt: Date;
  };

  comparePassword(password: string): Promise<boolean>;
  omitPassword(): Omit<IUser, 'password_hash'>;
}
