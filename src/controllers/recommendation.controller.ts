import { Request, Response } from 'express';
import { catchErrors } from '@/utils/asyncHandler';
import { OK } from '@/constants/http';
import UserModel from '@/models/users.model';
import ProductModel from '@/models/product.model';
import FileModel from '@/models/file.model';
import OrderModel from '@/models/order.model';
import { getAIRecommendations } from '@/services/ai.service';
import appAssert from '@/utils/appAssert';
import { NOT_FOUND } from '@/constants/http';
import { OrderStatus } from '@/types/order.type';

/**
 * Tìm danh sách top sản phẩm được đặt bởi users có healthProfile tương tự.
 * Dùng cho Collaborative Filtering.
 */
async function getSimilarUsersTopProducts(
    currentUserId: string,
    healthProfile: { allergies: string[]; conditions: string[]; dietaryGoals: string[] }
): Promise<string[]> {

    // 1. Tìm users có ít nhất 1 điểm chung trong healthProfile
    const similarUserQuery: any = { _id: { $ne: currentUserId } };
    const orConditions: any[] = [];

    if (healthProfile.allergies.length > 0) {
        orConditions.push({ 'healthProfile.allergies': { $in: healthProfile.allergies } });
    }
    if (healthProfile.conditions.length > 0) {
        orConditions.push({ 'healthProfile.conditions': { $in: healthProfile.conditions } });
    }
    if (healthProfile.dietaryGoals.length > 0) {
        orConditions.push({ 'healthProfile.dietaryGoals': { $in: healthProfile.dietaryGoals } });
    }

    if (orConditions.length === 0) return []; // Không có healthProfile → skip

    similarUserQuery.$or = orConditions;
    const similarUsers = await UserModel.find(similarUserQuery).select('_id email').lean();

    if (similarUsers.length === 0) {
        console.log('[Collaborative] Không tìm thấy user tương tự');
        return [];
    }

    console.log(`[Collaborative] Tìm thấy ${similarUsers.length} user(s) tương tự: ${similarUsers.map(u => u.email).join(', ')}`);

    // 2. Lấy các đơn hàng đã hoàn thành của nhóm users tương tự
    const similarUserIds = similarUsers.map(u => u._id);
    const orders = await OrderModel.find({
        user_id: { $in: similarUserIds },
        status: OrderStatus.completed,
    }).lean();

    if (orders.length === 0) {
        console.log('[Collaborative] Nhóm users tương tự chưa có đơn hàng');
        return [];
    }

    // 3. Đếm tần suất mỗi product_id trong các đơn hàng
    const productCount = new Map<string, number>();
    for (const order of orders) {
        for (const item of order.items) {
            const pid = item.product_id.toString();
            productCount.set(pid, (productCount.get(pid) ?? 0) + item.quantity);
        }
    }

    // 4. Lấy top 5 products phổ biến nhất, resolve tên
    const top5Ids = [...productCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

    const topProducts = await ProductModel.find({ _id: { $in: top5Ids } }).select('name').lean();

    // Giữ đúng thứ tự sort
    const nameMap = new Map(topProducts.map(p => [p._id.toString(), p.name]));
    const topNames = top5Ids.map(id => nameMap.get(id)).filter(Boolean) as string[];

    console.log(`[Collaborative] Top sản phẩm phổ biến: ${topNames.join(', ')}`);
    return topNames;
}

export const getRecommendationsHandler = catchErrors(async (req: Request, res: Response) => {
    const userId = req.userId;

    // 1. Get User Profile
    const user = await UserModel.findById(userId);
    appAssert(user, NOT_FOUND, 'User not found');

    const healthProfile = user.healthProfile || { allergies: [], conditions: [], dietaryGoals: [] };

    // 2. Cache Check Strategy
    const latestProduct = await ProductModel.findOne({ isAvailable: true })
        .sort({ updatedAt: -1 })
        .select('updatedAt');

    const lastProductUpdatedTime = (latestProduct as any)?.updatedAt
        ? new Date((latestProduct as any).updatedAt).getTime()
        : 0;

    const cache = user.aiRecommendationsCache;

    if (cache && cache.data && cache.updatedAt) {
        if (cache.updatedAt.getTime() > lastProductUpdatedTime) {
            console.log(`[AI Cache Hit] Returning cached recommendations for user ${user.email}`);
            return res.status(OK).json({
                data: cache.data,
                message: 'Lấy danh sách gợi ý thành công (Tự động)'
            });
        }
    }

    console.log(`[AI Cache Miss] Generating new recommendations for user ${user.email}...`);

    // 3. Get Products for AI
    const dbProducts = await ProductModel.find({ isAvailable: true })
        .sort({ rating: -1, review_count: -1 })
        .limit(50);

    const productsForAI = dbProducts.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        category: p.category,
        tags: p.tags,
        recipe: p.recipe,
        price: p.price,
        rating: p.rating
    }));

    // 4. Collaborative Filtering: get similar users' top products
    const similarUsersTopProducts = await getSimilarUsersTopProducts(userId!.toString(), healthProfile);

    // 5. Call AI Service (passes collaborative context to Gemini)
    const recommendations = await getAIRecommendations(
        productsForAI,
        healthProfile,
        similarUsersTopProducts
    );

    // 6. Fetch full product data for returned IDs
    const aiProductIds = recommendations.map(r => r.productId);
    const fullProducts = await ProductModel.find({ _id: { $in: aiProductIds } }).lean();

    // 7. Resolve image URLs directly from FileModel (avoids Mixed cache serialization issues)
    const imageIds = fullProducts.map(p => p.image).filter(Boolean);
    const imageFiles = await FileModel.find({ _id: { $in: imageIds } }).lean();
    const imageMap = new Map(imageFiles.map(f => [f._id.toString(), f.secure_url]));

    // 8. Merge AI reasons with full product data
    const finalResult = recommendations.map(rec => {
        const fullProduct = fullProducts.find(p => p._id.toString() === rec.productId);
        if (!fullProduct) return null;

        const imageUrl = imageMap.get((fullProduct.image as any)?.toString() ?? '') ?? null;

        return {
            product: { ...fullProduct, image: imageUrl },
            aiReason: rec.reason,
            healthScore: rec.healthScore
        };
    }).filter(item => item !== null);

    // 9. Save to Cache
    await UserModel.findByIdAndUpdate(userId, {
        aiRecommendationsCache: {
            data: finalResult,
            updatedAt: new Date()
        }
    });

    return res.status(OK).json({
        data: finalResult,
        message: 'Lấy danh sách gợi ý thành công'
    });
});
