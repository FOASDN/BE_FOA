import * as dotenv from 'dotenv';
import connectToDatabase from './src/config/db';
import UserModel from './src/models/users.model';
import jwt from 'jsonwebtoken';

dotenv.config();

async function testApiCache() {
    await connectToDatabase();

    // Get a user to test
    const user = await UserModel.findOne({ email: 'diet@foodiedash.vn' });
    if (!user) throw new Error("User not found");

    // Clear cache to start fresh
    await UserModel.findByIdAndUpdate(user._id, { aiRecommendationsCache: null });

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '1d',
    });

    console.log("Testing First Call (Expect Gemini Delay)...");
    const start1 = Date.now();
    const res1 = await fetch('http://localhost:3000/api/v1/products/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const r1Text = await res1.text();
    console.log(`First call took ${Date.now() - start1}ms. Status:`, res1.status);
    console.log("Response:", r1Text);

    console.log("Testing Second Call (Expect Cache Hit, <100ms)...");
    const start2 = Date.now();
    const res2 = await fetch('http://localhost:3000/api/v1/products/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const r2 = await res2.json();
    console.log(`Second call took ${Date.now() - start2}ms. Status:`, res2.status, r2.message);

    process.exit(0);
}

async function run() {
    try {
        await testApiCache();
    } catch (e: any) {
        console.error("Test failed:", e.message);
        process.exit(1);
    }
}
run();
