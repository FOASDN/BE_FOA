import ProductModel from '@/models/product.model';
import FileModel from '@/models/file.model';
import connectToDatabase from '@/config/db';
import mongoose from 'mongoose';
import { ResourceType, FileOwnerType } from '@/types/file.type';

const sampleProducts = [
    {
        name: "Classic Double Cheese Burger",
        category: "burger",
        description: "Hai lớp bò nướng lửa hồng, phô mai cheddar tan chảy, rau tươi và sốt đặc biệt.",
        restaurant: "Burger Palace",
        price: 12.50,
        rating: 4.8,
        review_count: 324,
        time: "30-40 min",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop",
        tags: ["Best Seller"],
        isAvailable: true
    },
    {
        name: "Spicy Pepperoni Pizza",
        category: "pizza",
        description: "Pizza đế mỏng giòn rụm với pepperoni cay nồng và phô mai mozzarella.",
        restaurant: "Italian House",
        price: 18.00,
        rating: 4.6,
        review_count: 189,
        time: "40-50 min",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop",
        tags: ["Spicy", "Popular"],
        isAvailable: true
    },
    {
        name: "Signature Poke Bowl",
        category: "healthy",
        description: "Cá hồi tươi, bơ, dưa leo, rong biển và cơm gạo lứt.",
        restaurant: "Zen Kitchen",
        price: 15.75,
        rating: 4.9,
        review_count: 267,
        time: "15-20 min",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop",
        tags: ["Healthy"],
        isAvailable: true
    },
    {
        name: "Dragon Sushi Roll",
        category: "sushi",
        description: "Cuộn sushi hình rồng với lươn nướng, bơ và trứng cá chuồn.",
        restaurant: "Sushi Sake",
        price: 24.00,
        rating: 4.7,
        review_count: 156,
        time: "40-50 min",
        imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=500&fit=crop",
        tags: ["Chef Choice"],
        isAvailable: true
    },
    {
        name: "Premium Angus Burger",
        category: "burger",
        description: "Thịt bò Angus cao cấp, nấm xào, hành caramel và phô mai Swiss.",
        restaurant: "Gourmet Burgers",
        price: 8.50,
        rating: 4.8,
        review_count: 423,
        time: "25-35 min",
        imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&h=500&fit=crop",
        tags: [],
        isAvailable: true
    },
    {
        name: "Grilled Ribeye Steak",
        category: "healthy",
        description: "Bò Ribeye nướng tái vừa, ăn kèm khoai tây nghiền và rau củ.",
        restaurant: "Prime Grill",
        price: 32.00,
        rating: 4.9,
        review_count: 234,
        time: "45-55 min",
        imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&h=500&fit=crop",
        tags: ["Premium"],
        isAvailable: true
    },
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
