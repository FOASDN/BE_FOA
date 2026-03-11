import mongoose from 'mongoose';

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export interface IAddresses {
  label: string;
  receiver_name: string;
  phone: string;
  detail: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export interface IPreferences {
  dietary: string[];
  allergies: string[];
  health_goals: string[];
}

export default interface IUser extends mongoose.Document<mongoose.Types.ObjectId> {
  fullName?: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string | null;
  avatar_public_id?: string | null;
  password_hash: string;
  role: Role;
  addresses: IAddresses[];
  preferences: IPreferences;
  verified_at: Date;
  isActive: boolean;
  collected_points: number;

  aiRecommendationsCache?: {
    data?: any;
    safeFoodsData?: any;
    updatedAt: Date;
  };

  comparePassword(password: string): Promise<boolean>;
  omitPassword(): Omit<IUser, 'password_hash'>;
}
