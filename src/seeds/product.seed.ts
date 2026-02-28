import ProductModel from '@/models/product.model';
import FileModel from '@/models/file.model';
import connectToDatabase from '@/config/db';
import mongoose from 'mongoose';
import { ResourceType, FileOwnerType } from '@/types/file.type';

const sampleProducts = [
    // --- PHỞ ---
    {
        name: "Phở Bò Tái Lăn",
        category: "pho",
        description: "Phở bò tái lăn bắc bộ, thịt bò xào thơm nức mũi với tỏi và gia vị, nước dùng đậm đà.",
        restaurant: "Tiệm Phở Ngon",
        price: 55000,
        rating: 4.8,
        review_count: 124,
        time: "10-15 min",
        imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&h=500&fit=crop",
        tags: ["Best Seller", "Must Try"],
        isAvailable: true
    },
    {
        name: "Phở Gà Ta",
        category: "pho",
        description: "Phở gà ta da giòn, thịt dai ngọt, nước dùng thanh trong từ xương gà hầm kỹ.",
        restaurant: "Tiệm Phở Ngon",
        price: 50000,
        rating: 4.7,
        review_count: 98,
        time: "10-15 min",
        imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&h=500&fit=crop", // Changed to safe working image
        tags: ["Healthy"],
        isAvailable: true
    },
    {
        name: "Phở Đặc Biệt (Full Topping)",
        category: "pho",
        description: "Tô đặc biệt gồm tái, nạm, gầu, gân, bò viên. Ăn là ghiền.",
        restaurant: "Tiệm Phở Ngon",
        price: 75000,
        rating: 4.9,
        review_count: 215,
        time: "15-20 min",
        imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&h=500&fit=crop",
        tags: ["Chef Choice"],
        isAvailable: true
    },

    // --- BÚN ---
    {
        name: "Bún Bò Huế",
        category: "bun",
        description: "Bún bò chuẩn vị Huế với giò heo, chả cua, huyết, nước dùng cay nồng mắm ruốc.",
        restaurant: "Tiệm Phở Ngon",
        price: 55000,
        rating: 4.8,
        review_count: 340,
        time: "10-15 min",
        imageUrl: "https://www.hungryhuy.com/wp-content/uploads/bun-bo-hue-bowl.jpg", // Changed to safe working image
        tags: ["Spicy", "Popular"],
        isAvailable: true
    },
    {
        name: "Bún Chả Hà Nội",
        category: "bun",
        description: "Chả nướng than hoa thơm lừng, nước mắm chua ngọt, ăn kèm đu đủ và rau sống.",
        restaurant: "Tiệm Phở Ngon",
        price: 60000,
        rating: 4.9,
        review_count: 180,
        time: "20-25 min",
        imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=500&fit=crop",
        tags: ["Hà Nội Authentic"],
        isAvailable: true
    },
    {
        name: "Bún Riêu Cua",
        category: "bun",
        description: "Bún riêu cua đồng, gạch cua béo ngậy, đậu hũ chiên giòn, cà chua.",
        restaurant: "Tiệm Phở Ngon",
        price: 45000,
        rating: 4.6,
        review_count: 85,
        time: "10-15 min",
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=500&fit=crop", // Generic food
        tags: [],
        isAvailable: true
    },

    // --- MÌ ---
    {
        name: "Mì Quảng Ếch",
        category: "mi",
        description: "Mì quảng ếch đậm đà hương vị miền Trung, thịt ếch chắc ngọt, nước nhưn sền sệt.",
        restaurant: "Tiệm Phở Ngon",
        price: 55000,
        rating: 4.7,
        review_count: 110,
        time: "15-20 min",
        imageUrl: "https://plus.unsplash.com/premium_photo-1664478291780-0c67f5fb15e6?w=500&h=500&fit=crop",
        tags: [],
        isAvailable: true
    },
    {
        name: "Mì Xào Giòn Hải Sản",
        category: "mi",
        description: "Mì chiên giòn rụm, sốt hải sản tôm mực rau củ tươi ngon.",
        restaurant: "Tiệm Phở Ngon",
        price: 65000,
        rating: 4.5,
        review_count: 76,
        time: "20-25 min",
        imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&h=500&fit=crop",
        tags: [],
        isAvailable: true
    },

    // --- ĐỒ UỐNG ---
    {
        name: "Cà Phê Sữa Đá",
        category: "drink",
        description: "Cà phê phin truyền thống pha với sữa đặc ngọt ngào, đậm đà tỉnh táo.",
        restaurant: "Tiệm Phở Ngon",
        price: 25000,
        rating: 5.0,
        review_count: 500,
        time: "5-10 min",
        imageUrl: "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?w=500&h=500&fit=crop",
        tags: ["Best Seller"],
        isAvailable: true
    },
    {
        name: "Trà Đào Cam Sả",
        category: "drink",
        description: "Trà đào thanh mát kết hợp vị chua của cam và hương thơm của sả.",
        restaurant: "Tiệm Phở Ngon",
        price: 35000,
        rating: 4.8,
        review_count: 230,
        time: "5-10 min",
        imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=500&fit=crop",
        tags: ["Summer Choice"],
        isAvailable: true
    },
    {
        name: "Nước Ép Cam Tươi",
        category: "drink",
        description: "Cam tươi vắt nguyên chất, nhiều vitamin C.",
        restaurant: "Tiệm Phở Ngon",
        price: 40000,
        rating: 4.9,
        review_count: 150,
        time: "5-10 min",
        imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&h=500&fit=crop",
        tags: ["Healthy"],
        isAvailable: true
    }
];

async function seedProducts() {
    try {
        await connectToDatabase();

        // Clear existing data
        await ProductModel.deleteMany({});
        await FileModel.deleteMany({ owner_type: FileOwnerType.PRODUCT }); // Only delete product files
        console.log('Cleared existing products and their files');

        const products = [];

        for (const item of sampleProducts) {
            const productId = new mongoose.Types.ObjectId();
            const { imageUrl, ...productData } = item;

            // Create fake file for the image
            const file = await FileModel.create({
                public_id: `product_${productId}_${Date.now()}`,
                secure_url: imageUrl,
                resource_type: ResourceType.IMAGE,
                width: 500,
                height: 500,
                bytes: 1024,
                format: 'jpg',
                folder: 'products',
                owner_id: productId,
                owner_type: FileOwnerType.PRODUCT
            });

            products.push({
                _id: productId,
                ...productData,
                image: file._id
            });
        }

        const result = await ProductModel.insertMany(products);
        console.log(`✅ Successfully seeded ${result.length} products with images`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();
