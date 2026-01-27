import VoucherModel from '@/models/voucher.model';
import { VoucherCategory, DiscountType } from '@/types/voucher.type';
import connectToDatabase from '@/config/db';

const sampleVouchers = [
    {
        code: 'GIAM50K',
        title: 'Giảm 50K cho đơn từ 200K',
        description: 'Áp dụng cho tất cả món ăn',
        category: VoucherCategory.DISCOUNT,
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 50000,
        max_discount_amount: null,
        min_order_amount: 200000,
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-01-31'),
        usage_limit_per_user: 5,
        total_usage_limit: 1000,
        current_usage_count: 234,
        conditions: [
            'Áp dụng cho đơn hàng từ 200.000đ trở lên',
            'Không áp dụng đồng thời với các voucher khác',
            'Giới hạn 5 lần sử dụng/người dùng',
        ],
        is_active: true,
        is_stackable: false,
    },
    {
        code: 'FREESHIP30',
        title: 'Miễn phí vận chuyển',
        description: 'Cho đơn hàng dưới 5km',
        category: VoucherCategory.FREESHIP,
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 30000,
        max_discount_amount: null,
        min_order_amount: 0,
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-01-28'),
        usage_limit_per_user: 10,
        total_usage_limit: null,
        current_usage_count: 567,
        conditions: [
            'Áp dụng cho đơn hàng trong bán kính 5km',
            'Không giới hạn giá trị đơn hàng',
            'Sử dụng không giới hạn',
        ],
        is_active: true,
        is_stackable: true,
    },
    {
        code: 'WELCOME100',
        title: 'Giảm 100K cho người mới',
        description: 'Chào mừng thành viên mới',
        category: VoucherCategory.NEWUSER,
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 100000,
        max_discount_amount: null,
        min_order_amount: 150000,
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-02-15'),
        usage_limit_per_user: 1,
        total_usage_limit: 500,
        current_usage_count: 145,
        conditions: [
            'Chỉ dành cho người dùng mới',
            'Áp dụng cho đơn hàng đầu tiên từ 150.000đ',
            'Giới hạn 1 lần/tài khoản',
        ],
        is_active: true,
        is_stackable: false,
    },
    {
        code: 'COMBO20',
        title: 'Giảm 20% cho Combo',
        description: 'Tối đa 80K',
        category: VoucherCategory.DISCOUNT,
        discount_type: DiscountType.PERCENTAGE,
        discount_value: 20,
        max_discount_amount: 80000,
        min_order_amount: 100000,
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-01-25'),
        usage_limit_per_user: 3,
        total_usage_limit: 300,
        current_usage_count: 189,
        conditions: [
            'Áp dụng cho các combo từ 100.000đ',
            'Giảm tối đa 80.000đ',
            'Giới hạn 3 lần/người dùng',
        ],
        is_active: true,
        is_stackable: false,
    },
    {
        code: 'FLASH50',
        title: 'Flash Sale - Giảm 50%',
        description: 'Chỉ hôm nay!',
        category: VoucherCategory.SPECIAL,
        discount_type: DiscountType.PERCENTAGE,
        discount_value: 50,
        max_discount_amount: 150000,
        min_order_amount: 0,
        start_date: new Date('2026-01-19'),
        end_date: new Date('2026-01-19T23:59:59'),
        usage_limit_per_user: 1,
        total_usage_limit: 100,
        current_usage_count: 67,
        conditions: [
            'Áp dụng cho tất cả món ăn',
            'Giảm tối đa 150.000đ',
            'Số lượng có hạn - nhanh tay!',
        ],
        is_active: true,
        is_stackable: false,
    },
    {
        code: 'SHIP0D',
        title: 'Freeship toàn quốc',
        description: 'Không giới hạn khoảng cách',
        category: VoucherCategory.FREESHIP,
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 50000,
        max_discount_amount: null,
        min_order_amount: 99000,
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-01-30'),
        usage_limit_per_user: 5,
        total_usage_limit: 2000,
        current_usage_count: 1234,
        conditions: [
            'Áp dụng cho đơn hàng từ 99.000đ',
            'Không giới hạn khoảng cách giao hàng',
            'Giới hạn 5 lần/người dùng',
        ],
        is_active: true,
        is_stackable: true,
    },
];

async function seedVouchers() {
    try {
        await connectToDatabase();

        // Clear existing vouchers
        await VoucherModel.deleteMany({});
        console.log('Cleared existing vouchers');

        // Insert sample vouchers
        const result = await VoucherModel.insertMany(sampleVouchers);
        console.log(`✅ Successfully seeded ${result.length} vouchers`);

        // Display created vouchers
        result.forEach((voucher) => {
            console.log(`- ${voucher.code}: ${voucher.title}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding vouchers:', error);
        process.exit(1);
    }
}

seedVouchers();
