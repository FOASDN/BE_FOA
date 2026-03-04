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
        recipe: [{ name: "Bánh phở" }, { name: "Thịt bò" }, { name: "Hành lá" }, { name: "Nước hầm xương" }],
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
        imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&h=500&fit=crop",
        tags: ["Healthy"],
        recipe: [{ name: "Bánh phở" }, { name: "Thịt gà" }, { name: "Hành lá" }],
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
        recipe: [{ name: "Bánh phở" }, { name: "Thịt bò" }, { name: "Bò viên" }, { name: "Gân bò" }],
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
        imageUrl: "https://www.hungryhuy.com/wp-content/uploads/bun-bo-hue-bowl.jpg",
        tags: ["Spicy", "Popular"],
        recipe: [{ name: "Bún" }, { name: "Thịt bò" }, { name: "Giò heo" }, { name: "Chả cua" }, { name: "Mắm ruốc" }, { name: "Hải sản có vỏ" }],
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
        recipe: [{ name: "Bún" }, { name: "Thịt heo" }, { name: "Đu đủ" }, { name: "Nước mắm" }],
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
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=500&fit=crop",
        tags: [],
        recipe: [{ name: "Bún" }, { name: "Cua đồng" }, { name: "Đậu hũ" }, { name: "Cà chua" }, { name: "Hải sản có vỏ" }],
        isAvailable: true
    },

    // --- MÌ & CƠM ---
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
        tags: ["Đặc sản"],
        recipe: [{ name: "Mì Quảng" }, { name: "Thịt ếch" }, { name: "Đậu phộng" }, { name: "Bánh tráng" }],
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
        tags: ["Hải sản"],
        recipe: [{ name: "Mì trứng" }, { name: "Tôm" }, { name: "Mực" }, { name: "Rau cải" }, { name: "Hải sản có vỏ" }, { name: "Gluten" }],
        isAvailable: true
    },
    {
        name: "Cơm Gạo Lứt Gà Nướng",
        category: "com",
        description: "Cơm gạo lứt ăn kèm ức gà nướng áp chảo và rau củ luộc.",
        restaurant: "Healthy Life",
        price: 70000,
        rating: 4.9,
        review_count: 320,
        time: "15-20 min",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop",
        tags: ["Healthy", "Low Carb", "Eat Clean"],
        recipe: [{ name: "Gạo lứt" }, { name: "Ức gà" }, { name: "Bông cải xanh" }, { name: "Cà rốt" }],
        isAvailable: true
    },
    {
        name: "Salad Bơ Trứng Dầu Giấm",
        category: "salad",
        description: "Salad rau xanh tươi mát kết hợp với bơ sáp béo ngậy và trứng luộc.",
        restaurant: "Healthy Life",
        price: 45000,
        rating: 4.8,
        review_count: 140,
        time: "5-10 min",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop",
        tags: ["Healthy", "Vegetarian", "Diet"],
        recipe: [{ name: "Xà lách" }, { name: "Bơ" }, { name: "Trứng" }, { name: "Cà chua bi" }, { name: "Dầu ô liu" }],
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
        recipe: [{ name: "Cà phê" }, { name: "Sữa đặc" }, { name: "Sữa bò" }],
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
        recipe: [{ name: "Trà đen" }, { name: "Đào miếng" }, { name: "Cam" }, { name: "Sả" }],
        isAvailable: true
    },
    {
        name: "Sinh Tố Bơ Đậu Phộng",
        category: "drink",
        description: "Sinh tố bơ béo ngậy xay cùng bơ đậu phộng nguyên chất, rất giàu năng lượng.",
        restaurant: "Healthy Drinks",
        price: 50000,
        rating: 4.9,
        review_count: 150,
        time: "5-10 min",
        imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&h=500&fit=crop",
        tags: ["High Protein"],
        recipe: [{ name: "Bơ sáp" }, { name: "Bơ đậu phộng" }, { name: "Sữa tươi" }, { name: "Đậu phộng" }],
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
