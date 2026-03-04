import UserModel from '@/models/users.model';
import connectToDatabase from '@/config/db';
import { Role } from '@/types/user.type';

/**
 * Seed script — tạo tài khoản Admin, Staff, Customer để test.
 *
 * Chạy: npx ts-node -r tsconfig-paths/register src/seeds/user.seed.ts
 *
 * Tài khoản:
 *   Admin:    admin@foodiedash.vn    / Admin@123
 *   Staff:    staff@foodiedash.vn    / Staff@123
 *   Customer: customer@foodiedash.vn / Customer@123
 */

const seedUsers = [
  {
    username: 'admin1',
    email: 'admin@foodiedash.vn',
    phone: '0900000001',
    password_hash: 'Admin@123', // sẽ tự hash bởi pre-save middleware
    role: Role.ADMIN,
    isActive: true,
    verified_at: new Date(),
    collected_points: 0,
    addresses: [],
  },
  {
    username: 'staff01',
    email: 'staff@foodiedash.vn',
    phone: '0900000002',
    password_hash: 'Staff@123',
    role: Role.STAFF,
    isActive: true,
    verified_at: new Date(),
    collected_points: 0,
    addresses: [],
  },
  {
    username: 'customer01',
    email: 'customer@foodiedash.vn',
    phone: '0900000003',
    password_hash: 'Customer@123',
    role: Role.CUSTOMER,
    isActive: true,
    verified_at: new Date(),
    collected_points: 500,
    healthProfile: {
      allergies: ['Hải sản có vỏ', 'Gluten'],
      conditions: [],
      dietaryGoals: [],
    },
    addresses: [
      {
        label: 'Nhà',
        receiver_name: 'Nguyễn Văn Khách',
        phone: '0900000003',
        detail: '123 Nguyễn Huệ',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        isDefault: true,
      },
    ],
  },
  {
    username: 'customer02',
    email: 'diet@foodiedash.vn',
    phone: '0900000004',
    password_hash: 'Customer@123',
    role: Role.CUSTOMER,
    isActive: true,
    verified_at: new Date(),
    collected_points: 100,
    healthProfile: {
      allergies: [],
      conditions: ['Tiểu đường'],
      dietaryGoals: ['Low Carb', 'Eat Clean', 'Healthy'],
    },
    addresses: [],
  },
  {
    username: 'customer03',
    email: 'allergy@foodiedash.vn',
    phone: '0900000005',
    password_hash: 'Customer@123',
    role: Role.CUSTOMER,
    isActive: true,
    verified_at: new Date(),
    collected_points: 250,
    healthProfile: {
      allergies: ['Đậu phộng', 'Sữa bò', 'Trứng'],
      conditions: [],
      dietaryGoals: ['High Protein'],
    },
    addresses: [],
  },
];

async function seedUserData() {
  try {
    await connectToDatabase();

    // Xóa users cũ (chỉ xóa seed accounts, không xóa tất cả)
    const seedEmails = seedUsers.map((u) => u.email);
    const deleted = await UserModel.deleteMany({ email: { $in: seedEmails } });
    console.log(`🗑  Đã xóa ${deleted.deletedCount} tài khoản seed cũ`);

    // Tạo từng user (dùng save() để trigger pre-save hash password)
    for (const userData of seedUsers) {
      const user = new UserModel(userData);
      await user.save();
      console.log(`✅ Tạo ${user.role.padEnd(8)} → ${user.email} (password: ${userData.password_hash})`);
    }

    console.log('\n🎉 Seed thành công! Thông tin đăng nhập:');
    console.log('┌──────────┬───────────────────────────┬──────────────┐');
    console.log('│ Role     │ Email                     │ Password     │');
    console.log('├──────────┼───────────────────────────┼──────────────┤');
    console.log('│ ADMIN    │ admin@foodiedash.vn        │ Admin@123    │');
    console.log('│ STAFF    │ staff@foodiedash.vn        │ Staff@123    │');
    console.log('│ CUSTOMER │ customer@foodiedash.vn     │ Customer@123 │');
    console.log('│ CUSTOMER │ diet@foodiedash.vn         │ Customer@123 │');
    console.log('│ CUSTOMER │ allergy@foodiedash.vn      │ Customer@123 │');
    console.log('└──────────┴───────────────────────────┴──────────────┘');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed users:', error);
    process.exit(1);
  }
}

seedUserData();
