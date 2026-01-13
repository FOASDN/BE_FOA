import mongoose from 'mongoose';

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export default interface IAddresses {
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

  comparePassword(password: string): Promise<boolean>;
  omitPassword(): void;
}
