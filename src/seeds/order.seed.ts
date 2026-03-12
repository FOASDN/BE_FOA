import connectToDatabase from '@/config/db';
import UserModel from '@/models/users.model';
import ProductModel from '@/models/product.model';
import OrderModel from '@/models/order.model';
import { OrderStatus, PaymentMethod } from '@/types/order.type';
import { randomUUID } from 'crypto';

/**
 * Seed đơn hàng giả để test Collaborative Filtering.
 * 
 * Kịch bản:
 *   - customer02 (diet - Tiểu đường, Low Carb) → thường mua: Cơm Gạo Lứt, Salad, Trà Đào
 *   - customer03 (allergy - Dị ứng đậu/sữa/trứng) → thường mua: Phở Gà, Bún Chả, Mì Quảng
 *   - customer01 (cơ bản)                         → mua đa dạng
 *
 * Chạy: npx ts-node -r tsconfig-paths/register src/seeds/order.seed.ts
 */

const DELIVERY_ADDRESS = {
    label: 'Nhà',
    receiver_name: 'Khách Test',
    phone: '0900000001',
    detail: '123 Test Street',
    ward: 'Phường 1',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
};

const DELIVERY_INFO = {
    provider_id: null,
    driver_id: null,
    shipped_at: new Date(Date.now() - 2 * 3600_000),
    delivered_at: new Date(Date.now() - 1 * 3600_000),
};

async function createOrder(
    userId: string,
    items: { productId: string; quantity: number; price: number }[],
    daysAgo: number
) {
    const orderItems = items.map(i => ({
        product_id: i.productId,
        quantity: i.quantity,
        variations: [],
        sub_total: i.price * i.quantity,
    }));

    const sub_total = orderItems.reduce((sum, i) => sum + i.sub_total, 0);
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000);

    const order = new OrderModel({
        user_id: userId,
        code: randomUUID().toUpperCase(),
        status: OrderStatus.COMPLETED,
        items: orderItems,
        voucher: null,
        sub_total,
        total_price: sub_total,
        payment: { method: PaymentMethod.CASH_ON_DELIVERY, paid_at: createdAt },
        delivery_address: DELIVERY_ADDRESS,
        delivery_info: DELIVERY_INFO,
        createdAt,
        updatedAt: createdAt,
    });

    // Bypass pre-save hook for createdAt by using insertOne
    await OrderModel.collection.insertOne({ ...order.toObject(), createdAt, updatedAt: createdAt });
}

async function seedOrders() {
    try {
        await connectToDatabase();

        // --- Lấy users ---
        const [customer01, customer02, customer03] = await Promise.all([
            UserModel.findOne({ email: 'customer@foodiedash.vn' }),
            UserModel.findOne({ email: 'diet@foodiedash.vn' }),
            UserModel.findOne({ email: 'allergy@foodiedash.vn' }),
        ]);

        if (!customer01 || !customer02 || !customer03) {
            console.error('❌ Không tìm thấy users. Hãy chạy user.seed.ts trước!');
            process.exit(1);
        }

        // --- Lấy products ---
        const products = await ProductModel.find({}).lean();
        const byName = (name: string) => products.find(p => p.name.includes(name));

        const comGaoLut = byName('Gạo Lứt');
        const saladBo = byName('Salad Bơ');
        const traDao = byName('Trà Đào');
        const sinhtoBo = byName('Sinh Tố Bơ');
        const phoGa = byName('Phở Gà');
        const bunCha = byName('Bún Chả');
        const miQuang = byName('Mì Quảng');
        const phoBoTai = byName('Phở Bò Tái');
        const cafeSua = byName('Cà Phê');
        const phoDacBiet = byName('Đặc Biệt');

        if (!comGaoLut || !saladBo || !traDao || !phoGa || !bunCha) {
            console.error('❌ Không tìm thấy đủ sản phẩm. Hãy chạy product.seed.ts trước!');
            process.exit(1);
        }

        // Xóa orders cũ của 3 customers này
        await OrderModel.deleteMany({
            user_id: { $in: [customer01._id, customer02._id, customer03._id] }
        });
        console.log('🗑  Đã xóa orders cũ của 3 customers');

        // ============================================================
        // customer02 (diet - Tiểu đường, Low Carb, Eat Clean)
        // → Yêu thích: Cơm Gạo Lứt, Salad, Trà Đào
        // ============================================================
        const uid2 = customer02._id.toString();
        await createOrder(uid2, [
            { productId: comGaoLut._id.toString(), quantity: 2, price: comGaoLut.price },
            { productId: traDao._id.toString(), quantity: 1, price: traDao.price },
        ], 1);
        await createOrder(uid2, [
            { productId: saladBo._id.toString(), quantity: 1, price: saladBo.price },
            { productId: traDao._id.toString(), quantity: 2, price: traDao.price },
        ], 5);
        await createOrder(uid2, [
            { productId: comGaoLut._id.toString(), quantity: 1, price: comGaoLut.price },
            { productId: saladBo._id.toString(), quantity: 1, price: saladBo.price },
        ], 10);
        await createOrder(uid2, [
            { productId: comGaoLut._id.toString(), quantity: 2, price: comGaoLut.price },
        ], 15);
        await createOrder(uid2, [
            { productId: traDao._id.toString(), quantity: 1, price: traDao.price },
            { productId: saladBo._id.toString(), quantity: 2, price: saladBo.price },
        ], 20);
        if (sinhtoBo) await createOrder(uid2, [
            { productId: sinhtoBo._id.toString(), quantity: 1, price: sinhtoBo.price },
            { productId: saladBo._id.toString(), quantity: 1, price: saladBo.price },
        ], 25);

        // ============================================================
        // customer03 (allergy - Dị ứng đậu phộng, sữa bò, trứng)
        // → Yêu thích: Phở Gà, Bún Chả, Mì Quảng Ếch
        // ============================================================
        const uid3 = customer03._id.toString();
        await createOrder(uid3, [
            { productId: phoGa._id.toString(), quantity: 2, price: phoGa.price },
            { productId: traDao._id.toString(), quantity: 1, price: traDao.price },
        ], 2);
        await createOrder(uid3, [
            { productId: bunCha._id.toString(), quantity: 1, price: bunCha.price },
            { productId: phoGa._id.toString(), quantity: 1, price: phoGa.price },
        ], 7);
        await createOrder(uid3, [
            { productId: phoGa._id.toString(), quantity: 3, price: phoGa.price },
        ], 12);
        if (miQuang) {
            await createOrder(uid3, [
                { productId: miQuang._id.toString(), quantity: 1, price: miQuang.price },
                { productId: phoGa._id.toString(), quantity: 1, price: phoGa.price },
            ], 18);
            await createOrder(uid3, [
                { productId: miQuang._id.toString(), quantity: 2, price: miQuang.price },
            ], 24);
        }
        await createOrder(uid3, [
            { productId: bunCha._id.toString(), quantity: 2, price: bunCha.price },
        ], 30);

        // ============================================================
        // customer01 (cơ bản - đa dạng)
        // ============================================================
        const uid1 = customer01._id.toString();
        if (phoBoTai) await createOrder(uid1, [
            { productId: phoBoTai._id.toString(), quantity: 1, price: phoBoTai.price },
            { productId: cafeSua ? cafeSua._id.toString() : traDao._id.toString(), quantity: 1, price: cafeSua?.price ?? traDao.price },
        ], 3);
        if (phoDacBiet) await createOrder(uid1, [
            { productId: phoDacBiet._id.toString(), quantity: 1, price: phoDacBiet.price },
        ], 8);
        await createOrder(uid1, [
            { productId: comGaoLut._id.toString(), quantity: 1, price: comGaoLut.price },
            { productId: phoGa._id.toString(), quantity: 1, price: phoGa.price },
        ], 14);
        await createOrder(uid1, [
            { productId: bunCha._id.toString(), quantity: 1, price: bunCha.price },
            { productId: saladBo._id.toString(), quantity: 1, price: saladBo.price },
        ], 20);

        const totalOrders = await OrderModel.countDocuments({
            user_id: { $in: [customer01._id, customer02._id, customer03._id] }
        });

        console.log(`\n🎉 Đã seed thành công ${totalOrders} đơn hàng!`);
        console.log('┌──────────────┬─────────────────────────────┬──────────────────┐');
        console.log('│ User         │ Email                       │ Yêu thích        │');
        console.log('├──────────────┼─────────────────────────────┼──────────────────┤');
        console.log('│ customer02   │ diet@foodiedash.vn          │ Cơm Lứt, Salad   │');
        console.log('│ customer03   │ allergy@foodiedash.vn       │ Phở Gà, Bún Chả  │');
        console.log('│ customer01   │ customer@foodiedash.vn      │ Đa dạng          │');
        console.log('└──────────────┴─────────────────────────────┴──────────────────┘');

        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi khi seed orders:', err);
        process.exit(1);
    }
}

seedOrders();
